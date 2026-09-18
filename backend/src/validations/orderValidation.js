import Joi from 'joi'

const orderItemSchema = Joi.object({
  itemType: Joi.string().valid('PRODUCT', 'DEAL').required(),
  product: Joi.string().guid({ version: 'uuidv4' }).when('itemType', {
    is: 'PRODUCT',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null)
  }),
  deal: Joi.string().guid({ version: 'uuidv4' }).when('itemType', {
    is: 'DEAL',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null)
  }),
  name: Joi.string().trim().required(),
  image: Joi.string().allow(null),
  size: Joi.string().trim().allow(null),
  crust: Joi.string().trim().allow(null),
  toppings: Joi.array().items(Joi.string().trim()).default([]),
  extras: Joi.array().items(Joi.string().trim()).default([]),
  specialInstructions: Joi.string().trim().allow('').default(''),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0)
})

export const createOrderSchema = Joi.object({
  branch: Joi.string().guid({ version: 'uuidv4' }).required(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  deliveryAddress: Joi.object({
    name: Joi.string().trim().required(),
    phone: Joi.string().trim().allow('').optional(),
    address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    area: Joi.string().trim().required(),
    landmark: Joi.string().trim().allow(''),
    latitude: Joi.number().allow(null),
    longitude: Joi.number().allow(null),
    instructions: Joi.string().trim().allow('')
  }).required(),
  deliveryArea: Joi.string().guid({ version: 'uuidv4' }).required(),
  paymentMethod: Joi.string().valid('COD', 'ONLINE').default('COD'),
  couponCode: Joi.string().uppercase().trim().allow(null, ''),
  specialInstructions: Joi.string().trim().allow('')
})

export const getCustomerOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

export const listAllOrdersQuerySchema = Joi.object({
  status: Joi.string(),
  branch: Joi.string().guid({ version: 'uuidv4' }),
  dateFrom: Joi.date(),
  dateTo: Joi.date(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')
    .required(),
  note: Joi.string().allow('')
})
