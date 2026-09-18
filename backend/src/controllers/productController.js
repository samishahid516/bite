import * as productService from '../services/productService.js'
import * as reviewService from '../services/reviewService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listProducts = asyncHandler(async (req, res) => {
  const includeInactive = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)
  const result = await productService.listProducts(req.query, { includeInactive })
  sendSuccess(res, { message: 'Products fetched', data: result })
})

export const searchProducts = asyncHandler(async (req, res) => {
  const products = await productService.searchProducts(req.query.q)
  sendSuccess(res, { message: 'Search results', data: { products } })
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id)
  sendSuccess(res, { message: 'Product fetched', data: { product } })
})

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body)
  sendSuccess(res, { statusCode: 201, message: 'Product created', data: { product } })
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body)
  sendSuccess(res, { message: 'Product updated', data: { product } })
})

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id)
  sendSuccess(res, { message: 'Product deleted' })
})

export const listProductReviews = asyncHandler(async (req, res) => {
  const { reviews, pagination } = await reviewService.listApprovedReviewsForProduct(req.params.id, req.query)
  sendSuccess(res, { message: 'Reviews fetched', data: { reviews, pagination } })
})
