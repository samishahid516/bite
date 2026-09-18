import { Router } from 'express'
import * as productController from '../controllers/productController.js'
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema
} from '../validations/productValidation.js'

const router = Router()

router.get('/', optionalAuthenticate, validate(listProductsQuerySchema, 'query'), productController.listProducts)
router.get('/search', productController.searchProducts)
router.get('/:id', productController.getProduct)
router.get('/:id/reviews', productController.listProductReviews)

router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createProductSchema),
  productController.createProduct
)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateProductSchema),
  productController.updateProduct
)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), productController.deleteProduct)

export default router
