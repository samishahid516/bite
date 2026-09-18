import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    image: { type: String, required: true },
    buttonText: { type: String, default: 'Order Now' },
    buttonUrl: { type: String, default: '/menu' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

export const Banner = mongoose.model('Banner', bannerSchema)
