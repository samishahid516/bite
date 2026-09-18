import { Branch } from '../models/Branch.js'
import { ApiError } from '../utils/ApiError.js'
import { haversineDistanceKm } from '../utils/geo.js'

export async function listBranches({ lat, lng, city, includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true }
  if (city) filter.city = city

  const branches = await Branch.find(filter).lean()

  const withDistance = branches.map((branch) => {
    const distanceKm =
      lat !== undefined && lng !== undefined
        ? haversineDistanceKm(lat, lng, branch.latitude, branch.longitude)
        : null
    return {
      ...branch,
      distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
      isOpenNow: Branch.hydrate(branch).isCurrentlyOpen()
    }
  })

  if (lat !== undefined && lng !== undefined) {
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm)
  }

  return withDistance
}

export async function getBranchById(id) {
  const branch = await Branch.findById(id)
  if (!branch) throw ApiError.notFound('Branch not found')
  return branch
}

export async function createBranch(payload) {
  return Branch.create(payload)
}

export async function updateBranch(id, payload) {
  const branch = await getBranchById(id)
  Object.assign(branch, payload)
  await branch.save()
  return branch
}

export async function deleteBranch(id) {
  const branch = await getBranchById(id)
  await branch.deleteOne()
}
