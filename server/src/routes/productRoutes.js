import { Router } from 'express';
import { body } from 'express-validator';
import * as products from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', products.listProducts);
router.get('/featured', products.getFeaturedProducts);
router.get('/:slug', products.getProductBySlug);

router.post(
  '/:id/reviews',
  protect,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La puntuación debe estar entre 1 y 5.'),
  body('comment').trim().isLength({ min: 3, max: 1000 }).withMessage('Escribe un comentario (mínimo 3 caracteres).'),
  validate,
  products.createProductReview
);

const productRules = [
  body('name').trim().isLength({ min: 3 }).withMessage('El nombre es obligatorio.'),
  body('description').trim().isLength({ min: 10 }).withMessage('La descripción es obligatoria.'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo.'),
  body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un entero positivo.'),
  body('category').isMongoId().withMessage('Selecciona una categoría válida.'),
];

router.post('/', protect, admin, productRules, validate, products.createProduct);
router.put('/:id', protect, admin, validate, products.updateProduct);
router.delete('/:id', protect, admin, products.deleteProduct);

export default router;
