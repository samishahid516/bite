import { Router } from 'express'
import * as favoriteController from '../controllers/favoriteController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { addFavoriteSchema, getUserFavoritesQuerySchema } from '../validations/favoriteValidation.js'

const router = Router()

// All favorite routes require authentication
router.use(authenticate)

router.post(
  '/',
  validate(addFavoriteSchema),
  favoriteController.addFavorite
)

router.delete(
  '/:productId',
  favoriteController.removeFavorite
)

router.get(
  '/',
  validate(getUserFavoritesQuerySchema, 'query'),
  favoriteController.getUserFavorites
)

export default router
