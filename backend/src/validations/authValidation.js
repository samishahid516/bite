import Joi from 'joi'

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  password: Joi.string().min(8).max(72).required()
})

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required()
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required()
})

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(72).required()
})
