import * as inventoryService from '../services/inventoryService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listInventoryItems = asyncHandler(async (req, res) => {
  const items = await inventoryService.listItems()
  sendSuccess(res, { message: 'Inventory items fetched', data: { items } })
})

export const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.createItem(req.body)
  sendSuccess(res, { statusCode: 201, message: 'Inventory item created', data: { item } })
})

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateItem(req.params.id, req.body)
  sendSuccess(res, { message: 'Inventory item updated', data: { item } })
})

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  await inventoryService.deleteItem(req.params.id)
  sendSuccess(res, { message: 'Inventory item deleted' })
})

export const restockInventoryItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.restockItem(req.params.id, req.body.quantity)
  sendSuccess(res, { message: 'Inventory item restocked', data: { item } })
})
