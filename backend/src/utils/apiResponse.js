export function sendSuccess(res, { statusCode = 200, message = 'Operation successful', data = {} } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

export function sendError(res, { statusCode = 500, message = 'Something went wrong', errors = [] } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  })
}
