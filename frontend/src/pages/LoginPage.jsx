import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { setUser, setTokens } from '../features/authSlice'
import * as authService from '../services/authService'
import { APP_NAME } from '../constants'

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)

  useEffect(() => {
    if (user) navigate('/menu')
  }, [user, navigate])

  const onSubmit = async (data) => {
    try {
      const response = await authService.login(data.email, data.password)
      dispatch(setUser(response.data.user))
      dispatch(setTokens({ accessToken: response.data.accessToken }))
      localStorage.setItem('accessToken', response.data.accessToken)
      toast.success('Logged in successfully')
      navigate('/menu')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl2 bg-white shadow-card md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white md:flex">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl2 bg-white/15 font-display text-lg font-extrabold">Z</span>
            <h2 className="mt-8 font-display text-3xl font-extrabold leading-tight">Welcome back to {APP_NAME}</h2>
            <p className="mt-3 text-sm text-white/80">Sign in to track orders, save favorites, and order faster.</p>
          </div>
          <Flame className="h-20 w-20 text-white/30" strokeWidth={1} />
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="font-display text-2xl font-bold text-ink-900">Sign In</h1>
          <p className="mt-1 text-sm text-ink-500">Enter your details to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="mt-1.5 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="mt-1.5 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-brand-600 py-3 font-semibold text-white shadow-pop transition hover:bg-brand-700"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
