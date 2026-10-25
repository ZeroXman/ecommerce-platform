import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { stripeWebhook } from './controllers/paymentController.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: [env.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean),
      credentials: true,
    })
  );

  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (!env.isProduction) {
    app.use(morgan('dev'));
  }

  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
      message: { ok: false, error: 'Demasiadas peticiones, inténtalo más tarde.' },
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, status: 'up', env: env.nodeEnv, time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
