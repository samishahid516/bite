import { apiClient } from './apiClient'

export function listBanners() {
  return apiClient.get('/banners')
}
