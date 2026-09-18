import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    addresses: user.addresses,
    favorites: user.favorites,
    isActive: user.isActive,
    createdAt: user.createdAt
  }
}

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('User not found')

  sendSuccess(res, { message: 'Profile fetched', data: { user: toPublicUser(user) } })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage } = req.body

  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('User not found')

  if (name !== undefined) user.name = name
  if (phone !== undefined) user.phone = phone
  if (profileImage !== undefined) user.profileImage = profileImage

  await user.save()
  sendSuccess(res, { message: 'Profile updated successfully', data: { user: toPublicUser(user) } })
})

export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('User not found')

  // Increment refreshTokenVersion to invalidate all existing tokens
  user.refreshTokenVersion += 1
  await user.save()

  sendSuccess(res, { message: 'Logged out successfully' })
})
