import { apiClient } from './apiClient'

export function getDashboardStats() {
  return apiClient.get('/admin/dashboard')
}

export function getCustomers(page = 1, search = '') {
  return apiClient.get(`/admin/customers?page=${page}&search=${encodeURIComponent(search)}`)
}

// Orders
export function listOrders(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiClient.get(`/orders?${query}`)
}

export function updateOrderStatus(id, status, note = '') {
  return apiClient.patch(`/orders/${id}/status`, { status, note })
}

// Products
export function listAllProducts(page = 1) {
  return apiClient.get(`/admin/products?page=${page}&limit=100`)
}
export function createProduct(data) {
  return apiClient.post('/products', data)
}
export function updateProduct(id, data) {
  return apiClient.put(`/products/${id}`, data)
}
export function deleteProduct(id) {
  return apiClient.delete(`/products/${id}`)
}

// Categories
export function listAllCategories() {
  return apiClient.get('/admin/categories?limit=100')
}
export function createCategory(data) {
  return apiClient.post('/categories', data)
}
export function updateCategory(id, data) {
  return apiClient.put(`/categories/${id}`, data)
}
export function deleteCategory(id) {
  return apiClient.delete(`/categories/${id}`)
}

// Branches
export function listAllBranches() {
  return apiClient.get('/admin/branches?limit=100')
}
export function createBranch(data) {
  return apiClient.post('/branches', data)
}
export function updateBranch(id, data) {
  return apiClient.put(`/branches/${id}`, data)
}
export function deleteBranch(id) {
  return apiClient.delete(`/branches/${id}`)
}

// Delivery Areas
export function listAllDeliveryAreas() {
  return apiClient.get('/admin/delivery-areas?limit=100')
}
export function createDeliveryArea(data) {
  return apiClient.post('/delivery-areas', data)
}
export function updateDeliveryArea(id, data) {
  return apiClient.put(`/delivery-areas/${id}`, data)
}
export function deleteDeliveryArea(id) {
  return apiClient.delete(`/delivery-areas/${id}`)
}

// Deals
export function listAllDeals() {
  return apiClient.get('/admin/deals?limit=100')
}
export function createDeal(data) {
  return apiClient.post('/deals', data)
}
export function updateDeal(id, data) {
  return apiClient.put(`/deals/${id}`, data)
}
export function deleteDeal(id) {
  return apiClient.delete(`/deals/${id}`)
}

// Coupons
export function listAllCoupons() {
  return apiClient.get('/admin/coupons?limit=100')
}
export function createCoupon(data) {
  return apiClient.post('/coupons', data)
}
export function updateCoupon(id, data) {
  return apiClient.put(`/coupons/${id}`, data)
}
export function deleteCoupon(id) {
  return apiClient.delete(`/coupons/${id}`)
}
