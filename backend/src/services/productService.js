import { Product } from '../models/Product.js'
import { ApiError } from '../utils/ApiError.js'
import { uniqueSlug } from '../utils/slugify.js'

const SORT_MAP = {
  price_asc: { basePrice: 1 },
  price_desc: { basePrice: -1 },
  popular: { isPopular: -1, rating: -1 },
  newest: { createdAt: -1 },
  rating: { rating: -1 }
}

export async function listProducts(query, { includeInactive = false } = {}) {
  const filter = {}
  if (!includeInactive) filter.isAvailable = true
  else if (query.available !== undefined) filter.isAvailable = query.available

  if (query.category) filter.category = query.category
  if (query.featured !== undefined) filter.isFeatured = query.featured
  if (query.popular !== undefined) filter.isPopular = query.popular

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.basePrice = {}
    if (query.minPrice !== undefined) filter.basePrice.$gte = query.minPrice
    if (query.maxPrice !== undefined) filter.basePrice.$lte = query.maxPrice
  }

  if (query.minRating !== undefined) filter.rating = { $gte: query.minRating }

  if (query.search) {
    filter.$text = { $search: query.search }
  }

  const page = query.page || 1
  const limit = query.limit || 20
  const sort = SORT_MAP[query.sort] || { createdAt: -1 }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter)
  ])

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function getProductById(id) {
  const product = await Product.findById(id).populate('category', 'name slug')
  if (!product) throw ApiError.notFound('Product not found')
  return product
}

export async function getProductBySlug(slug) {
  const product = await Product.findOne({ slug }).populate('category', 'name slug')
  if (!product) throw ApiError.notFound('Product not found')
  return product
}

export async function createProduct(payload) {
  const slug = await uniqueSlug(Product, payload.name)
  return Product.create({ ...payload, slug })
}

export async function updateProduct(id, payload) {
  const product = await Product.findById(id)
  if (!product) throw ApiError.notFound('Product not found')

  if (payload.name && payload.name !== product.name) {
    product.slug = await uniqueSlug(Product, payload.name, id)
  }
  Object.assign(product, payload)
  await product.save()
  return product
}

export async function deleteProduct(id) {
  const product = await Product.findById(id)
  if (!product) throw ApiError.notFound('Product not found')
  await product.deleteOne()
}

export async function searchProducts(term) {
  if (!term || !term.trim()) return []
  return Product.find({ $text: { $search: term }, isAvailable: true })
    .populate('category', 'name slug')
    .limit(20)
}
