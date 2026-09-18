import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, PackageSearch, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import * as orderService from '../services/orderService'

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  READY: 'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderService
      .getMyOrders()
      .then((res) => setOrders(res.data?.orders || []))
      .catch(() => toast.error('Could not load orders'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-ink-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-display text-3xl font-extrabold text-ink-900">My Orders</h1>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-xl2 bg-white p-12 text-center shadow-card">
            <PackageSearch className="h-10 w-10 text-ink-300" />
            <p className="mt-4 text-ink-500">You haven't placed any orders yet.</p>
            <Link to="/menu" className="mt-4 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/order-success/${order._id}`}
                className="flex items-center justify-between rounded-xl2 border border-ink-100 bg-white p-5 shadow-card transition hover:shadow-pop"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-display font-bold text-ink-900">#{order.orderNumber}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[order.orderStatus] || 'bg-ink-100 text-ink-600'}`}>
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">{new Date(order.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm font-semibold text-brand-600">Rs. {order.total}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-ink-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
