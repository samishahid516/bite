import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { uniqueSlug } from '../utils/slugify.js'
import { rowToDoc } from '../utils/serialize.js'

export async function listCategories({ includeInactive = false } = {}) {
  let query = supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true })
  if (!includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function getCategoryById(id) {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Category not found')
  return rowToDoc(data)
}

function toRow(payload) {
  const row = {}
  if (payload.name !== undefined) row.name = payload.name
  if (payload.description !== undefined) row.description = payload.description
  if (payload.image !== undefined) row.image = payload.image
  if (payload.sortOrder !== undefined) row.sort_order = payload.sortOrder
  if (payload.isActive !== undefined) row.is_active = payload.isActive
  return row
}

export async function createCategory(payload) {
  const slug = await uniqueSlug('categories', payload.name)
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...toRow(payload), slug })
    .select('*')
    .single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function updateCategory(id, payload) {
  const category = await getCategoryById(id)
  const row = toRow(payload)
  if (payload.name && payload.name !== category.name) {
    row.slug = await uniqueSlug('categories', payload.name, id)
  }
  const { data, error } = await supabase.from('categories').update(row).eq('id', id).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return rowToDoc(data)
}

export async function deleteCategory(id) {
  await getCategoryById(id)
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw ApiError.badRequest(error.message)
}
