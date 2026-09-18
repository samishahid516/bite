import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { haversineDistanceKm } from '../utils/geo.js'
import { rowToDoc } from '../utils/serialize.js'

export function isCurrentlyOpen(branch, now = new Date()) {
  const [openH, openM] = branch.openingTime.split(':').map(Number)
  const [closeH, closeM] = branch.closingTime.split(':').map(Number)
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM
  if (closeMinutes <= openMinutes) {
    return minutesNow >= openMinutes || minutesNow <= closeMinutes
  }
  return minutesNow >= openMinutes && minutesNow <= closeMinutes
}

export async function listBranches({ lat, lng, city, includeInactive = false } = {}) {
  let query = supabase.from('branches').select('*')
  if (!includeInactive) query = query.eq('is_active', true)
  if (city) query = query.eq('city', city)

  const { data, error } = await query
  if (error) throw ApiError.badRequest(error.message)

  const branches = rowToDoc(data)

  const withDistance = branches.map((branch) => {
    const distanceKm =
      lat !== undefined && lng !== undefined
        ? haversineDistanceKm(lat, lng, branch.latitude, branch.longitude)
        : null
    return {
      ...branch,
      distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
      isOpenNow: isCurrentlyOpen(branch)
    }
  })

  if (lat !== undefined && lng !== undefined) {
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm)
  }

  return withDistance
}

export async function getBranchById(id) {
  const { data, error } = await supabase.from('branches').select('*').eq('id', id).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Branch not found')
  return rowToDoc(data)
}

function toRow(payload) {
  const row = {}
  if (payload.name !== undefined) row.name = payload.name
  if (payload.city !== undefined) row.city = payload.city
  if (payload.area !== undefined) row.area = payload.area
  if (payload.address !== undefined) row.address = payload.address
  if (payload.phone !== undefined) row.phone = payload.phone
  if (payload.latitude !== undefined) row.latitude = payload.latitude
  if (payload.longitude !== undefined) row.longitude = payload.longitude
  if (payload.openingTime !== undefined) row.opening_time = payload.openingTime
  if (payload.closingTime !== undefined) row.closing_time = payload.closingTime
  if (payload.isActive !== undefined) row.is_active = payload.isActive
  return row
}

export async function createBranch(payload) {
  const { data, error } = await supabase.from('branches').insert(toRow(payload)).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function updateBranch(id, payload) {
  await getBranchById(id)
  const { data, error } = await supabase
    .from('branches')
    .update(toRow(payload))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function deleteBranch(id) {
  await getBranchById(id)
  const { error } = await supabase.from('branches').delete().eq('id', id)
  if (error) throw ApiError.badRequest(error.message)
}
