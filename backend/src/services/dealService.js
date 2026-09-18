import { Deal } from '../models/Deal.js'
import { ApiError } from '../utils/ApiError.js'
import { uniqueSlug } from '../utils/slugify.js'

export async function listDeals({ branch, includeInactive = false } = {}) {
  const now = new Date()
  const filter = includeInactive ? {} : { isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }
  if (branch) filter.$or = [{ branch }, { branch: null }]

  return Deal.find(filter).populate('products.product').sort({ createdAt: -1 })
}

export async function getDealById(id) {
  const deal = await Deal.findById(id).populate('products.product')
  if (!deal) throw ApiError.notFound('Deal not found')
  return deal
}

export async function createDeal(payload) {
  const slug = await uniqueSlug(Deal, payload.name)
  return Deal.create({ ...payload, slug })
}

export async function updateDeal(id, payload) {
  const deal = await Deal.findById(id)
  if (!deal) throw ApiError.notFound('Deal not found')
  if (payload.name && payload.name !== deal.name) {
    deal.slug = await uniqueSlug(Deal, payload.name, id)
  }
  Object.assign(deal, payload)
  await deal.save()
  return deal
}

export async function deleteDeal(id) {
  const deal = await Deal.findById(id)
  if (!deal) throw ApiError.notFound('Deal not found')
  await deal.deleteOne()
}
