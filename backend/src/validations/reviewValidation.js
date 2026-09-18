import Joi from 'joi'

export const createReviewSchema = Joi.object({
  productId: Joi.string().guid({ version: 'uuidv4' }).required(),
  orderId: Joi.string().guid({ version: 'uuidv4' }).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('').max(500)
})

export const listProductReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
})

export const listPendingReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})
