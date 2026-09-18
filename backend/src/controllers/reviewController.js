import * as reviewService from '../services/reviewService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body
  const review = await reviewService.createReview(req.user._id, productId, orderId, rating, comment)
  sendSuccess(res, { statusCode: 201, message: 'Review created and pending approval', data: { review } })
})

export const listProductReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.listApprovedReviewsForProduct(req.params.productId, {
    page: req.query.page,
    limit: req.query.limit
  })
  sendSuccess(res, { message: 'Reviews fetched', data: result })
})

export const listPendingReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.listPendingReviews({
    page: req.query.page,
    limit: req.query.limit
  })
  sendSuccess(res, { message: 'Pending reviews fetched', data: result })
})

export const approveReview = asyncHandler(async (req, res) => {
  const review = await reviewService.approveReview(req.params.id)
  sendSuccess(res, { message: 'Review approved', data: { review } })
})

export const rejectReview = asyncHandler(async (req, res) => {
  await reviewService.rejectReview(req.params.id)
  sendSuccess(res, { message: 'Review rejected and deleted' })
})

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user._id)
  sendSuccess(res, { message: 'Review deleted' })
})
