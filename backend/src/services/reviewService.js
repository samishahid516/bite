import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { rowToDoc } from '../utils/serialize.js'

export async function createReview(userId, productId, orderId, rating, comment) {
  // Validate that user actually bought this product in this order
  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .select('id, items')
    .eq('id', orderId)
    .eq('user_id', userId)
    .eq('order_status', 'DELIVERED')
    .maybeSingle()
  if (orderErr) throw ApiError.badRequest(orderErr.message)

  if (!orderRow) {
    throw ApiError.badRequest('You can only review products from delivered orders')
  }

  // Check if product exists in order
  const productInOrder = (orderRow.items || []).some((item) => item.product && item.product === productId)
  if (!productInOrder) {
    throw ApiError.badRequest('This product is not in your order')
  }

  // Check if product exists
  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle()
  if (productErr) throw ApiError.badRequest(productErr.message)
  if (!product) throw ApiError.notFound('Product not found')

  // Check for duplicate review
  const { data: existing, error: existErr } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('order_id', orderId)
    .maybeSingle()
  if (existErr) throw ApiError.badRequest(existErr.message)

  if (existing) {
    throw ApiError.conflict('You have already reviewed this product from this order')
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      product_id: productId,
      order_id: orderId,
      rating,
      comment: comment || '',
      is_approved: false
    })
    .select('*, user:users(id, name, profile_image), product:products(id, name)')
    .single()
  if (error) throw ApiError.badRequest(error.message)

  return rowToDoc(data)
}

export async function listApprovedReviewsForProduct(productId, { page = 1, limit = 10 } = {}) {
  page = Number(page) || 1
  limit = Number(limit) || 10

  const { data, error, count } = await supabase
    .from('reviews')
    .select('*, user:users(id, name, profile_image)', { count: 'exact' })
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  return {
    reviews: rowToDoc(data),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function listPendingReviews({ page = 1, limit = 20 } = {}) {
  page = Number(page) || 1
  limit = Number(limit) || 20

  const { data, error, count } = await supabase
    .from('reviews')
    .select('*, user:users(id, name, email, profile_image), product:products(id, name, slug)', { count: 'exact' })
    .eq('is_approved', false)
    .order('created_at', { ascending: true })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (error) throw ApiError.badRequest(error.message)

  const total = count || 0

  return {
    reviews: rowToDoc(data),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function approveReview(reviewId) {
  const { data: reviewRow, error: getErr } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!reviewRow) throw ApiError.notFound('Review not found')

  await supabase.from('reviews').update({ is_approved: true }).eq('id', reviewId)

  // Update product rating and review count
  const { data: approvedReviews, error: listErr } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', reviewRow.product_id)
    .eq('is_approved', true)
  if (listErr) throw ApiError.badRequest(listErr.message)

  const avgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0

  await supabase
    .from('products')
    .update({ rating: Math.round(avgRating * 10) / 10, review_count: approvedReviews.length })
    .eq('id', reviewRow.product_id)

  const { data, error } = await supabase
    .from('reviews')
    .select('*, user:users(id, name, profile_image), product:products(id, name)')
    .eq('id', reviewId)
    .single()
  if (error) throw ApiError.badRequest(error.message)

  return rowToDoc(data)
}

export async function rejectReview(reviewId) {
  const { data, error: getErr } = await supabase.from('reviews').select('id').eq('id', reviewId).maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!data) throw ApiError.notFound('Review not found')

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) throw ApiError.badRequest(error.message)
}

export async function deleteReview(reviewId, userId) {
  const { data: review, error: getErr } = await supabase
    .from('reviews')
    .select('id, user_id')
    .eq('id', reviewId)
    .maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!review) throw ApiError.notFound('Review not found')

  // Only the review author can delete their review
  if (review.user_id.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only delete your own reviews')
  }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) throw ApiError.badRequest(error.message)
}
