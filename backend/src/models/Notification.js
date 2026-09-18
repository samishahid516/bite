import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    audience: { type: String, enum: ['CUSTOMER', 'ADMIN'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['ORDER_PLACED', 'ORDER_STATUS', 'NEW_ORDER', 'GENERAL'],
      default: 'GENERAL'
    },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, isRead: 1 })
notificationSchema.index({ audience: 1, isRead: 1 })

export const Notification = mongoose.model('Notification', notificationSchema)
