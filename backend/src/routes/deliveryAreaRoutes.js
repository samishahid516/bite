import { Router } from 'express'
import * as deliveryAreaController from '../controllers/deliveryAreaController.js'
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  checkDeliveryQuerySchema,
  createDeliveryAreaSchema,
  updateDeliveryAreaSchema
} from '../validations/deliveryAreaValidation.js'

const router = Router()

router.get('/', optionalAuthenticate, deliveryAreaController.listDeliveryAreas)
router.get('/check', validate(checkDeliveryQuerySchema, 'query'), deliveryAreaController.checkDelivery)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createDeliveryAreaSchema),
  deliveryAreaController.createDeliveryArea
)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateDeliveryAreaSchema),
  deliveryAreaController.updateDeliveryArea
)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  deliveryAreaController.deleteDeliveryArea
)

export default router
