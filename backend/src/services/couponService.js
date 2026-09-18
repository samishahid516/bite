import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { rowToDoc } from '../utils/serialize.js'

export async function listCoupons() {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function getCouponById(id) {
  const { data, error } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Coupon not found')
  return rowToDoc(data)
}

function toRow(payload) {
  const row = {}
  if (payload.code !== undefined) row.code = payload.code.trim().toUpperCase()
  if (payload.description !== undefined) row.description = payload.description
  if (payload.discountType !== undefined) row.discount_type = payload.discountType
  if (payload.discountValue !== undefined) row.discount_value = payload.discountValue
  if (payload.maxDiscount !== undefined) row.max_discount = payload.maxDiscount
  if (payload.minOrder !== undefined) row.min_order = payload.minOrder
  if (payload.expiryDate !== undefined) row.expiry_date = payload.expiryDate
  if (payload.usageLimit !== undefined) row.usage_limit = payload.usageLimit
  if (payload.isActive !== undefined) row.is_active = payload.isActive
  return row
}

export async function createCoupon(payload) {
  const { data: existing, error: existErr } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', payload.code.trim().toUpperCase())
    .maybeSingle()
  if (existErr) throw ApiError.badRequest(existErr.message)
  if (existing) throw ApiError.conflict('A coupon with this code already exists')

  const { data, error } = await supabase.from('coupons').insert(toRow(payload)).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function updateCoupon(id, payload) {
  await getCouponById(id)
  const { data, error } = await supabase.from('coupons').update(toRow(payload)).eq('id', id).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function deleteCoupon(id) {
  await getCouponById(id)
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw ApiError.badRequest(error.message)
}

/**
 * Computes the discount for a coupon against a given subtotal without persisting usage.
 * Order creation re-validates and increments usedCount atomically at commit time.
 */
export async function evaluateCoupon(code, subtotal) {
  const { data: row, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()
  if (error) throw ApiError.badRequest(error.message)

  if (!row) throw ApiError.badRequest('Coupon code does not exist')
  const coupon = rowToDoc(row)

  if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer active')
  if (new Date(coupon.expiryDate) < new Date()) throw ApiError.badRequest('This coupon has expired')
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
