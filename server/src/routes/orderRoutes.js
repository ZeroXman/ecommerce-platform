import { Router } from 'express';
import { body } from 'express-validator';
import * as orders from '../controllers/orderController.js';
import { confirmPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.post(
  '/',
  body('items').isArray({ min: 1 }).withMessage('El carrito está vacío.'),
  body('items.*.product').isMongoId().withMessage('Producto inválido en el carrito.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad inválida.'),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('El nombre de envío es obligatorio.'),
  body('shippingAddress.address').trim().notEmpty().withMessage('La dirección es obligatoria.'),
  body('shippingAddress.city').trim().notEmpty().withMessage('La ciudad es obligatoria.'),
  body('shippingAddress.postalCode').trim().notEmpty().withMessage('El código postal es obligatorio.'),
  body('shippingAddress.country').trim().notEmpty().withMessage('El país es obligatorio.'),
  validate,
  orders.createOrder
);

router.get('/mine', orders.getMyOrders);
router.get('/:id', orders.getOrderById);
router.post('/:id/pay', confirmPayment);
router.put('/:id/cancel', orders.cancelMyOrder);

export default router;
