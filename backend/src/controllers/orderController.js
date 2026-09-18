import * as orderService from '../services/orderService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { ApiError } from '../utils/ApiError.js'

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user || null, req.body)
  sendSuccess(res, { statusCode: 201, message: 'Order created successfully', data: { order } })
})

export const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.user?._id || null, req.params.id)
  sendSuccess(res, { message: 'Order fetched', data: { order } })
})

export const getCustomerOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getCustomerOrders(req.user._id, {
    page: req.query.page,
    limit: req.query.limit
  })
  sendSuccess(res, { message: 'Customer orders fetched', data: result })
})

export const listAllOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listAllOrders(req.query, {
    page: req.query.page,
    limit: req.query.limit
  })
  sendSuccess(res, { message: 'Orders fetched', data: result })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body
  const order = await orderService.updateOrderStatus(req.params.id, status, req.user._id, note)
  sendSuccess(res, { message: 'Order status updated', data: { order } })
})

export const cancelOrder = asyncHandler(async (req, res) => {
  // If admin, pass the admin ID; otherwise pass null (customer cancellation)
  const cancelledBy = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role) ? req.user._id : null
  const order = await orderService.cancelOrder(req.params.id, cancelledBy)
  sendSuccess(res, { message: 'Order cancelled successfully', data: { order } })
})
