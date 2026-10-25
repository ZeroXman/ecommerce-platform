# NovaShop · Plataforma E-Commerce Full-Stack

Tienda online completa construida para portafolio: catálogo con filtros, carrito persistente,
checkout con pagos (Stripe en modo test o modo demo), autenticación JWT con refresh tokens y
panel de administración con métricas.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | **React 18 + Vite**, React Router 6, Redux Toolkit, Axios |
| Backend | **Node.js 18+ + Express 4**, ESM |
| Base de datos | **MongoDB Atlas** (Mongoose ODM) |
| Autenticación | **JWT propio**: access token (15 min) + refresh token rotativo en cookie httpOnly |
| Pagos | **Stripe Payment Intents** (claves de prueba) con **modo demo** automático |
| Seguridad | Helmet, CORS con credenciales, rate limit, validación con express-validator, bcrypt (12 rounds) |
| Calidad | Smoke test end-to-end con `mongodb-memory-server` (43 assertions) |

---

## Características

**Tienda**
- Home con categorías y productos destacados.
- Catálogo con búsqueda, filtro por categoría y rango de precio, 6 ordenamientos y paginación.
- Ficha de producto: galería, stock, descuento, reseñas con puntuación y productos relacionados.
- Carrito persistente en `localStorage` con cantidades editables.
- Checkout en 2 pasos (dirección → pago) con resumen de costos calculados **siempre en el servidor**.
- Historial de pedidos, detalle con línea de tiempo de seguimiento y cancelación de pedidos pendientes.
- Perfil: nombre, cambio de contraseña y direcciones guardadas.

**Autenticación**
- Registro, login, logout y sesión restaurada al recargar (refresh token httpOnly).
- Rotación de refresh token y revocación al cerrar sesión.
- Rutas protegidas en el cliente (`ProtectedRoute`) y middleware `protect`/`admin` en el servidor.

**Pagos**
- Si no hay claves de Stripe → **modo demo**: se crea un PaymentIntent simulado y el pedido se marca como pagado sin cargo real.
- Si hay claves → `stripe.paymentIntents.create` + confirmación en el cliente con `PaymentElement`,
  verificación del importe en el servidor y webhook opcional (`POST /api/payments/webhook`).
- El stock se descuenta de forma atómica **solo al confirmar el pago**.

**Administración** (`/admin`, solo rol `admin`)
- Dashboard: ingresos, pedidos, productos, ventas por mes, top 5 vendidos, stock bajo y breakdown por estado.
- Productos: crear, editar, ocultar, eliminar y buscar con paginación.
- Pedidos: cambiar estado (proceso → enviado → entregado / cancelado).
- Usuarios: promover a admin, activar/desactivar, eliminar (si no tiene pedidos).

---

## Estructura

```
ecommerce-platform/
├── server/                     # API REST
│   ├── src/
│   │   ├── config/             # env.js (configuración), db.js (conexión)
│   │   ├── models/             # User, Product, Category, Order, Review
│   │   ├── middleware/         # auth (protect/admin), validación, errores
│   │   ├── controllers/        # auth, productos, pedidos, pagos, admin
│   │   ├── routes/             # rutas Express
│   │   ├── services/           # stripeService.js
│   │   ├── utils/              # tokens, ApiError, pricing, seeder
│   │   ├── app.js              # express app
│   │   └── server.js           # arranque
│   └── scripts/
│       ├── seed.js             # datos de ejemplo
│       ├── dev-memory-server.js# MongoDB temporal en memoria + seed
│       └── smoke-test.js       # 43 pruebas end-to-end
└── client/                     # Frontend React
    └── src/
        ├── api/client.js       # axios + interceptor de refresh
        ├── app/store.js        # Redux Toolkit
        ├── features/           # auth, cart, products, orders, ui
        ├── components/         # Navbar, ProductCard, Feedback, Toaster...
        ├── pages/              # Inicio, catálogo, producto, carrito, checkout...
        │   └── admin/          # dashboard, productos, pedidos, usuarios
        └── styles/index.css
```

---

## Puesta en marcha

### 1. Requisitos

