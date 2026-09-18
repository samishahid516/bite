import { Router } from 'express'
import * as dealController from '../controllers/dealController.js'
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createDealSchema, updateDealSchema } from '../validations/dealValidation.js'

const router = Router()

router.get('/', optionalAuthenticate, dealController.listDeals)
router.get('/:id', dealController.getDeal)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createDealSchema),
  dealController.createDeal
)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateDealSchema),
  dealController.updateDeal
)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), dealController.deleteDeal)

export default router
