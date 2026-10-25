import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
});

const passwordRule = body('password')
  .isLength({ min: 6 })
  .withMessage('La contraseña debe tener al menos 6 caracteres.');

router.post(
  '/register',
  authLimiter,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('El nombre es obligatorio.'),
  body('email').isEmail().withMessage('Email no válido.').normalizeEmail(),
  passwordRule,
  validate,
  auth.register
);

router.post(
  '/login',
  authLimiter,
  body('email').isEmail().withMessage('Email no válido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  validate,
  auth.login
);

router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.me);
router.put('/profile', protect, auth.updateProfile);
router.put(
  '/password',
  protect,
  body('currentPassword').notEmpty().withMessage('Indica tu contraseña actual.'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),
  validate,
  auth.changePassword
);

export default router;
