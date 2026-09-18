import { User } from '../models/User.js'
import { Product } from '../models/Product.js'
import { ApiError } from '../utils/ApiError.js'

export async function addFavorite(userId, productId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')

  const product = await Product.findById(productId)
  if (!product) throw ApiError.notFound('Product not found')

  // Check if already favorited
  if (user.favorites.includes(productId)) {
    throw ApiError.conflict('This product is already in your favorites')
  }

  user.favorites.push(productId)
  await user.save()

  return user.populate('favorites')
}

export async function removeFavorite(userId, productId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')

  const index = user.favorites.findIndex((id) => id.toString() === productId)
  if (index === -1) {
    throw ApiError.notFound('Product not in favorites')
  }

  user.favorites.splice(index, 1)
  await user.save()

  return user.populate('favorites')
}

export async function getUserFavorites(userId, { page = 1, limit = 20 } = {}) {
  const user = await User.findById(userId)
    .populate({
      path: 'favorites',
      model: 'Product',
      select: 'name slug description basePrice discountPrice images rating reviewCount isAvailable isFeatured isPopular'
    })

  if (!user) throw ApiError.notFound('User not found')

  const total = user.favorites.length
  const start = (page - 1) * limit
  const end = start + limit
  const favorites = user.favorites.slice(start, end)

  return {
    favorites,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  }
}

export async function isFavorite(userId, productId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')

  return user.favorites.some((id) => id.toString() === productId)
}