- Node.js ≥ 18 y npm.
- Una cuenta de [MongoDB Atlas](https://www.mongodb.com/atlas) (capa gratuita) **o** MongoDB local.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env       # y completa MONGODB_URI con tu cadena de Atlas
npm run seed               # crea categorías, 12 productos y usuarios de prueba
npm run dev                # API en http://localhost:5000
```

Sin `.env` / sin `MONGODB_URI` puedes usar una base temporal en memoria:

```bash
npm run dev:memory
```

### 3. Frontend

```bash
cd client
npm install
npm run dev                # web en http://localhost:5173
```

Vite hace proxy de `/api` hacia `http://localhost:5000`.

### 4. Verificación

```bash
cd server
npm run test:smoke         # 43 pruebas: auth, catálogo, pedidos, pagos, admin, seguridad
```

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@shop.com` | `Admin123!` |
| Cliente | `demo@shop.com` | `Demo123!` |

---

## Pagos: demo y modo test

1. **Modo demo (por defecto)**: no requiere nada. El checkout muestra un botón que confirma un
   pago simulado y el pedido pasa a `paid` con descuento de stock.
2. **Modo Stripe test**: crea claves de prueba en el dashboard de Stripe y añade a `server/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Reinicia la API. El checkout mostrará el `PaymentElement` real de Stripe. Para probar tarjetas usa
la [tarjeta de prueba 4242 4242 4242 4242](https://docs.stripe.com/testing) (cualquier fecha futura, CVC al azar).

Webhook (opcional):

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## API (resumen)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | – | Registro |
| POST | `/api/auth/login` | – | Login (devuelve access token + cookie refresh) |
| POST | `/api/auth/refresh` | cookie | Rota el refresh token |
| POST | `/api/auth/logout` | – | Revoca sesión |
| GET | `/api/auth/me` | JWT | Perfil |
| PUT | `/api/auth/profile` / `/password` | JWT | Actualizar datos |
| GET | `/api/products` | – | Lista con `search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` |
| GET | `/api/products/featured` · `/api/products/:slug` | – | Destacados / detalle con reseñas y relacionados |
| POST | `/api/products/:id/reviews` | JWT | Crear reseña (una por usuario) |
| POST/PUT/DELETE | `/api/products[/:id]` | admin | CRUD de productos |
| GET/POST | `/api/categories` | – / admin | Categorías con conteo |
| POST | `/api/orders` | JWT | Crear pedido (precios y stock validados en servidor) |
| GET | `/api/orders/mine` · `/api/orders/:id` | JWT | Historial / detalle (solo dueño o admin) |
| POST | `/api/orders/:id/pay` | JWT | Confirmar pago (demo o Stripe) |
| PUT | `/api/orders/:id/cancel` | JWT | Cancelar pedido pendiente |
| GET | `/api/payments/config` | – | Modo de pago y clave publicable |
| POST | `/api/payments/create-intent` | JWT | Crea el PaymentIntent |
| POST | `/api/payments/webhook` | firma | Eventos de Stripe |
| GET | `/api/admin/stats` · `/orders` · `/users` | admin | Métricas y gestión |

Respuestas: `{ "ok": true, ... }` o `{ "ok": false, "error": "...", "details": [...] }`.

---

## Despliegue

**Backend** (Render / Railway / VPS con PM2):

1. Sube `server/` y ejecuta `npm ci && npm run build` (no hay build, solo `npm ci`).
2. Define las variables de `.env.example` (`NODE_ENV=production`, secretos aleatorios, `MONGODB_URI`, `CLIENT_ORIGIN`).
3. Arranca con `npm start` (o `node src/server.js`).

**Frontend** (Vercel / Netlify):

1. Build: `cd client && npm run build`.
2. Publica `client/dist` como estático.
3. Define `VITE_API_URL=https://tu-api.com` para que el cliente llame a la API en producción
   (en build, `VITE_API_URL` define el `baseURL` de axios).

---

## Roadmap

- Login social con Google (OAuth 2.0).
- Cupones y descuentos por código.
- Correos transaccionales de confirmación de pedido.
- Subida de imágenes propias (S3/Cloudinary) en lugar de URLs.
- Tests unitarios con Vitest + Testing Library.

---

## Licencia

MIT.
