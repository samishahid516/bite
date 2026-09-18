import { apiClient } from './apiClient'

export function listInventoryItems() {
  return apiClient.get('/inventory')
}
export function createInventoryItem(data) {
  return apiClient.post('/inventory', data)
}
export function updateInventoryItem(id, data) {
  return apiClient.put(`/inventory/${id}`, data)
}
export function deleteInventoryItem(id) {
  return apiClient.delete(`/inventory/${id}`)
}
export function restockInventoryItem(id, quantity) {
  return apiClient.post(`/inventory/${id}/restock`, { quantity })
}
