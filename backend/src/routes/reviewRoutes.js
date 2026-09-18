import { Router } from 'express'
import * as reviewController from '../controllers/reviewController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createReviewSchema,
  listProductReviewsQuerySchema,
  listPendingReviewsQuerySchema
} from '../validations/reviewValidation.js'

const router = Router()

// Public routes (no auth needed)
router.get(
  '/products/:productId',
  validate(listProductReviewsQuerySchema, 'query'),
  reviewController.listProductReviews
)

// Admin routes (must come before generic :id routes)
router.get(
  '/pending',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(listPendingReviewsQuerySchema, 'query'),
  reviewController.listPendingReviews
)

router.patch(
  '/:id/approve',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  reviewController.approveReview
)

router.patch(
  '/:id/reject',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  reviewController.rejectReview
)

// Customer routes
router.post(
  '/',
  authenticate,
  validate(createReviewSchema),
  reviewController.createReview
)

router.delete(
  '/:id',
  authenticate,
  reviewController.deleteReview
)

export default router
