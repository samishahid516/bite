import mongoose from 'mongoose'

const deliveryAreaSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    name: { type: String, required: true, trim: true },
    deliveryFee: { type: Number, required: true, min: 0 },
    minimumOrder: { type: Number, required: true, min: 0, default: 0 },
    estimatedDeliveryTime: { type: String, default: '30-45 mins' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

deliveryAreaSchema.index({ branch: 1, name: 1 }, { unique: true })

export const DeliveryArea = mongoose.model('DeliveryArea', deliveryAreaSchema)
