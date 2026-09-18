import { Review } from '../models/Review.js'
import { Product } from '../models/Product.js'
import { Order } from '../models/Order.js'
import { ApiError } from '../utils/ApiError.js'

export async function createReview(userId, productId, orderId, rating, comment) {
  // Validate that user actually bought this product in this order
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    orderStatus: 'DELIVERED'
  })

  if (!order) {
    throw ApiError.badRequest('You can only review products from delivered orders')
  }

  // Check if product exists in order
  const productInOrder = order.items.some((item) => item.product && item.product.toString() === productId)
  if (!productInOrder) {
    throw ApiError.badRequest('This product is not in your order')
  }

  // Check if product exists
  const product = await Product.findById(productId)
  if (!product) throw ApiError.notFound('Product not found')

  // Check for duplicate review
  const existing = await Review.findOne({
    user: userId,
    product: productId,
    order: orderId
  })

  if (existing) {
    throw ApiError.conflict('You have already reviewed this product from this order')
  }

  const review = await Review.create({
    user: userId,
    product: productId,
    order: orderId,
    rating,
    comment: comment || '',
    isApproved: false
  })

  return review.populate([
    { path: 'user', select: 'name profileImage' },
    { path: 'product', select: 'name' }
  ])
}

export async function listApprovedReviewsForProduct(productId, { page = 1, limit = 10 } = {}) {
  const [reviews, total] = await Promise.all([
    Review.find({ product: productId, isApproved: true })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments({ product: productId, isApproved: true })
  ])

  return {
    reviews,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function listPendingReviews({ page = 1, limit = 20 } = {}) {
  const [reviews, total] = await Promise.all([
    Review.find({ isApproved: false })
      .populate('user', 'name email profileImage')
      .populate('product', 'name slug')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments({ isApproved: false })
  ])

  return {
    reviews,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function approveReview(reviewId) {
  const review = await Review.findById(reviewId)
  if (!review) throw ApiError.notFound('Review not found')

  review.isApproved = true
  await review.save()

  // Update product rating and review count
  const approvedReviews = await Review.find({
    product: review.product,
    isApproved: true
  })

  const avgRating = approvedReviews.length > 0
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    : 0

  await Product.findByIdAndUpdate(review.product, {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: approvedReviews.length
  })

  return review.populate([
    { path: 'user', select: 'name profileImage' },
    { path: 'product', select: 'name' }
  ])
}

export async function rejectReview(reviewId) {
  const review = await Review.findById(reviewId)
  if (!review) throw ApiError.notFound('Review not found')

  await review.deleteOne()
}

export async function deleteReview(reviewId, userId) {
  const review = await Review.findById(reviewId)
  if (!review) throw ApiError.notFound('Review not found')

  // Only the review author can delete their review
  if (review.user.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only delete your own reviews')
  }

  await review.deleteOne()
}
