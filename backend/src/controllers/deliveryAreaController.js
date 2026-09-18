import * as deliveryAreaService from '../services/deliveryAreaService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listDeliveryAreas = asyncHandler(async (req, res) => {
  const includeInactive = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)
  const areas = await deliveryAreaService.listDeliveryAreas({ branch: req.query.branch, includeInactive })
  sendSuccess(res, { message: 'Delivery areas fetched', data: { areas } })
})

export const checkDelivery = asyncHandler(async (req, res) => {
  const result = await deliveryAreaService.checkDeliveryAvailability(req.query.branch, req.query.area)
  sendSuccess(res, { message: result.available ? 'Delivery available' : 'Delivery unavailable', data: result })
})

export const createDeliveryArea = asyncHandler(async (req, res) => {
  const area = await deliveryAreaService.createDeliveryArea(req.body)
  sendSuccess(res, { statusCode: 201, message: 'Delivery area created', data: { area } })
})

export const updateDeliveryArea = asyncHandler(async (req, res) => {
  const area = await deliveryAreaService.updateDeliveryArea(req.params.id, req.body)
  sendSuccess(res, { message: 'Delivery area updated', data: { area } })
})

export const deleteDeliveryArea = asyncHandler(async (req, res) => {
  await deliveryAreaService.deleteDeliveryArea(req.params.id)
  sendSuccess(res, { message: 'Delivery area deleted' })
})
