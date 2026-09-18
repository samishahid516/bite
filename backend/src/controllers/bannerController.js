import * as bannerService from '../services/bannerService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listBanners = asyncHandler(async (req, res) => {
  const includeInactive = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)
  const banners = includeInactive ? await bannerService.listAllBanners() : await bannerService.listActiveBanners()
  sendSuccess(res, { message: 'Banners fetched', data: { banners } })
})

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.createBanner(req.body)
  sendSuccess(res, { statusCode: 201, message: 'Banner created', data: { banner } })
})

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body)
  sendSuccess(res, { message: 'Banner updated', data: { banner } })
})

export const deleteBanner = asyncHandler(async (req, res) => {
  await bannerService.deleteBanner(req.params.id)
  sendSuccess(res, { message: 'Banner deleted' })
})
