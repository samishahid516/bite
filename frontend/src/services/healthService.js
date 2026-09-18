import { apiClient } from './apiClient'

export function fetchHealth() {
  return apiClient.get('/health')
}
