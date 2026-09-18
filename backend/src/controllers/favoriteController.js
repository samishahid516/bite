import * as favoriteService from '../services/favoriteService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const addFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.body
  const user = await favoriteService.addFavorite(req.user._id, productId)
  sendSuccess(res, {
    statusCode: 201,
    message: 'Product added to favorites',
    data: { favorites: user.favorites }
  })
})

export const removeFavorite = asyncHandler(async (req, res) => {
  const productId = req.params.productId
  const user = await favoriteService.removeFavorite(req.user._id, productId)
  sendSuccess(res, { message: 'Product removed from favorites', data: { favorites: user.favorites } })
})

export const getUserFavorites = asyncHandler(async (req, res) => {
  const result = await favoriteService.getUserFavorites(req.user._id, {
    page: req.query.page,
    limit: req.query.limit
  })
  sendSuccess(res, { message: 'Favorites fetched', data: result })
})
