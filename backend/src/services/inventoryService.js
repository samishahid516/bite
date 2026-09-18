import { InventoryItem } from '../models/InventoryItem.js'
import { Product } from '../models/Product.js'
import { ApiError } from '../utils/ApiError.js'

export async function listItems() {
  return InventoryItem.find().sort({ name: 1 })
}

export async function getItemById(id) {
  const item = await InventoryItem.findById(id)
  if (!item) throw ApiError.notFound('Inventory item not found')
  return item
}

export async function createItem(payload) {
  const exists = await InventoryItem.findOne({ name: new RegExp(`^${payload.name.trim()}$`, 'i') })
  if (exists) throw ApiError.conflict('An inventory item with this name already exists')
  return InventoryItem.create(payload)
}

export async function updateItem(id, payload) {
  const item = await getItemById(id)
  Object.assign(item, payload)
  await item.save()
  return item
}

export async function deleteItem(id) {
  const item = await getItemById(id)
  const inUse = await Product.countDocuments({ 'recipe.item': id })
  if (inUse > 0) {
    throw ApiError.badRequest('Cannot delete an item that is used in a product recipe')
  }
  await item.deleteOne()
}

export async function restockItem(id, quantity) {
  const item = await getItemById(id)
  item.quantityInStock += quantity
  await item.save()
  return item
}

// Deducts recipe ingredients for every product line in an order and tallies totalUsed.
// Called once, when an order is confirmed, so quantities aren't double-counted.
export async function deductForOrder(order) {
  const productIds = order.items
    .filter((i) => i.itemType === 'PRODUCT' && i.product)
    .map((i) => i.product)

  if (productIds.length === 0) return

  const products = await Product.find({ _id: { $in: productIds } }).select('recipe')
  const productMap = new Map(products.map((p) => [p._id.toString(), p]))

  const usage = new Map()
  for (const orderItem of order.items) {
    if (orderItem.itemType !== 'PRODUCT' || !orderItem.product) continue
    const product = productMap.get(orderItem.product.toString())
    if (!product || !product.recipe || product.recipe.length === 0) continue

    for (const ingredient of product.recipe) {
      const key = ingredient.item.toString()
      const amount = ingredient.quantity * orderItem.quantity
      usage.set(key, (usage.get(key) || 0) + amount)
    }
  }

  if (usage.size === 0) return

  const bulkOps = Array.from(usage.entries()).map(([itemId, amount]) => ({
    updateOne: {
      filter: { _id: itemId },
      update: { $inc: { quantityInStock: -amount, totalUsed: amount } }
    }
  }))

  await InventoryItem.bulkWrite(bulkOps)
}
