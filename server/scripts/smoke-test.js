import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seeder.js';
import { env } from '../src/config/env.js';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, extra = '') {
  if (condition) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    failures.push(`${name} ${extra}`);
    console.log(`  FAIL ${name} ${extra}`);
  }
}

async function main() {
  process.env.DEMO_PAYMENTS = 'true';

  const mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
  await seedDatabase({ reset: true });

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const base = `http://127.0.0.1:${server.address().port}`;
  const json = (res) => res.json();

  const post = (path, body, token) =>
    fetch(base + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }).then(async (res) => ({ status: res.status, body: await json(res) }));

  const get = (path, token) =>
    fetch(base + path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async (res) => ({ status: res.status, body: await json(res) }));

  const put = (path, body, token) =>
    fetch(base + path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }).then(async (res) => ({ status: res.status, body: await json(res) }));

  console.log('\n== Salud y catálogo ==');
  const health = await get('/api/health');
  check('GET /api/health responde 200', health.status === 200 && health.body.ok === true);

  const catalog = await get('/api/products?limit=5');
  check('GET /api/products devuelve lista', catalog.status === 200 && catalog.body.products.length === 5);
  check('Paginación calculada', catalog.body.total >= 12 && catalog.body.pages >= 3);

  const featured = await get('/api/products/featured');
  check('GET /api/products/featured filtra destacados', featured.body.products.every((p) => p.isFeatured));

  const search = await get('/api/products?search=teclado');
  check('Búsqueda por texto funciona', search.body.products.some((p) => /teclado/i.test(p.name)));

  const categories = await get('/api/categories');
  check('GET /api/categories con conteo', categories.body.categories.every((c) => typeof c.productCount === 'number'));
  const electronics = categories.body.categories.find((c) => c.slug === 'electronica');

  const byCategory = await get('/api/products?category=electronica');
  check('Filtro por categoría funciona', byCategory.body.products.length > 0);

  const sorted = await get('/api/products?sort=price_asc&limit=3');
  const prices = sorted.body.products.map((p) => p.price);
  check('Orden por precio ascendente', prices[0] <= prices[1] && prices[1] <= prices[2]);

  const detail = await get(`/api/products/${byCategory.body.products[0].slug}`);
  check('Detalle de producto por slug', detail.status === 200 && detail.body.product.slug === byCategory.body.products[0].slug);
  const productId = detail.body.product._id;

  console.log('\n== Autenticación ==');
  const register = await post('/api/auth/register', {
    name: 'Tester QA',
    email: 'tester@shop.com',
    password: 'Tester123!',
  });
  check('Registro devuelve token', register.status === 201 && Boolean(register.body.accessToken));
  const userToken = register.body.accessToken;

  const weakPassword = await post('/api/auth/register', {
    name: 'Débil',
    email: 'weak@shop.com',
    password: '123',
  });
  check('Contraseña débil rechazada (422)', weakPassword.status === 422);

  const duplicate = await post('/api/auth/register', {
    name: 'Duplicado',
    email: 'tester@shop.com',
    password: 'Tester123!',
  });
  check('Email duplicado devuelve 409', duplicate.status === 409);

  const badLogin = await post('/api/auth/login', { email: 'tester@shop.com', password: 'incorrecta' });
  check('Login incorrecto devuelve 401', badLogin.status === 401);

  const adminLogin = await post('/api/auth/login', {
    email: env.seed.adminEmail,
    password: env.seed.adminPassword,
  });
  check('Login admin correcto', adminLogin.status === 200 && adminLogin.body.user.role === 'admin');
  const adminToken = adminLogin.body.accessToken;

  const me = await get('/api/auth/me', userToken);
  check('GET /api/auth/me con token', me.status === 200 && me.body.user.email === 'tester@shop.com');

  const noToken = await get('/api/auth/me');
  check('GET /api/auth/me sin token devuelve 401', noToken.status === 401);

  const refreshCookie = await fetch(base + '/api/auth/refresh', { method: 'POST' });
  check('Refresh sin cookie devuelve 401', refreshCookie.status === 401);

  console.log('\n== Reseñas ==');
  const review = await post(`/api/products/${productId}/reviews`, { rating: 5, comment: 'Muy buen producto, lo recomiendo.' }, userToken);
  check('Crear reseña autenticado', review.status === 201);

  const duplicatedReview = await post(`/api/products/${productId}/reviews`, { rating: 4, comment: 'Otra reseña.' }, userToken);
  check('Reseña duplicada devuelve 409', duplicatedReview.status === 409);

  const badReview = await post(`/api/products/${productId}/reviews`, { rating: 9, comment: 'x' }, userToken);
  check('Rating fuera de rango rechazado', badReview.status === 422);

  const afterReview = await get(`/api/products/${detail.body.product.slug}`);
  check('Rating del producto recalculado', afterReview.body.product.numReviews >= 1 && afterReview.body.product.rating > 0);

  console.log('\n== Carrito y pedidos ==');
  const shippingAddress = {
    fullName: 'Tester QA',
    phone: '999888777',
    address: 'Av. Siempre Viva 742',
    city: 'Lima',
    postalCode: '15001',
    country: 'Perú',
  };

  const order = await post(
    '/api/orders',
    { items: [{ product: productId, quantity: 2 }], shippingAddress, paymentMethod: 'demo' },
    userToken
  );
  check('Crear pedido', order.status === 201 && order.body.order.items.length === 1);
  const orderId = order.body.order._id;

  const expectedTax = Math.round(order.body.order.itemsPrice * env.payments.taxRate * 100) / 100;
  check('IVA calculado en servidor', Math.abs(order.body.order.taxPrice - expectedTax) < 0.02);
  check('Total = items + envío + IVA',
    Math.abs(order.body.order.totalPrice - (order.body.order.itemsPrice + order.body.order.shippingPrice + order.body.order.taxPrice)) < 0.02);

  const badOrder = await post('/api/orders', { items: [{ product: productId, quantity: 9999 }], shippingAddress }, userToken);
  check('Stock insuficiente rechazado (409)', badOrder.status === 409);

  const foreignOrder = await post('/api/orders', { items: [{ product: productId, quantity: 1 }], shippingAddress }, adminToken);
  const foreignId = foreignOrder.body.order._id;
  const forbiddenView = await get(`/api/orders/${foreignId}`, userToken);
  check('No se puede ver pedido ajeno (403)', forbiddenView.status === 403);

  console.log('\n== Pagos (modo demo) ==');
  const paymentConfig = await get('/api/payments/config');
  check('Config de pagos indica modo demo', paymentConfig.body.demoMode === true);

  const intent = await post('/api/payments/create-intent', { orderId }, userToken);
  check('Crear intención de pago demo', intent.status === 200 && intent.body.demo === true && intent.body.clientSecret.startsWith('demo_'));

  const pay = await post(`/api/orders/${orderId}/pay`, { paymentIntentId: intent.body.clientSecret.split('_secret')[0] }, userToken);
  check('Confirmar pago simulado', pay.status === 200 && pay.body.order.isPaid === true && pay.body.order.status === 'paid');

  const stockAfter = await get(`/api/products/${detail.body.product.slug}`);
  check('Stock descontado tras el pago', stockAfter.body.product.stock === detail.body.product.stock - 2);

  const doublePay = await post(`/api/orders/${orderId}/pay`, { paymentIntentId: intent.body.clientSecret.split('_secret')[0] }, userToken);
  check('No se puede pagar dos veces (idempotente)', doublePay.status === 200 && doublePay.body.order.isPaid === true);

  const myOrders = await get('/api/orders/mine', userToken);
  check('Historial de pedidos del usuario', myOrders.body.orders.length === 1);

  const badIntent = await post('/api/payments/create-intent', { orderId: foreignId }, userToken);
  check('No crear pago para pedido ajeno (403)', badIntent.status === 403);

  console.log('\n== Administración ==');
  const stats = await get('/api/admin/stats', adminToken);
  check('Stats de admin', stats.status === 200 && stats.body.stats.revenue > 0 && stats.body.stats.orders >= 1);

  const usersList = await get('/api/admin/users', adminToken);
  check('Listado de usuarios', usersList.status === 200 && usersList.body.users.length >= 3);

  const newCategory = await post('/api/categories', { name: 'Juguetes' }, adminToken);
  check('Admin crea categoría', newCategory.status === 201 && newCategory.body.category.slug === 'juguetes');

  const newProduct = await post(
    '/api/products',
    {
      name: 'Producto de Prueba QA',
      description: 'Descripción suficientemente larga para pasar la validación.',
      price: 25.5,
      stock: 10,
      category: newCategory.body.category._id,
    },
    adminToken
  );
  check('Admin crea producto', newProduct.status === 201);
  const newProductId = newProduct.body.product._id;

  const updatedProduct = await put(`/api/products/${newProductId}`, { price: 30, stock: 5 }, adminToken);
  check('Admin actualiza producto', updatedProduct.status === 200 && updatedProduct.body.product.price === 30);

  const forbiddenCreate = await post(
    '/api/products',
    { name: 'Hack', description: 'Intento sin permisos de administrador.', price: 1, stock: 1, category: newCategory.body.category._id },
    userToken
  );
  check('Usuario normal no puede crear productos (403)', forbiddenCreate.status === 403);

  const statusUpdate = await put(`/api/admin/orders/${foreignId}/status`, { status: 'shipped' }, adminToken);
  check('Admin actualiza estado del pedido', statusUpdate.status === 200 && statusUpdate.body.order.status === 'shipped');

  const deletedProduct = await fetch(`${base}/api/products/${newProductId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  check('Admin elimina producto', deletedProduct.status === 200);

  console.log('\n== Errores y seguridad ==');
  const notFound = await get('/api/no-existe');
  check('Ruta inexistente devuelve 404', notFound.status === 404);

  const badId = await get('/api/products/no-existe-este-slug');
  check('Slug inexistente devuelve 404', badId.status === 404);

  console.log(`\n${passed} pruebas correctas, ${failed} fallidas.`);

  server.close();
  await disconnectDB();
  await mongod.stop();

  if (failed > 0) {
    console.log('\nFallos:');
    failures.forEach((f) => console.log(` - ${f}`));
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Error ejecutando el smoke test:', error);
  process.exit(1);
});
