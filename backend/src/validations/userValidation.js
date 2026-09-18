import Joi from 'joi'

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  phone: Joi.string().trim(),
  profileImage: Joi.string().allow(null)
})
