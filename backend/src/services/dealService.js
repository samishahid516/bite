import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { uniqueSlug } from '../utils/slugify.js'
import { rowToDoc } from '../utils/serialize.js'

export async function listDeals({ branch, includeInactive = false } = {}) {
  let query = supabase.from('deals').select('*').order('created_at', { ascending: false })

  if (!includeInactive) {
    const nowIso = new Date().toISOString()
    query = query.eq('is_active', true).lte('start_date', nowIso).gte('end_date', nowIso)
  }
  if (branch) query = query.or(`branch_id.eq.${branch},branch_id.is.null`)

  const { data, error } = await query
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function getDealById(id) {
  const { data, error } = await supabase.from('deals').select('*').eq('id', id).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Deal not found')
  return rowToDoc(data)
}

function toRow(payload) {
  const row = {}
  if (payload.name !== undefined) row.name = payload.name
  if (payload.description !== undefined) row.description = payload.description
  if (payload.image !== undefined) row.image = payload.image
  if (payload.products !== undefined) row.products = payload.products
  if (payload.originalPrice !== undefined) row.original_price = payload.originalPrice
  if (payload.discountPrice !== undefined) row.discount_price = payload.discountPrice
  if (payload.startDate !== undefined) row.start_date = payload.startDate
  if (payload.endDate !== undefined) row.end_date = payload.endDate
  if (payload.branch !== undefined) row.branch_id = payload.branch
  if (payload.isActive !== undefined) row.is_active = payload.isActive
  return row
}

export async function createDeal(payload) {
  const slug = await uniqueSlug('deals', payload.name)
  const { data, error } = await supabase
    .from('deals')
    .insert({ ...toRow(payload), slug })
    .select('*')
    .single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function updateDeal(id, payload) {
  const deal = await getDealById(id)
  const row = toRow(payload)
  if (payload.name && payload.name !== deal.name) {
    row.slug = await uniqueSlug('deals', payload.name, id)
  }
  const { data, error } = await supabase.from('deals').update(row).eq('id', id).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function deleteDeal(id) {
  await getDealById(id)
  const { error } = await supabase.from('deals').delete().eq('id', id)
  if (error) throw ApiError.badRequest(error.message)
}
