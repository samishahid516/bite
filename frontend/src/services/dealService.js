import { apiClient } from './apiClient'

export function listDeals(branchId) {
  const params = new URLSearchParams()
  if (branchId) params.append('branch', branchId)
  return apiClient.get(`/deals?${params}`)
}

export function getDeal(id) {
  return apiClient.get(`/deals/${id}`)
}
