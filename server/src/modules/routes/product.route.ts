import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createProductSchema, listProductsQuerySchema, updateProductSchema } from '../validations/products.validation.js';
import { productController } from '../controllers/product.controller.js';
import { slugParamSchema, uuidParamSchema } from '../../shared/validators/common.js';

export const productRoutes = Router();

productRoutes.get('/', validate({ query: listProductsQuerySchema }), productController.list);
productRoutes.get('/:slug', validate({ params: slugParamSchema }), productController.getBySlug);

productRoutes.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createProductSchema }),
  productController.create,
);
productRoutes.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: uuidParamSchema, body: updateProductSchema }),
  productController.update,
);
productRoutes.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: uuidParamSchema }),
  productController.remove,
);