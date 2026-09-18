import { useEffect, useState } from 'react'
import { Loader2, ShoppingBag, DollarSign, Clock, Package, Users, MapPin, Percent, Ticket, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'

function StatCard({ icon: Icon, label, value, accent = 'text-brand-600 bg-brand-50' }) {
  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-extrabold text-ink-900">{value}</p>
      <p className="text-xs font-medium text-ink-500">{label}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Could not load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink-900">Dashboard</h1>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-400">Today</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Orders Today" value={stats.today.todayOrders} />
        <StatCard icon={DollarSign} label="Revenue Today" value={`Rs. ${Math.round(stats.today.todayRevenue)}`} />
        <StatCard icon={Clock} label="Pending Orders" value={stats.overall.pendingOrders} accent="text-amber-600 bg-amber-50" />
        <StatCard icon={Star} label="Pending Reviews" value={stats.overall.pendingReviews} accent="text-purple-600 bg-purple-50" />
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-ink-400">Overall</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.overall.totalOrders} />
        <StatCard icon={DollarSign} label="Total Revenue" value={`Rs. ${Math.round(stats.overall.totalRevenue)}`} />
        <StatCard icon={DollarSign} label="Avg. Order Value" value={`Rs. ${Math.round(stats.overall.averageOrderValue || 0)}`} />
        <StatCard icon={Users} label="Customers" value={stats.overall.totalCustomers} accent="text-blue-600 bg-blue-50" />
        <StatCard icon={Package} label="Products" value={stats.overall.totalProducts} />
        <StatCard icon={MapPin} label="Branches" value={stats.overall.totalBranches} />
        <StatCard icon={Percent} label="Active Deals" value={stats.overall.activeDeals} accent="text-green-600 bg-green-50" />
        <StatCard icon={Ticket} label="Active Coupons" value={stats.overall.activeCoupons} accent="text-green-600 bg-green-50" />
      </div>
    </div>
  )
}
