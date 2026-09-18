import mongoose from 'mongoose'

const priceOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 }
  },
  { _id: false }
)

const recipeItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantity: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String }],
    basePrice: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    sizes: [priceOptionSchema],
    crusts: [priceOptionSchema],
    toppings: [priceOptionSchema],
    extras: [priceOptionSchema],
    ingredients: [{ type: String }],
    recipe: [recipeItemSchema],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false }
  },
  { timestamps: true }
)

productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1 })
productSchema.index({ isFeatured: 1, isPopular: 1 })

productSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.discountPrice != null && this.discountPrice < this.basePrice ? this.discountPrice : this.basePrice
})

productSchema.set('toJSON', { virtuals: true })
productSchema.set('toObject', { virtuals: true })

export const Product = mongoose.model('Product', productSchema)
