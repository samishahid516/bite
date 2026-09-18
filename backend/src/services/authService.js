import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
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

export async function registerCustomer({ name, email, phone, password }) {
  const { data: existing, error: existErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existErr) throw ApiError.badRequest(existErr.message)
  if (existing) {
    throw ApiError.conflict('An account with this email already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, phone, password: hashedPassword, role: 'CUSTOMER' })
    .select('*')
    .single()
  if (error) throw ApiError.badRequest(error.message)

  const user = rowToDoc(data)
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  return { user: toPublicUser(user), accessToken, refreshToken }
}

export async function login({ email, password }) {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)

  if (!data || !(await bcrypt.compare(password, data.password))) {
    throw ApiError.unauthorized('Invalid email or password')
  }

  const user = rowToDoc(data)

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

  const { data, error } = await supabase.from('users').select('*').eq('id', payload.sub).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)

  const user = data ? rowToDoc(data) : null
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

  const { data } = await supabase
    .from('users')
    .select('refresh_token_version')
    .eq('id', payload.sub)
    .maybeSingle()

  if (data) {
    await supabase
      .from('users')
      .update({ refresh_token_version: data.refresh_token_version + 1 })
      .eq('id', payload.sub)
  }
}

export async function requestPasswordReset(email) {
  const { data, error } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)

  if (!data) {
    // Do not reveal whether the account exists.
    return { devResetToken: null }
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  const resetPasswordTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  await supabase
    .from('users')
    .update({ reset_password_token_hash: resetPasswordTokenHash, reset_password_expires: resetPasswordExpires })
    .eq('id', data.id)

  // No email provider is configured yet; returning the token here is a dev-only
  // convenience so the reset flow is fully testable end-to-end.
  return { devResetToken: rawToken }
}

export async function resetPassword(token, newPassword) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const { data, error } = await supabase
    .from('users')
    .select('id, refresh_token_version')
    .eq('reset_password_token_hash', tokenHash)
    .gt('reset_password_expires', new Date().toISOString())
    .maybeSingle()
  if (error) throw ApiError.badRequest(error.message)

  if (!data) {
    throw ApiError.badRequest('Reset token is invalid or has expired')
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await supabase
    .from('users')
    .update({
      password: hashedPassword,
      reset_password_token_hash: null,
      reset_password_expires: null,
      refresh_token_version: data.refresh_token_version + 1
    })
    .eq('id', data.id)
}

export { toPublicUser }
