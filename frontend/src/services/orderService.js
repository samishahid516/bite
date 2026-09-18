import { apiClient } from './apiClient'

export function createOrder(orderData) {
  return apiClient.post('/orders', orderData)
}

export function getOrder(id) {
  return apiClient.get(`/orders/${id}`)
}

export function getMyOrders(page = 1, limit = 20) {
  return apiClient.get(`/orders/my-orders?page=${page}&limit=${limit}`)
}

export function cancelOrder(id) {
  return apiClient.delete(`/orders/${id}`)
}

export function createReview(productId, orderId, rating, comment) {
  return apiClient.post('/reviews', { productId, orderId, rating, comment })
}

export function validateCoupon(code, subtotal) {
  return apiClient.post('/coupons/validate', { code, subtotal })
}
