import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { rowToDoc } from '../utils/serialize.js'

async function getFavoriteProductIds(userId) {
  const { data, error } = await supabase.from('user_favorites').select('product_id').eq('user_id', userId)
  if (error) throw ApiError.badRequest(error.message)
  return data.map((r) => r.product_id)
}

export async function addFavorite(userId, productId) {
  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle()
  if (productErr) throw ApiError.badRequest(productErr.message)
  if (!product) throw ApiError.notFound('Product not found')

  const { data: existing, error: existErr } = await supabase
    .from('user_favorites')
    .select('product_id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()
  if (existErr) throw ApiError.badRequest(existErr.message)
  if (existing) {
    throw ApiError.conflict('This product is already in your favorites')
  }

  const { error } = await supabase.from('user_favorites').insert({ user_id: userId, product_id: productId })
  if (error) throw ApiError.badRequest(error.message)

  const favorites = await getFavoriteProductIds(userId)
  return { favorites }
}

export async function removeFavorite(userId, productId) {
  const { data: existing, error: existErr } = await supabase
    .from('user_favorites')
    .select('product_id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()
  if (existErr) throw ApiError.badRequest(existErr.message)
  if (!existing) {
    throw ApiError.notFound('Product not in favorites')
  }

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw ApiError.badRequest(error.message)

  const favorites = await getFavoriteProductIds(userId)
  return { favorites }
}

export async function getUserFavorites(userId, { page = 1, limit = 20 } = {}) {
  page = Number(page) || 1
  limit = Number(limit) || 20

  const { data: favRows, error: favErr, count } = await supabase
    .from('user_favorites')
    .select('product_id', { count: 'exact' })
    .eq('user_id', userId)
    .range((page - 1) * limit, (page - 1) * limit + limit - 1)
  if (favErr) throw ApiError.badRequest(favErr.message)

  const productIds = favRows.map((r) => r.product_id)
  let favorites = []
  if (productIds.length > 0) {
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('name, slug, description, base_price, discount_price, images, rating, review_count, is_available, is_featured, is_popular, id')
      .in('id', productIds)
    if (prodErr) throw ApiError.badRequest(prodErr.message)
    const productMap = new Map(products.map((p) => [p.id, p]))
    favorites = productIds.map((id) => rowToDoc(productMap.get(id))).filter(Boolean)
  }

  const total = count || 0

  return {
    favorites,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function isFavorite(userId, productId) {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('product_id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  return Boolean(data)
}
