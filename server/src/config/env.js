import dotenv from 'dotenv';

dotenv.config();

function bool(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const isProduction = process.env.NODE_ENV === 'production';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  payments: {
    demo: bool(process.env.DEMO_PAYMENTS, !process.env.STRIPE_SECRET_KEY),
    currency: (process.env.CURRENCY || 'usd').toLowerCase(),
    freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD || 100),
    shippingCost: Number(process.env.SHIPPING_COST || 9.99),
    taxRate: Number(process.env.TAX_RATE || 0.18),
  },
  seed: {
    adminName: process.env.SEED_ADMIN_NAME || 'Admin Demo',
    adminEmail: (process.env.SEED_ADMIN_EMAIL || 'admin@shop.com').toLowerCase(),
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
  },
};

export function assertSecrets() {
  if (!isProduction) return;

  const weak = [
    ['JWT_ACCESS_SECRET', 'dev-access-secret-change-me'],
    ['JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'],
  ].filter(([key, insecure]) => !process.env[key] || process.env[key] === insecure);

  if (weak.length) {
    throw new Error(
      `En producción debes definir secretos seguros para: ${weak.map(([k]) => k).join(', ')}`
    );
  }
}
