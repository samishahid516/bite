import { DeliveryArea } from '../models/DeliveryArea.js'
import { ApiError } from '../utils/ApiError.js'

export async function listDeliveryAreas({ branch, includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true }
  if (branch) filter.branch = branch
  return DeliveryArea.find(filter).populate('branch', 'name city area').sort({ name: 1 })
}

export async function getDeliveryAreaById(id) {
  const area = await DeliveryArea.findById(id)
  if (!area) throw ApiError.notFound('Delivery area not found')
  return area
}

export async function createDeliveryArea(payload) {
  return DeliveryArea.create(payload)
}

export async function updateDeliveryArea(id, payload) {
  const area = await getDeliveryAreaById(id)
  Object.assign(area, payload)
  await area.save()
  return area
}

export async function deleteDeliveryArea(id) {
  const area = await getDeliveryAreaById(id)
  await area.deleteOne()
}

export async function checkDeliveryAvailability(branchId, areaName) {
  const area = await DeliveryArea.findOne({
    branch: branchId,
    name: new RegExp(`^${areaName.trim()}$`, 'i'),
    isActive: true
  })

  if (!area) {
    return { available: false, message: "Sorry, we currently don't deliver to this location." }
  }

  return {
    available: true,
    deliveryArea: area,
    deliveryFee: area.deliveryFee,
    minimumOrder: area.minimumOrder,
    estimatedDeliveryTime: area.estimatedDeliveryTime
  }
}
