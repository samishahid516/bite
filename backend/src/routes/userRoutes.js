import { Router } from 'express'
import * as userController from '../controllers/userController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { updateProfileSchema } from '../validations/userValidation.js'

const router = Router()

// All user routes require authentication
router.use(authenticate)

router.get('/', userController.getProfile)

router.patch(
  '/',
  validate(updateProfileSchema),
  userController.updateProfile
)

router.post('/logout', userController.logout)

export default router
