import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'
import Dropdown from '../../components/Dropdown'

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))
]

// Mirrors the backend's linear state machine so the dropdown never offers an invalid transition
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
}

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  READY: 'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700'
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => {
    setLoading(true)
    adminService
      .listOrders({ limit: 100, ...(statusFilter ? { status: statusFilter } : {}) })
      .then((res) => setOrders(res.data?.orders || []))
      .catch(() => toast.error('Could not load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId)
    try {
      await adminService.updateOrderStatus(orderId, status)
      toast.success('Order status updated')
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, orderStatus: status } : o)))
    } catch (err) {
      toast.error(err.message || 'Could not update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Orders</h1>
        <div className="w-48">
          <Dropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
            triggerClassName="flex w-full items-center justify-between gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 text-sm font-medium text-ink-700 focus:border-brand-400 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-xl2 bg-white py-16 text-center shadow-card">
          <p className="text-ink-500">No orders found.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-ink-600">
                    {order.deliveryAddress?.name}
                    {order.deliveryAddress?.phone && <span className="block text-xs text-ink-400">{order.deliveryAddress.phone}</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{order.branch?.name || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-brand-600">Rs. {order.total}</td>
                  <td className="px-4 py-3 text-xs text-ink-400">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Dropdown
                      value={order.orderStatus}
                      disabled={updatingId === order._id || VALID_TRANSITIONS[order.orderStatus]?.length === 0}
                      onChange={(status) => handleStatusChange(order._id, status)}
                      options={[
                        { value: order.orderStatus, label: order.orderStatus.replace(/_/g, ' ') },
                        ...(VALID_TRANSITIONS[order.orderStatus] || []).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))
                      ]}
                      triggerClassName={`flex items-center gap-1.5 rounded-full border-0 px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-70 ${STATUS_STYLES[order.orderStatus] || 'bg-ink-100 text-ink-600'}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
