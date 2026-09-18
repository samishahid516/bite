import { Category } from '../models/Category.js'
import { ApiError } from '../utils/ApiError.js'
import { uniqueSlug } from '../utils/slugify.js'

export async function listCategories({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true }
  return Category.find(filter).sort({ sortOrder: 1, name: 1 })
}

export async function getCategoryById(id) {
  const category = await Category.findById(id)
  if (!category) throw ApiError.notFound('Category not found')
  return category
}

export async function createCategory(payload) {
  const slug = await uniqueSlug(Category, payload.name)
  return Category.create({ ...payload, slug })
}

export async function updateCategory(id, payload) {
  const category = await getCategoryById(id)
  if (payload.name && payload.name !== category.name) {
    category.slug = await uniqueSlug(Category, payload.name, id)
  }
  Object.assign(category, payload)
  await category.save()
  return category
}

export async function deleteCategory(id) {
  const category = await getCategoryById(id)
  await category.deleteOne()
}
