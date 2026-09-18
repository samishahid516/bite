import { apiClient } from './apiClient'

export function listBranches(lat, lng, city) {
  const params = new URLSearchParams()
  if (lat !== undefined) params.append('lat', lat)
  if (lng !== undefined) params.append('lng', lng)
  if (city) params.append('city', city)
  return apiClient.get(`/branches?${params}`)
}

export function getBranch(id) {
  return apiClient.get(`/branches/${id}`)
}

export function checkDelivery(branchId, area) {
  return apiClient.get(`/delivery-areas/check?branch=${branchId}&area=${encodeURIComponent(area)}`)
}

export function listDeliveryAreas(branchId) {
  return apiClient.get(`/delivery-areas?branch=${branchId}`)
}
