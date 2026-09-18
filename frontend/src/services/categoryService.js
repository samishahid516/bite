import { apiClient } from './apiClient'

export function listCategories() {
  return apiClient.get('/categories')
}
