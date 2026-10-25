import { Router } from 'express';
import { body } from 'express-validator';
import * as products from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', products.listCategories);

router.post(
  '/',
  protect,
  admin,
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('El nombre de la categoría es obligatorio.'),
  validate,
  products.createCategory
);

export default router;
