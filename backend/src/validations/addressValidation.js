import Joi from 'joi'

export const createAddressSchema = Joi.object({
  label: Joi.string().valid('Home', 'Office', 'Other').default('Home'),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  area: Joi.string().trim().required(),
  landmark: Joi.string().trim().allow(''),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  isDefault: Joi.boolean()
})

export const updateAddressSchema = createAddressSchema.fork(Object.keys(createAddressSchema.describe().keys), (s) => s.optional())
