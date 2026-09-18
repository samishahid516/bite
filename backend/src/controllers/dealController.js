import * as dealService from '../services/dealService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listDeals = asyncHandler(async (req, res) => {
  const includeInactive = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)
  const deals = await dealService.listDeals({ branch: req.query.branch, includeInactive })
  sendSuccess(res, { message: 'Deals fetched', data: { deals } })
})

export const getDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.getDealById(req.params.id)
  sendSuccess(res, { message: 'Deal fetched', data: { deal } })
})

export const createDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.createDeal(req.body)
  sendSuccess(res, { statusCode: 201, message: 'Deal created', data: { deal } })
})

export const updateDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.updateDeal(req.params.id, req.body)
  sendSuccess(res, { message: 'Deal updated', data: { deal } })
})

export const deleteDeal = asyncHandler(async (req, res) => {
  await dealService.deleteDeal(req.params.id)
  sendSuccess(res, { message: 'Deal deleted' })
})
