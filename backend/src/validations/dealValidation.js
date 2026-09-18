import Joi from 'joi'

const dealProduct = Joi.object({
  product: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).default(1),
  size: Joi.string().allow(null, '')
})

export const createDealSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().allow('').max(1000),
  image: Joi.string().trim().allow(null, ''),
  products: Joi.array().items(dealProduct).min(1).required(),
  originalPrice: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  branch: Joi.string().hex().length(24).allow(null),
  isActive: Joi.boolean()
})

export const updateDealSchema = createDealSchema.fork(
  ['name', 'products', 'originalPrice', 'discountPrice', 'startDate', 'endDate'],
  (s) => s.optional()
)
