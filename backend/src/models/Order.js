import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ['PRODUCT', 'DEAL'], default: 'PRODUCT' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
    name: { type: String, required: true },
    image: { type: String, default: null },
    size: { type: String, default: null },
    crust: { type: String, default: null },
    toppings: [{ type: String }],
    extras: [{ type: String }],
    specialInstructions: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
)

const deliveryAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    landmark: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    instructions: { type: String, default: '' }
  },
  { _id: false }
)

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
]

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    deliveryArea: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryArea', required: true },
    subtotal: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'PENDING' },
    specialInstructions: { type: String, default: '' },
    statusHistory: { type: [statusHistorySchema], default: [] }
  },
  { timestamps: true }
)

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ orderStatus: 1 })
orderSchema.index({ branch: 1 })

export const ORDER_STATUS_VALUES = ORDER_STATUSES
export const Order = mongoose.model('Order', orderSchema)
