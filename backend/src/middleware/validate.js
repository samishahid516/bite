import { ApiError } from '../utils/ApiError.js'

export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map((d) => d.message.replace(/"/g, ''))
      return next(ApiError.badRequest('Validation failed', errors))
    }

    req[property] = value
    next()
  }
}
