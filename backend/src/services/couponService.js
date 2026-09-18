import { Coupon } from '../models/Coupon.js'
import { ApiError } from '../utils/ApiError.js'

export async function listCoupons() {
  return Coupon.find().sort({ createdAt: -1 })
}

export async function getCouponById(id) {
  const coupon = await Coupon.findById(id)
  if (!coupon) throw ApiError.notFound('Coupon not found')
  return coupon
}

export async function createCoupon(payload) {
  const existing = await Coupon.findOne({ code: payload.code })
  if (existing) throw ApiError.conflict('A coupon with this code already exists')
  return Coupon.create(payload)
}

export async function updateCoupon(id, payload) {
  const coupon = await getCouponById(id)
  Object.assign(coupon, payload)
  await coupon.save()
  return coupon
}

export async function deleteCoupon(id) {
  const coupon = await getCouponById(id)
  await coupon.deleteOne()
}

/**
 * Computes the discount for a coupon against a given subtotal without persisting usage.
 * Order creation re-validates and increments usedCount atomically at commit time.
 */
export async function evaluateCoupon(code, subtotal) {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() })

  if (!coupon) throw ApiError.badRequest('Coupon code does not exist')
  if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer active')
  if (coupon.expiryDate < new Date()) throw ApiError.badRequest('This coupon has expired')
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit')
  }
  if (subtotal < coupon.minOrder) {
    throw ApiError.badRequest(`Minimum order of Rs. ${coupon.minOrder} required for this coupon`)
  }

  let discount =
    coupon.discountType === 'PERCENTAGE' ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue

  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount)
  discount = Math.min(discount, subtotal)

  return { coupon, discount: Math.round(discount * 100) / 100 }
}
