import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'CUSTOMER'
    },
    profileImage: { type: String, default: null },
    addresses: [addressSchema],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    refreshTokenVersion: { type: Number, default: 0 },
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false }
  },
  { timestamps: true }
)

userSchema.index({ role: 1 })

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

export const User = mongoose.model('User', userSchema)
