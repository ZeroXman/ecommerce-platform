import { Router } from 'express';
import { body } from 'express-validator';
import * as payments from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/config', payments.getPaymentConfig);

router.post(
  '/create-intent',
  protect,
  body('orderId').isMongoId().withMessage('Pedido inválido.'),
  validate,
  payments.createPaymentIntent
);

export default router;
