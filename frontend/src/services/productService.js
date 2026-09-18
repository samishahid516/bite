import { apiClient } from './apiClient'

export function listProducts(query) {
  const params = new URLSearchParams()
  if (query.category) params.append('category', query.category)
  if (query.page) params.append('page', query.page)
  if (query.limit) params.append('limit', query.limit)
  if (query.sort) params.append('sort', query.sort)
  if (query.search) params.append('search', query.search)
  if (query.minPrice !== undefined) params.append('minPrice', query.minPrice)
  if (query.maxPrice !== undefined) params.append('maxPrice', query.maxPrice)
  if (query.featured !== undefined) params.append('featured', query.featured)

  return apiClient.get(`/products?${params}`)
}

export function getProduct(id) {
  return apiClient.get(`/products/${id}`)
}

export function searchProducts(q) {
  return apiClient.get(`/products/search?q=${encodeURIComponent(q)}`)
}

export function listProductReviews(productId) {
  return apiClient.get(`/products/${productId}/reviews`)
}
