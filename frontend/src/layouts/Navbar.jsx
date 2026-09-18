import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Menu, X, ShoppingBag, User, LogOut, ChevronDown, ClipboardList, LayoutDashboard } from 'lucide-react'
import toast from 'react-hot-toast'
import { logout as logoutAction } from '../features/authSlice'
import * as authService from '../services/authService'
import { APP_NAME } from '../constants'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/nashta', label: 'Nashta' }
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const user = useSelector((s) => s.auth.user)
  const cartItems = useSelector((s) => s.cart.items)
  const cartCount = cartItems.reduce((sum, it) => sum + (it.quantity || 1), 0)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authService.logout()
      dispatch(logoutAction())
      toast.success('Logged out')
      navigate('/')
    } catch {
      toast.error('Logout failed')
    }
    setAccountOpen(false)
  }

  return (
    <nav className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
      <div className="flex h-9 items-center justify-center bg-ink-900 px-4 text-center text-xs font-medium text-white">
        Free delivery on orders above Rs. 1500 🎉
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl2 bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-extrabold text-white shadow-pop">
              A
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-ink-900">{APP_NAME}</span>
          </Link>

          <div className="hidden gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-semibold text-ink-700 transition hover:text-brand-600"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-brand-700 transition hover:bg-brand-100"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden text-sm font-semibold sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-ink-100 px-3 py-2 text-sm font-semibold text-ink-800 hover:border-brand-200 hover:text-brand-600"
                >
                  <User className="h-4 w-4" />
                  {user.name?.split(' ')[0]}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl2 border border-ink-100 bg-white py-1 shadow-card">
                    <Link
                      to="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <ClipboardList className="h-4 w-4" /> My Orders
                    </Link>
                    {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-100">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-pop transition hover:bg-brand-700"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-ink-800 md:hidden">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-ink-100 py-3 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                >
                  My Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                >
                  My Orders
                </Link>
                {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
