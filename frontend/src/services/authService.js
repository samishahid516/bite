import { apiClient } from './apiClient'

export function register(name, email, phone, password) {
  return apiClient.post('/auth/register', { name, email, phone, password })
}

export function login(email, password) {
  return apiClient.post('/auth/login', { email, password })
}

export function logout() {
  return apiClient.post('/auth/logout')
}

export function getMe() {
  return apiClient.get('/auth/me')
}

export function refreshSession() {
  return apiClient.post('/auth/refresh')
}

export function forgotPassword(email) {
  return apiClient.post('/auth/forgot-password', { email })
}

export function resetPassword(token, password) {
  return apiClient.post('/auth/reset-password', { token, password })
}
