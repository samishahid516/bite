import Joi from 'joi'

export const addFavoriteSchema = Joi.object({
  productId: Joi.string().hex().length(24).required()
})

export const getUserFavoritesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})
