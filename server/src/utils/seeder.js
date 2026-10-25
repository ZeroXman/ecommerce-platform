import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { env } from '../config/env.js';

const CATEGORIES = [
  { name: 'Electrónica', description: 'Gadgets, audio y accesorios tecnológicos.' },
  { name: 'Ropa', description: 'Moda urbana y básicos de calidad.' },
  { name: 'Hogar', description: 'Todo para tu casa y tu escritorio.' },
  { name: 'Deportes', description: 'Equipo para entrenar en serio.' },
];

const PRODUCTS = [
  {
    name: 'Auriculares Bluetooth Pro',
    category: 'Electrónica',
    price: 129.99,
    compareAtPrice: 179.99,
    stock: 34,
    brand: 'SoundCore',
    isFeatured: true,
    shortDescription: 'Cancelación activa de ruido y 40 h de batería.',
    description:
      'Auriculares inalámbricos con cancelación activa de ruido híbrida, modo transparencia, controles táctiles y hasta 40 horas de reproducción con el estuche. Bluetooth 5.3 multipunto.',
    tags: ['audio', 'bluetooth', 'inalambrico'],
  },
  {
    name: 'Teclado Mecánico RGB 75%',
    category: 'Electrónica',
    price: 89.5,
    compareAtPrice: 0,
    stock: 21,
    brand: 'KeyForge',
    isFeatured: true,
    shortDescription: 'Switches lineales hot-swap y chasis de aluminio.',
    description:
      'Teclado mecánico compacto al 75% con switches lineales hot-swap, keycaps PBT de doble inyección, iluminación RGB por tecla y conexión USB-C trenzada desmontable.',
    tags: ['teclado', 'gaming', 'rgb'],
  },
  {
    name: 'Smartwatch Serie 7',
    category: 'Electrónica',
    price: 199.0,
    compareAtPrice: 249.0,
    stock: 12,
    brand: 'PulseTech',
    isFeatured: true,
    shortDescription: 'GPS integrado, SpO2 y pantalla AMOLED.',
    description:
      'Reloj inteligente con pantalla AMOLED siempre activa, GPS integrado, medición de oxígeno en sangre, más de 100 modos deportivos y 14 días de autonomía.',
    tags: ['wearable', 'fitness'],
  },
  {
    name: 'Cámara Instantánea Retro',
    category: 'Electrónica',
    price: 74.99,
    compareAtPrice: 0,
    stock: 18,
    brand: 'FujiStyle',
    shortDescription: 'Revelado al instante con lente de enfoque automático.',
    description:
      'Cámara instantánea de diseño retro con flash automático, lente de enfoque automático y modos de exposición selfie y paisaje. Incluye 10 fotos de regalo.',
    tags: ['camara', 'fotografia'],
  },
  {
    name: 'Polera Oversize Algodón Pima',
    category: 'Ropa',
    price: 34.9,
    compareAtPrice: 49.9,
    stock: 60,
    brand: 'Lima Basics',
    isFeatured: true,
    shortDescription: 'Algodón pima peruano, corte relajado unisex.',
    description:
      'Polera oversize confeccionada en algodón pima peruano de 240 g/m². Cuello reforzado, costuras planas y lavado que no deforma ni encoge.',
    tags: ['ropa', 'algodon', 'basicos'],
  },
  {
    name: 'Casaca Rompevientos Ultraligera',
    category: 'Ropa',
    price: 79.0,
    compareAtPrice: 99.0,
    stock: 25,
    brand: 'NorthTrail',
    shortDescription: 'Resistente al agua y plegable en su bolsillo.',
    description:
      'Casaca rompevientos ultraligera con tratamiento repelente al agua, cierres termosellados, capucha ajustable y bolsillo de compresión. Plegable, pesa 280 g.',
    tags: ['casaca', 'outdoor'],
  },
  {
    name: 'Zapatillas Urbanas Ligeras',
    category: 'Ropa',
    price: 59.9,
    compareAtPrice: 0,
    stock: 42,
    brand: 'StepOne',
    shortDescription: 'Suela de espuma reactiva para todo el día.',
    description:
      'Zapatillas urbanas con upper de malla transpirable, suela de espuma reactiva de retorno alto y plantilla extraíble. Diseñadas para uso diario.',
    tags: ['calzado', 'urbano'],
  },
  {
    name: 'Lámpara de Escritorio LED',
    category: 'Hogar',
    price: 42.0,
    compareAtPrice: 58.0,
    stock: 30,
    brand: 'LumenHome',
    isFeatured: true,
    shortDescription: 'Temperatura ajustable y carga inalámbrica.',
    description:
      'Lámpara de escritorio LED con 5 temperaturas de color, 7 niveles de brillo, base con carga inalámbrica Qi y puerto USB de carga rápida. Protección ocular sin parpadeo.',
    tags: ['iluminacion', 'escritorio'],
  },
  {
    name: 'Organizador de Escritorio de Bambú',
    category: 'Hogar',
    price: 28.5,
    compareAtPrice: 0,
    stock: 55,
    brand: 'WoodCraft',
    shortDescription: 'Bambú macizo con seis compartimentos.',
    description:
      'Organizador de escritorio fabricado en bambú macizo con seis compartimentos para cuadernos, celular, lapiceros y cables. Acabado natural resistente a la humedad.',
    tags: ['organizacion', 'madera'],
  },
  {
    name: 'Set de Ollas Antiadherentes',
    category: 'Hogar',
    price: 119.0,
    compareAtPrice: 149.0,
    stock: 9,
    brand: 'ChefLine',
    shortDescription: '5 piezas con recubrimiento cerámico.',
    description:
      'Set de 5 ollas con recubrimiento cerámico libre de PFOA, base de inducción y mangos de baquelita. Compatible con todo tipo de cocinas, incluida inducción.',
    tags: ['cocina', 'ollas'],
  },
  {
    name: 'Mancuernas Ajustables 20 kg',
    category: 'Deportes',
    price: 149.9,
    compareAtPrice: 189.9,
    stock: 14,
    brand: 'IronFlex',
    isFeatured: true,
    shortDescription: 'Reemplaza 15 pares en uno solo.',
    description:
      'Par de mancuernas ajustables con discos de cemento forrado y barras aceradas. Ajuste rápido de 2.5 a 20 kg totales. Ideal para entrenamiento en casa.',
    tags: ['fitness', 'fuerza'],
  },
  {
    name: 'Mat de Yoga Antideslizante 6 mm',
    category: 'Deportes',
    price: 39.9,
    compareAtPrice: 0,
    stock: 48,
    brand: 'ZenFlow',
    shortDescription: 'TPE de doble capa con líneas de alineación.',
    description:
      'Mat de yoga de TPE de doble capa, 6 mm de grosor, superficie antideslizante en ambas caras y líneas de alineación corporales. Incluye correa de transporte.',
    tags: ['yoga', 'fitness'],
  },
];

