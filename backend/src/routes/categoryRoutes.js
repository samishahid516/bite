import { Router } from 'express'
import * as categoryController from '../controllers/categoryController.js'
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createCategorySchema, updateCategorySchema } from '../validations/categoryValidation.js'

const router = Router()

router.get('/', optionalAuthenticate, categoryController.listCategories)
router.get('/:id', categoryController.getCategory)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createCategorySchema),
  categoryController.createCategory
)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateCategorySchema),
  categoryController.updateCategory
)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), categoryController.deleteCategory)

export default router
