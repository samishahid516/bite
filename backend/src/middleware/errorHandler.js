import { sendError } from '../utils/apiResponse.js'

export function notFoundHandler(req, res, next) {
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`))
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500
  const message = err.isOperational ? err.message : statusCode === 500 ? 'Internal server error' : err.message

  if (statusCode === 500) {
    console.error('[error]', err)
  }

  sendError(res, {
    statusCode,
    message,
    errors: err.errors || []
  })
}
