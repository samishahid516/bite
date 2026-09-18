import { Router } from 'express'
import * as addressController from '../controllers/addressController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createAddressSchema, updateAddressSchema } from '../validations/addressValidation.js'

const router = Router()

// All address routes require authentication
router.use(authenticate)

router.get('/', addressController.getAddresses)

router.post(
  '/',
  validate(createAddressSchema),
  addressController.addAddress
)

router.put(
  '/:id',
  validate(updateAddressSchema),
  addressController.updateAddress
)

router.delete(
  '/:id',
  addressController.deleteAddress
)

router.patch(
  '/:id/default',
  addressController.setDefaultAddress
)

export default router
