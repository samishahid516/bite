import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { rowToDoc } from '../utils/serialize.js'

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    isActive: user.isActive,
    createdAt: user.createdAt
  }
}

export const getProfile = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', req.user._id).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('User not found')

  sendSuccess(res, { message: 'Profile fetched', data: { user: toPublicUser(rowToDoc(data)) } })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage } = req.body

  const row = {}
  if (name !== undefined) row.name = name
  if (phone !== undefined) row.phone = phone
  if (profileImage !== undefined) row.profile_image = profileImage

  const { data, error } = await supabase
    .from('users')
    .update(row)
    .eq('id', req.user._id)
    .select('*')
    .maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('User not found')

  sendSuccess(res, { message: 'Profile updated successfully', data: { user: toPublicUser(rowToDoc(data)) } })
})

export const logout = asyncHandler(async (req, res) => {
  const { data, error: getErr } = await supabase
    .from('users')
    .select('refresh_token_version')
    .eq('id', req.user._id)
    .maybeSingle()
  if (getErr) throw ApiError.badRequest(getErr.message)
  if (!data) throw ApiError.notFound('User not found')

  // Increment refreshTokenVersion to invalidate all existing tokens
  const { error } = await supabase
    .from('users')
    .update({ refresh_token_version: data.refresh_token_version + 1 })
    .eq('id', req.user._id)
  if (error) throw ApiError.badRequest(error.message)

  sendSuccess(res, { message: 'Logged out successfully' })
})
