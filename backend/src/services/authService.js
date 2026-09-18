import crypto from 'node:crypto'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'

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

export async function registerCustomer({ name, email, phone, password }) {
  const existing = await User.findOne({ email })
  if (existing) {
    throw ApiError.conflict('An account with this email already exists')
  }

  const user = await User.create({ name, email, phone, password, role: 'CUSTOMER' })
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  return { user: toPublicUser(user), accessToken, refreshToken }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password')
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been disabled')
  }

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  return { user: toPublicUser(user), accessToken, refreshToken }
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token missing')
  }

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token')
  }

  const user = await User.findById(payload.sub)
  if (!user || !user.isActive || user.refreshTokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Session is no longer valid')
  }

  const accessToken = signAccessToken(user)
  const newRefreshToken = signRefreshToken(user)

  return { user: toPublicUser(user), accessToken, refreshToken: newRefreshToken }
}

export async function logout(refreshToken) {
  if (!refreshToken) return

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    return
  }

  const user = await User.findById(payload.sub)
  if (user) {
    user.refreshTokenVersion += 1
    await user.save()
  }
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email })
  if (!user) {
    // Do not reveal whether the account exists.
    return { devResetToken: null }
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  user.resetPasswordTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000)
  await user.save()

  // No email provider is configured yet; returning the token here is a dev-only
  // convenience so the reset flow is fully testable end-to-end.
  return { devResetToken: rawToken }
}

export async function resetPassword(token, newPassword) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() }
  }).select('+resetPasswordTokenHash +resetPasswordExpires')

  if (!user) {
    throw ApiError.badRequest('Reset token is invalid or has expired')
  }

  user.password = newPassword
  user.resetPasswordTokenHash = null
  user.resetPasswordExpires = null
  user.refreshTokenVersion += 1
  await user.save()
}

export { toPublicUser }
