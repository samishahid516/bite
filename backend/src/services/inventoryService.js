import { supabase } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { rowToDoc } from '../utils/serialize.js'

function withLowStock(item) {
  if (!item) return item
  item.isLowStock = item.quantityInStock <= item.lowStockThreshold
  return item
}

function withLowStocks(items) {
  return items.map(withLowStock)
}

export async function listItems() {
  const { data, error } = await supabase.from('inventory_items').select('*').order('name', { ascending: true })
  if (error) throw ApiError.badRequest(error.message)
  return withLowStocks(rowToDoc(data))
}

export async function getItemById(id) {
  const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).maybeSingle()
  if (error) throw ApiError.badRequest(error.message)
  if (!data) throw ApiError.notFound('Inventory item not found')
  return withLowStock(rowToDoc(data))
}

function toRow(payload) {
  const row = {}
  if (payload.name !== undefined) row.name = payload.name
  if (payload.unit !== undefined) row.unit = payload.unit
  if (payload.quantityInStock !== undefined) row.quantity_in_stock = payload.quantityInStock
  if (payload.lowStockThreshold !== undefined) row.low_stock_threshold = payload.lowStockThreshold
  if (payload.isActive !== undefined) row.is_active = payload.isActive
  return row
}

export async function createItem(payload) {
  const { data: existing, error: existErr } = await supabase
    .from('inventory_items')
    .select('id')
    .ilike('name', payload.name.trim())
    .maybeSingle()
  if (existErr) throw ApiError.badRequest(existErr.message)
  if (existing) throw ApiError.conflict('An inventory item with this name already exists')

  const { data, error } = await supabase.from('inventory_items').insert(toRow(payload)).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return withLowStock(rowToDoc(data))
}

export async function updateItem(id, payload) {
  await getItemById(id)
  const { data, error } = await supabase.from('inventory_items').update(toRow(payload)).eq('id', id).select('*').single()
  if (error) throw ApiError.badRequest(error.message)
  return withLowStock(rowToDoc(data))
}

export async function deleteItem(id) {
  await getItemById(id)

  // recipe is jsonb: [{ itemId, quantity }] on products -- check via containment.
  const { data: inUse, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .contains('recipe', [{ itemId: id }])
  if (error) throw ApiError.badRequest(error.message)
  if (inUse && inUse.length > 0) {
    throw ApiError.badRequest('Cannot delete an item that is used in a product recipe')
  }

  const { error: delErr } = await supabase.from('inventory_items').delete().eq('id', id)
  if (delErr) throw ApiError.badRequest(delErr.message)
}

export async function restockItem(id, quantity) {
  const item = await getItemById(id)
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ quantity_in_stock: item.quantityInStock + quantity })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw ApiError.badRequest(error.message)
  return withLowStock(rowToDoc(data))
}

// Deducts recipe ingredients for every product line in an order and tallies totalUsed.
// Called once, when an order is confirmed, so quantities aren't double-counted.
export async function deductForOrder(order) {
  const productIds = order.items
    .filter((i) => i.itemType === 'PRODUCT' && i.product)
    .map((i) => i.product)

  if (productIds.length === 0) return

  const { data: products, error } = await supabase
    .from('products')
    .select('id, recipe')
    .in('id', productIds)
  if (error) throw ApiError.badRequest(error.message)

  const productMap = new Map(products.map((p) => [p.id, p]))

  const usage = new Map()
  for (const orderItem of order.items) {
    if (orderItem.itemType !== 'PRODUCT' || !orderItem.product) continue
    const product = productMap.get(orderItem.product)
    if (!product || !product.recipe || product.recipe.length === 0) continue

    for (const ingredient of product.recipe) {
      const key = ingredient.itemId
      const amount = ingredient.quantity * orderItem.quantity
      usage.set(key, (usage.get(key) || 0) + amount)
    }
  }

  if (usage.size === 0) return

  for (const [itemId, amount] of usage.entries()) {
    const { data: current, error: getErr } = await supabase
      .from('inventory_items')
      .select('quantity_in_stock, total_used')
      .eq('id', itemId)
      .maybeSingle()
    if (getErr || !current) continue

    await supabase
      .from('inventory_items')
      .update({
        quantity_in_stock: current.quantity_in_stock - amount,
        total_used: current.total_used + amount
      })
      .eq('id', itemId)
  }
}
