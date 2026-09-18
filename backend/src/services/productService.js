import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { uniqueSlug } from '../utils/slugify.js'
import { rowToDoc } from '../utils/serialize.js'

const SORT_MAP = {
  price_asc: { column: 'base_price', ascending: true },
  price_desc: { column: 'base_price', ascending: false },
  popular: { column: 'is_popular', ascending: false },
  newest: { column: 'created_at', ascending: false },
  rating: { column: 'rating', ascending: false }
}

function withEffectivePrice(product) {
  if (!product) return product
  product.effectivePrice =
    product.discountPrice != null && product.discountPrice < product.basePrice
      ? product.discountPrice
      : product.basePrice
  return product
}

function withEffectivePrices(products) {
  return products.map(withEffectivePrice)
}

export async function listProducts(query, { includeInactive = false } = {}) {
  let q = supabase.from('products').select('*, category:categories(id, name, slug)', { count: 'exact' })

  if (!includeInactive) q = q.eq('is_available', true)
  else if (query.available !== undefined) q = q.eq('is_available', query.available)

  if (query.category) q = q.eq('category_id', query.category)
  if (query.featured !== undefined) q = q.eq('is_featured', query.featured)
  if (query.popular !== undefined) q = q.eq('is_popular', query.popular)

  if (query.minPrice !== undefined) q = q.gte('base_price', query.minPrice)
  if (query.maxPrice !== undefined) q = q.lte('base_price', query.maxPrice)

  if (query.minRating !== undefined) q = q.gte('rating', query.minRating)

  if (query.search) {
    q = q.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`)
  }

  const page = query.page || 1
  const limit = query.limit || 20
  const sort = SORT_MAP[query.sort] || { column: 'created_at', ascending: false }
  q = q.order(sort.column, { ascending: sort.ascending })
  if (query.sort === 'popular') q = q.order('rating', { ascending: false })

  const from = (page - 1) * limit
  const to = from + limit - 1
  q = q.range(from, to)

  const { data, error, count } = await q
  if (error) throw ApiError.badRequest(error.message)

  const items = withEffectivePrices(rowToDoc(data))

  return {
    items,
    pagination: { page, limit, total: count || 0, totalPages: Math.max(1, Math.ceil((count || 0) / limit)) }
  }
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Product not found')
  return withEffectivePrice(rowToDoc(data))
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Product not found')
  return withEffectivePrice(rowToDoc(data))
}

function toRow(payload) {
  const row = {}
  if (payload.name !== undefined) row.name = payload.name
  if (payload.description !== undefined) row.description = payload.description
  if (payload.category !== undefined) row.category_id = payload.category
  if (payload.images !== undefined) row.images = payload.images
  if (payload.basePrice !== undefined) row.base_price = payload.basePrice
  if (payload.discountPrice !== undefined) row.discount_price = payload.discountPrice
  if (payload.sizes !== undefined) row.sizes = payload.sizes
  if (payload.crusts !== undefined) row.crusts = payload.crusts
  if (payload.toppings !== undefined) row.toppings = payload.toppings
  if (payload.extras !== undefined) row.extras = payload.extras
  if (payload.ingredients !== undefined) row.ingredients = payload.ingredients
  if (payload.recipe !== undefined) row.recipe = payload.recipe
  if (payload.rating !== undefined) row.rating = payload.rating
  if (payload.reviewCount !== undefined) row.review_count = payload.reviewCount
  if (payload.isAvailable !== undefined) row.is_available = payload.isAvailable
  if (payload.isFeatured !== undefined) row.is_featured = payload.isFeatured
  if (payload.isPopular !== undefined) row.is_popular = payload.isPopular
  return row
}

export async function createProduct(payload) {
  const slug = await uniqueSlug('products', payload.name)
  const { data, error } = await supabase
    .from('products')
    .insert({ ...toRow(payload), slug })
    .select('*, category:categories(id, name, slug)')
    .single()
  if (error) throw ApiError.badRequest(error.message)
  return withEffectivePrice(rowToDoc(data))
}

export async function updateProduct(id, payload) {
  const product = await getProductById(id)
  const row = toRow(payload)
  if (payload.name && payload.name !== product.name) {
    row.slug = await uniqueSlug('products', payload.name, id)
  }
  const { data, error } = await supabase
    .from('products')
    .update(row)
    .eq('id', id)
    .select('*, category:categories(id, name, slug)')
    .single()
  if (error) throw ApiError.badRequest(error.message)
  return withEffectivePrice(rowToDoc(data))
}

export async function deleteProduct(id) {
  await getProductById(id)
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw ApiError.badRequest(error.message)
}

export async function searchProducts(term) {
  if (!term || !term.trim()) return []
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    .eq('is_available', true)
    .limit(20)
  if (error) throw ApiError.badRequest(error.message)
  return withEffectivePrices(rowToDoc(data))
}
