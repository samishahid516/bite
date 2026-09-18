import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  selectedBranchId: null,
  selectedBranchName: null,
  selectedDeliveryArea: null,
  appliedCoupon: null
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = { quantity: 1, ...action.payload }
      const existing = state.items.find(
        (it) => it.productId === item.productId && JSON.stringify(it.customization) === JSON.stringify(item.customization)
      )
      if (existing) {
        existing.quantity += item.quantity
      } else {
        state.items.push(item)
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((_, idx) => idx !== action.payload)
    },
    updateQuantity: (state, action) => {
      const { index, quantity } = action.payload
      if (state.items[index]) {
        state.items[index].quantity = Math.max(1, quantity)
      }
    },
    clearCart: (state) => {
      state.items = []
      state.appliedCoupon = null
    },
    setBranch: (state, action) => {
      const { id, name } = action.payload
      state.selectedBranchId = id
      state.selectedBranchName = name
      state.selectedDeliveryArea = null
    },
    setDeliveryArea: (state, action) => {
      state.selectedDeliveryArea = action.payload
    },
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null
    }
  }
})

export const { addToCart, removeFromCart, updateQuantity, clearCart, setBranch, setDeliveryArea, applyCoupon, removeCoupon } =
  cartSlice.actions
export default cartSlice.reducer
