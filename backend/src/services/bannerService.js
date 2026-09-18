import { supabase } from '../config/db.js'
import { rowToDoc } from '../utils/serialize.js'
import { ApiError } from '../utils/ApiError.js'

export async function listActiveBanners() {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('sort_order', { ascending: true })
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function listAllBanners() {
  const { data, error } = await supabase.from('banners').select('*').order('sort_order', { ascending: true })
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

function toRow(payload) {
  const row = {}
  if (payload.title !== undefined) row.title = payload.title
  if (payload.subtitle !== undefined) row.subtitle = payload.subtitle
  if (payload.image !== undefined) row.image = payload.image
  if (payload.buttonText !== undefined) row.button_text = payload.buttonText
  if (payload.buttonUrl !== undefined) row.button_url = payload.buttonUrl
  if (payload.startDate !== undefined) row.start_date = payload.startDate
  if (payload.endDate !== undefined) row.end_date = payload.endDate
  if (payload.sortOrder !== undefined) row.sort_order = payload.sortOrder
  if (payload.isActive !== undefined) row.is_active = payload.isActive
  return row
}

export async function createBanner(data) {
  const { data: row, error } = await supabase.from('banners').insert(toRow(data)).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(row)
}

export async function updateBanner(id, data) {
  const { data: row, error } = await supabase.from('banners').update(toRow(data)).eq('id', id).select('*').maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  return row ? rowToDoc(row) : null
}

export async function deleteBanner(id) {
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) throw ApiError.badRequest(error.message)
}
