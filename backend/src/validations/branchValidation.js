import Joi from 'joi'

export const createBranchSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  city: Joi.string().trim().required(),
  area: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  openingTime: Joi.string().pattern(/^\d{2}:\d{2}$/),
  closingTime: Joi.string().pattern(/^\d{2}:\d{2}$/),
  isActive: Joi.boolean()
})

export const updateBranchSchema = createBranchSchema.fork(
  ['name', 'city', 'area', 'address', 'phone', 'latitude', 'longitude'],
  (s) => s.optional()
)

export const listBranchesQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  city: Joi.string().trim()
})
