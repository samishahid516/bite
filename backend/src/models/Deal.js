import mongoose from 'mongoose'

const dealProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, default: null }
  },
  { _id: false }
)

const dealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    image: { type: String, default: null },
    products: [dealProductSchema],
    originalPrice: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

dealSchema.index({ isActive: 1, startDate: 1, endDate: 1 })

export const Deal = mongoose.model('Deal', dealSchema)
