import * as categoryService from '../services/categoryService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)
  const categories = await categoryService.listCategories({ includeInactive })
  sendSuccess(res, { message: 'Categories fetched', data: { categories } })
})

export const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id)
  sendSuccess(res, { message: 'Category fetched', data: { category } })
})

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body)
  sendSuccess(res, { statusCode: 201, message: 'Category created', data: { category } })
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body)
  sendSuccess(res, { message: 'Category updated', data: { category } })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id)
  sendSuccess(res, { message: 'Category deleted' })
})
