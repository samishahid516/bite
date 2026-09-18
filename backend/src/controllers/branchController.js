import * as branchService from '../services/branchService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listBranches = asyncHandler(async (req, res) => {
  const includeInactive = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)
  const { lat, lng, city } = req.query
  const branches = await branchService.listBranches({
    lat: lat !== undefined ? Number(lat) : undefined,
    lng: lng !== undefined ? Number(lng) : undefined,
    city,
    includeInactive
  })
  sendSuccess(res, { message: 'Branches fetched', data: { branches } })
})

export const getBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.getBranchById(req.params.id)
  sendSuccess(res, { message: 'Branch fetched', data: { branch } })
})

export const createBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.createBranch(req.body)
  sendSuccess(res, { statusCode: 201, message: 'Branch created', data: { branch } })
})

export const updateBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranch(req.params.id, req.body)
  sendSuccess(res, { message: 'Branch updated', data: { branch } })
})

export const deleteBranch = asyncHandler(async (req, res) => {
  await branchService.deleteBranch(req.params.id)
  sendSuccess(res, { message: 'Branch deleted' })
})
