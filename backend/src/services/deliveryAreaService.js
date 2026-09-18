import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { rowToDoc } from '../utils/serialize.js'

export async function listDeliveryAreas({ branch, includeInactive = false } = {}) {
  let query = supabase.from('delivery_areas').select('*, branch:branches(id, name, city, area)').order('name', { ascending: true })
  if (!includeInactive) query = query.eq('is_active', true)
  if (branch) query = query.eq('branch_id', branch)

  const { data, error } = await query
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function getDeliveryAreaById(id) {
  const { data, error } = await supabase.from('delivery_areas').select('*').eq('id', id).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Delivery area not found')
  return rowToDoc(data)
}

function toRow(payload) {
  const row = {}
  if (payload.branch !== undefined) row.branch_id = payload.branch
  if (payload.name !== undefined) row.name = payload.name
  if (payload.deliveryFee !== undefined) row.delivery_fee = payload.deliveryFee
  if (payload.minimumOrder !== undefined) row.minimum_order = payload.minimumOrder
  if (payload.estimatedDeliveryTime !== undefined) row.estimated_delivery_time = payload.estimatedDeliveryTime
  if (payload.isActive !== undefined) row.is_active = payload.isActive
  return row
}

export async function createDeliveryArea(payload) {
  const { data, error } = await supabase.from('delivery_areas').insert(toRow(payload)).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function updateDeliveryArea(id, payload) {
  await getDeliveryAreaById(id)
  const { data, error } = await supabase.from('delivery_areas').update(toRow(payload)).eq('id', id).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function deleteDeliveryArea(id) {
  await getDeliveryAreaById(id)
  const { error } = await supabase.from('delivery_areas').delete().eq('id', id)
  if (error) throw ApiError.badRequest(error.message)
}

export async function checkDeliveryAvailability(branchId, areaName) {
  const { data, error } = await supabase
    .from('delivery_areas')
    .select('*')
    .eq('branch_id', branchId)
    .ilike('name', areaName.trim())
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw ApiError.badRequest(error.message)

  if (!data) {
    return { available: false, message: "Sorry, we currently don't deliver to this location." }
  }

  const area = rowToDoc(data)

  return {
    available: true,
    deliveryArea: area,
    deliveryFee: area.deliveryFee,
    minimumOrder: area.minimumOrder,
    estimatedDeliveryTime: area.estimatedDeliveryTime
  }
}
