import Joi from 'joi'

export const createCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(30).required(),
  description: Joi.string().trim().allow('').max(300),
  discountType: Joi.string().valid('PERCENTAGE', 'FIXED').required(),
  discountValue: Joi.number().min(0).required(),
  maxDiscount: Joi.number().min(0).allow(null),
  minOrder: Joi.number().min(0).default(0),
  expiryDate: Joi.date().required(),
  usageLimit: Joi.number().integer().min(1).allow(null),
  isActive: Joi.boolean()
})

export const updateCouponSchema = createCouponSchema.fork(
  ['code', 'discountType', 'discountValue', 'expiryDate'],
  (s) => s.optional()
)

export const validateCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
  subtotal: Joi.number().min(0).required()
})
