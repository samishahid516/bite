import Joi from 'joi'

const priceOption = Joi.object({
  name: Joi.string().trim().required(),
  price: Joi.number().min(0).default(0)
})

const recipeItem = Joi.object({
  item: Joi.string().guid({ version: 'uuidv4' }).required(),
  quantity: Joi.number().min(0).required()
})

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().allow('').max(1000),
  category: Joi.string().guid({ version: 'uuidv4' }).required(),
  images: Joi.array().items(Joi.string()).default([]),
  basePrice: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).allow(null),
  sizes: Joi.array().items(priceOption).default([]),
  crusts: Joi.array().items(priceOption).default([]),
  toppings: Joi.array().items(priceOption).default([]),
  extras: Joi.array().items(priceOption).default([]),
  ingredients: Joi.array().items(Joi.string()).default([]),
  recipe: Joi.array().items(recipeItem).default([]),
  isAvailable: Joi.boolean(),
  isFeatured: Joi.boolean(),
  isPopular: Joi.boolean()
})

export const updateProductSchema = createProductSchema.fork(
  ['name', 'category', 'basePrice'],
  (s) => s.optional()
)

export const listProductsQuerySchema = Joi.object({
  category: Joi.string().guid({ version: 'uuidv4' }),
  search: Joi.string().trim().allow(''),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  minRating: Joi.number().min(0).max(5),
  featured: Joi.boolean(),
  popular: Joi.boolean(),
  available: Joi.boolean(),
  sort: Joi.string().valid('price_asc', 'price_desc', 'popular', 'newest', 'rating'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})