function imageFor(index, name) {
  const seed = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return [
    `https://picsum.photos/seed/${seed}-1/800/800`,
    `https://picsum.photos/seed/${seed}-2/800/800`,
  ];
}

export async function seedDatabase({ reset = true } = {}) {
  if (reset) {
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Review.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('Colecciones limpiadas.');
  }

  const admin = await User.create({
    name: env.seed.adminName,
    email: env.seed.adminEmail,
    password: env.seed.adminPassword,
    role: 'admin',
  });

  const demoUser = await User.create({
    name: 'Usuario Demo',
    email: 'demo@shop.com',
    password: 'Demo123!',
    role: 'user',
  });

  const categories = await Category.create(
    CATEGORIES.map((category) => ({
      name: category.name,
      slug: category.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      description: category.description,
    }))
  );

  const byName = new Map(categories.map((category) => [category.name, category]));

  const products = await Product.create(
    PRODUCTS.map((product, index) => ({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: imageFor(index, product.name),
      category: byName.get(product.category)._id,
      brand: product.brand,
      tags: product.tags,
      stock: product.stock,
      isFeatured: Boolean(product.isFeatured),
      sku: `SKU-${String(index + 1).padStart(4, '0')}`,
    }))
  );

  const reviewSeeds = [
    { product: products[0], user: demoUser, rating: 5, comment: 'Excelente calidad de sonido y la batería dura muchísimo.' },
    { product: products[0], user: admin, rating: 4, comment: 'Muy buenos, aunque el estuche podría ser más compacto.' },
    { product: products[4], user: demoUser, rating: 5, comment: 'El algodón es suave y no se deforma al lavarlo.' },
    { product: products[10], user: demoUser, rating: 4, comment: 'Buen material, los discos son suficientes para nivel intermedio.' },
  ];

  for (const review of reviewSeeds) {
    await Review.create({
      product: review.product._id,
      user: review.user._id,
      name: review.user.name,
      rating: review.rating,
      comment: review.comment,
    });
    await Review.recalculateProduct(review.product._id);
  }

  console.log(`Seed completo: ${categories.length} categorías, ${products.length} productos, 2 usuarios.`);
  console.log(`Admin: ${env.seed.adminEmail} / ${env.seed.adminPassword}`);
  console.log('Cliente demo: demo@shop.com / Demo123!');

  return { admin, demoUser, categories, products };
}
