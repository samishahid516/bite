import Joi from 'joi'

export const createDeliveryAreaSchema = Joi.object({
  branch: Joi.string().guid({ version: 'uuidv4' }).required(),
  name: Joi.string().trim().min(2).max(100).required(),
  deliveryFee: Joi.number().min(0).required(),
  minimumOrder: Joi.number().min(0).default(0),
  estimatedDeliveryTime: Joi.string().trim().default('30-45 mins'),
  isActive: Joi.boolean()
})

export const updateDeliveryAreaSchema = createDeliveryAreaSchema.fork(
  ['branch', 'name', 'deliveryFee'],
  (s) => s.optional()
)

export const checkDeliveryQuerySchema = Joi.object({
  branch: Joi.string().guid({ version: 'uuidv4' }).required(),
  area: Joi.string().trim().required()
})
