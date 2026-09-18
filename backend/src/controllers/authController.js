import * as authService from '../services/authService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { clearRefreshCookie, setRefreshCookie } from '../utils/jwt.js'
import { toPublicUser } from '../services/authService.js'

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerCustomer(req.body)
  setRefreshCookie(res, refreshToken)
  sendSuccess(res, { statusCode: 201, message: 'Account created successfully', data: { user, accessToken } })
})

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body)
  setRefreshCookie(res, refreshToken)
  sendSuccess(res, { message: 'Logged in successfully', data: { user, accessToken } })
})

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.refreshToken)
  clearRefreshCookie(res)
  sendSuccess(res, { message: 'Logged out successfully' })
})

export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refreshSession(req.cookies?.refreshToken)
  setRefreshCookie(res, refreshToken)
  sendSuccess(res, { message: 'Session refreshed', data: { user, accessToken } })
})

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Current user', data: { user: toPublicUser(req.user) } })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { devResetToken } = await authService.requestPasswordReset(req.body.email)
  sendSuccess(res, {
    message: 'If an account with that email exists, a reset link has been sent',
    data: process.env.NODE_ENV !== 'production' ? { devResetToken } : {}
  })
})

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password)
  sendSuccess(res, { message: 'Password has been reset successfully' })
})
