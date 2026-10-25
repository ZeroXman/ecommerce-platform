import { Router } from 'express';
import { body } from 'express-validator';
import * as orders from '../controllers/orderController.js';
import * as users from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect, admin);

router.get('/stats', orders.getDashboardStats);
router.get('/orders', orders.listAllOrders);
router.put(
  '/orders/:id/status',
  body('status').isIn(['processing', 'shipped', 'delivered', 'cancelled']).withMessage('Estado inválido.'),
  validate,
  orders.updateOrderStatus
);

router.get('/users', users.listUsers);
router.put(
  '/users/:id/role',
  body('role').isIn(['user', 'admin']).withMessage('Rol inválido.'),
  validate,
  users.updateUserRole
);
router.put('/users/:id/toggle', users.toggleUserActive);
router.delete('/users/:id', users.deleteUser);

export default router;
