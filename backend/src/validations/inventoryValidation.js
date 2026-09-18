import Joi from 'joi'

const INVENTORY_UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'pack']

export const createInventoryItemSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  unit: Joi.string().valid(...INVENTORY_UNITS).default('pcs'),
  quantityInStock: Joi.number().min(0).default(0),
  lowStockThreshold: Joi.number().min(0).default(10),
  isActive: Joi.boolean()
})

export const updateInventoryItemSchema = createInventoryItemSchema.fork(['name'], (s) => s.optional())

export const restockItemSchema = Joi.object({
  quantity: Joi.number().greater(0).required()
})
