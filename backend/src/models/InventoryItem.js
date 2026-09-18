import mongoose from 'mongoose'

const INVENTORY_UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'pack']

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    unit: { type: String, enum: INVENTORY_UNITS, default: 'pcs' },
    quantityInStock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 10 },
    totalUsed: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

inventoryItemSchema.virtual('isLowStock').get(function isLowStock() {
  return this.quantityInStock <= this.lowStockThreshold
})

inventoryItemSchema.set('toJSON', { virtuals: true })
inventoryItemSchema.set('toObject', { virtuals: true })

export { INVENTORY_UNITS }
export const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema)
