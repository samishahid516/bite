import * as couponService from '../services/couponService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponService.listCoupons()
  sendSuccess(res, { message: 'Coupons fetched', data: { coupons } })
})

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body)
  sendSuccess(res, { statusCode: 201, message: 'Coupon created', data: { coupon } })
})

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body)
  sendSuccess(res, { message: 'Coupon updated', data: { coupon } })
})

export const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id)
  sendSuccess(res, { message: 'Coupon deleted' })
})

export const validateCoupon = asyncHandler(async (req, res) => {
  const { coupon, discount } = await couponService.evaluateCoupon(req.body.code, req.body.subtotal)
  sendSuccess(res, { message: 'Coupon is valid', data: { coupon, discount } })
})
