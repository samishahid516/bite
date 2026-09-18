import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    method: { type: String, enum: ['COD', 'ONLINE'], required: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    amount: { type: Number, required: true },
    provider: { type: String, default: null },
    transactionRef: { type: String, default: null },
    raw: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
)

export const Payment = mongoose.model('Payment', paymentSchema)
