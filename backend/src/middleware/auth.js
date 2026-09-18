import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { supabase } from '../config/db.js'
import { rowToDoc } from '../utils/serialize.js'

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    throw ApiError.unauthorized('Authentication token missing')
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    throw ApiError.unauthorized('Invalid or expired token')
  }

  const { data, error } = await supabase.from('users').select('*').eq('id', payload.sub).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)

  const user = data ? rowToDoc(data) : null
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account not found or disabled')
  }

  req.user = user
  next()
})

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized())
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'))
    }
    next()
  }
}

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next()

  try {
    const payload = verifyAccessToken(token)
    const { data } = await supabase.from('users').select('*').eq('id', payload.sub).maybeSingle()
    const user = data ? rowToDoc(data) : null
    if (user && user.isActive) req.user = user
  } catch {
    // ignore invalid token for optional auth
  }
  next()
})
