import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { User, Mail, Phone, ShieldCheck, LogOut, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { logout as logoutAction } from '../features/authSlice'
import * as authService from '../services/authService'

export default function ProfilePage() {
  const user = useSelector((s) => s.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    }
    dispatch(logoutAction())
    toast.success('Logged out')
    navigate('/')
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-ink-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="font-display text-3xl font-extrabold text-ink-900">My Profile</h1>

        <div className="mt-6 rounded-xl2 border border-ink-100 bg-white p-8 shadow-card">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-2xl font-bold text-white">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">{user.name}</h2>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                <ShieldCheck className="h-3 w-3" /> {user.role}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-ink-100 pt-6 text-sm">
            <p className="flex items-center gap-2 text-ink-600">
              <Mail className="h-4 w-4 text-brand-500" /> {user.email}
            </p>
            <p className="flex items-center gap-2 text-ink-600">
              <Phone className="h-4 w-4 text-brand-500" /> {user.phone || 'Not provided'}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/orders')}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white hover:bg-ink-800"
            >
              <ClipboardList className="h-4 w-4" /> My Orders
            </button>
            <button
              onClick={handleLogout}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
