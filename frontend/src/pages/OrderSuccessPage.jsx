import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CheckCircle2, Loader2, MapPin, Phone, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import * as orderService from '../services/orderService'
import { APP_NAME } from '../constants'

const STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
const STEP_LABELS = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered'
}

export default function OrderSuccessPage() {
  const { id } = useParams()
  const location = useLocation()
  const user = useSelector((s) => s.auth.user)
  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)

  useEffect(() => {
    if (location.state?.order) return
    orderService
      .getOrder(id)
      .then((res) => setOrder(res.data.order))
      .catch(() => toast.error('Could not load order'))
      .finally(() => setLoading(false))
  }, [id, location.state])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-ink-500">Order not found.</p>
        <Link to="/menu" className="mt-4 text-brand-600 hover:underline">Back to Menu</Link>
      </div>
    )
  }

  const isCancelled = order.orderStatus === 'CANCELLED'
  const currentStepIndex = STEPS.indexOf(order.orderStatus)

  return (
    <main className="min-h-screen bg-ink-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <div className="hidden print:block print:mb-6 print:text-center">
          <h1 className="font-display text-2xl font-extrabold text-ink-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-ink-600">Order Receipt</p>
          <p className="mt-1 text-xs text-ink-500">
            Order #{order.orderNumber} &middot; {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="no-print rounded-xl2 border border-ink-100 bg-white p-8 text-center shadow-card">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-900">Order Placed Successfully!</h1>
          <p className="mt-1 text-sm text-ink-500">Order #{order.orderNumber}</p>
          <button
            onClick={() => window.print()}
            className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-ink-200 px-5 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-100"
          >
            <Printer className="h-4 w-4" /> Print Bill
          </button>
        </div>

        {!isCancelled && (
          <div className="no-print mt-6 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="font-display font-bold text-ink-900">Order Status</h2>
            <div className="mt-6 flex items-center justify-between">
              {STEPS.map((step, idx) => (
                <div key={step} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <div
                      className={`h-1.5 flex-1 ${idx === 0 ? 'invisible' : idx <= currentStepIndex ? 'bg-brand-500' : 'bg-ink-100'}`}
                    />
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        idx <= currentStepIndex ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div
                      className={`h-1.5 flex-1 ${idx === STEPS.length - 1 ? 'invisible' : idx < currentStepIndex ? 'bg-brand-500' : 'bg-ink-100'}`}
                    />
                  </div>
                  <span className="mt-2 text-[10px] font-semibold text-ink-500 sm:text-xs">{STEP_LABELS[step]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="font-display font-bold text-ink-900">Delivery Details</h2>
            <p className="mt-3 flex items-start gap-2 text-sm text-ink-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              {order.deliveryAddress.address}, {order.deliveryAddress.area}, {order.deliveryAddress.city}
            </p>
            {order.deliveryAddress.phone && (
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-600">
                <Phone className="h-4 w-4 shrink-0 text-brand-500" /> {order.deliveryAddress.phone}
              </p>
            )}
          </div>

          <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="font-display font-bold text-ink-900">Bill Summary</h2>
            <div className="mt-3 space-y-1.5 text-sm text-ink-600">
              <div className="flex justify-between"><span>Subtotal</span><span>Rs. {order.subtotal}</span></div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>- Rs. {order.couponDiscount}</span></div>
              )}
              <div className="flex justify-between"><span>Delivery Fee</span><span>Rs. {order.deliveryFee}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>Rs. {order.tax}</span></div>
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-ink-900">
                <span>Total</span><span>Rs. {order.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="font-display font-bold text-ink-900">Items</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            {order.items.map((it, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{it.quantity}x {it.name}</span>
                <span>Rs. {it.totalPrice}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="no-print mt-8 flex justify-center gap-4">
          <Link to="/menu" className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-pop hover:bg-brand-700">
            Order More
          </Link>
          {user && (
            <Link to="/orders" className="rounded-full border border-ink-200 px-8 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-100">
              View All Orders
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
