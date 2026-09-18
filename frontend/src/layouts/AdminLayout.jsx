import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Tags,
  MapPin,
  Truck,
  Percent,
  Ticket,
  Users,
  Warehouse,
  ArrowLeft
} from 'lucide-react'
import { APP_NAME } from '../constants'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/products', label: 'Products', icon: UtensilsCrossed },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/inventory', label: 'Store & Inventory', icon: Warehouse },
  { to: '/admin/branches', label: 'Branches', icon: MapPin },
  { to: '/admin/delivery-areas', label: 'Delivery Areas', icon: Truck },
  { to: '/admin/deals', label: 'Deals', icon: Percent },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/customers', label: 'Customers', icon: Users }
]

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-100 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-ink-100 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl2 bg-gradient-to-br from-brand-500 to-brand-700 font-display text-sm font-extrabold text-white">
            A
          </span>
          <span className="font-display text-sm font-extrabold text-ink-900">{APP_NAME}</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-100 p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Site
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        <div className="border-b border-ink-100 bg-white px-4 py-3 md:hidden">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isActive ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
