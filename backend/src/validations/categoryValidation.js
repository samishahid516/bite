import Joi from 'joi'

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  description: Joi.string().trim().allow('').max(500),
  image: Joi.string().trim().allow(null, ''),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean()
})

export const updateCategorySchema = createCategorySchema.fork(['name'], (s) => s.optional())
