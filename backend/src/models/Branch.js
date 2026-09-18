import mongoose from 'mongoose'

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    openingTime: { type: String, default: '11:00' },
    closingTime: { type: String, default: '23:59' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

branchSchema.index({ city: 1 })
branchSchema.index({ latitude: 1, longitude: 1 })

branchSchema.methods.isCurrentlyOpen = function isCurrentlyOpen(now = new Date()) {
  const [openH, openM] = this.openingTime.split(':').map(Number)
  const [closeH, closeM] = this.closingTime.split(':').map(Number)
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM
  if (closeMinutes <= openMinutes) {
    return minutesNow >= openMinutes || minutesNow <= closeMinutes
  }
  return minutesNow >= openMinutes && minutesNow <= closeMinutes
}

export const Branch = mongoose.model('Branch', branchSchema)
