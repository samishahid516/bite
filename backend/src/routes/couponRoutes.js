import { Router } from 'express'
import * as couponController from '../controllers/couponController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from '../validations/couponValidation.js'

const router = Router()

router.post('/validate', validate(validateCouponSchema), couponController.validateCoupon)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), couponController.listCoupons)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createCouponSchema),
  couponController.createCoupon
)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateCouponSchema),
  couponController.updateCoupon
)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), couponController.deleteCoupon)

export default router
