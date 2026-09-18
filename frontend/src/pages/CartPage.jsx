import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Minus, Plus, Trash2, ShoppingBag, Tag, ArrowRight, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { removeFromCart, updateQuantity, applyCoupon, removeCoupon } from '../features/cartSlice'
import * as orderService from '../services/orderService'
import FoodImage from '../components/FoodImage'

export default function CartPage() {
  const items = useSelector((s) => s.cart.items)
  const appliedCoupon = useSelector((s) => s.cart.appliedCoupon)
  const branchName = useSelector((s) => s.cart.selectedBranchName)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState('')
  const [applying, setApplying] = useState(false)

  const subtotal = items.reduce((sum, it) => sum + it.basePrice * it.quantity, 0)
  const discount = appliedCoupon?.discount || 0
  const total = Math.max(0, subtotal - discount)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setApplying(true)
    try {
      const res = await orderService.validateCoupon(couponCode.trim().toUpperCase(), subtotal)
      dispatch(applyCoupon({ code: couponCode.trim().toUpperCase(), discount: res.data.discount, coupon: res.data.coupon }))
      toast.success('Coupon applied!')
    } catch (err) {
      toast.error(err.message || 'Invalid coupon code')
    } finally {
      setApplying(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-ink-50 px-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <ShoppingBag className="h-9 w-9 text-brand-400" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-ink-500">Looks like you haven't added anything yet.</p>
        <Link
          to="/menu"
          className="mt-6 rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-brand-700"
        >
          Browse Menu
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ink-50 py-10">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="font-display text-3xl font-extrabold text-ink-900">Your Cart</h1>
        {branchName && <p className="mt-1 text-sm text-ink-500">Ordering from {branchName}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-4 rounded-xl2 border border-ink-100 bg-white p-4 shadow-card">
                <FoodImage src={item.image} alt={item.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" iconClassName="h-7 w-7" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-ink-900">{item.name}</h3>
                      {item.itemType === 'DEAL' && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">DEAL</span>
                      )}
                    </div>
                    <button onClick={() => dispatch(removeFromCart(idx))} className="text-ink-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-600">Rs. {item.basePrice}</span>
                    <div className="flex items-center gap-3 rounded-full bg-ink-50 px-2 py-1">
                      <button
                        onClick={() => dispatch(updateQuantity({ index: idx, quantity: item.quantity - 1 }))}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-600 shadow hover:text-brand-600"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(updateQuantity({ index: idx, quantity: item.quantity + 1 }))}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-600 shadow hover:text-brand-600"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-ink-900">Order Summary</h2>

            <div className="mt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Tag className="h-3.5 w-3.5" /> {appliedCoupon.code}
                  </span>
                  <button onClick={() => dispatch(removeCoupon())} className="text-green-700 hover:text-green-900">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applying}
                    className="flex items-center gap-1 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal</span>
                <span>Rs. {subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- Rs. {discount}</span>
                </div>
              )}
              <p className="text-xs text-ink-400">Delivery fee &amp; tax calculated at checkout</p>
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-ink-900">
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 font-semibold text-white shadow-pop transition hover:bg-brand-700"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
