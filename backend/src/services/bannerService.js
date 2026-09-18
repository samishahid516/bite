import { Banner } from '../models/Banner.js'

export async function listActiveBanners() {
  const now = new Date()
  return Banner.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }]
  }).sort({ sortOrder: 1 })
}

export async function listAllBanners() {
  return Banner.find().sort({ sortOrder: 1 })
}

export async function createBanner(data) {
  return Banner.create(data)
}

export async function updateBanner(id, data) {
  const banner = await Banner.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  return banner
}

export async function deleteBanner(id) {
  await Banner.findByIdAndDelete(id)
}
