import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { Beef } from 'lucide-react'
import toast from 'react-hot-toast'
import { setUser, setTokens } from '../features/authSlice'
import * as authService from '../services/authService'
import { APP_NAME } from '../constants'

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)

  useEffect(() => {
    if (user) navigate('/menu')
  }, [user, navigate])

  const onSubmit = async (data) => {
    try {
      const response = await authService.register(data.name, data.email, data.phone, data.password)
      dispatch(setUser(response.data.user))
      dispatch(setTokens({ accessToken: response.data.accessToken }))
      localStorage.setItem('accessToken', response.data.accessToken)
      toast.success('Account created successfully')
      navigate('/menu')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl2 bg-white shadow-card md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white md:flex">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl2 bg-white/15 font-display text-lg font-extrabold">Z</span>
            <h2 className="mt-8 font-display text-3xl font-extrabold leading-tight">Join {APP_NAME} today</h2>
            <p className="mt-3 text-sm text-white/80">Create an account to order faster, track deliveries, and unlock exclusive deals.</p>
          </div>
          <Beef className="h-20 w-20 text-white/30" strokeWidth={1} />
        </div>

        <div className="max-h-[90vh] overflow-y-auto p-8 sm:p-10">
          <h1 className="font-display text-2xl font-bold text-ink-900">Create Account</h1>
          <p className="mt-1 text-sm text-ink-500">Join us to start ordering</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700">Full Name</label>
              <input
                type="text"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                className="mt-1.5 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

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
              <label className="block text-sm font-semibold text-ink-700">Phone</label>
              <input
                type="tel"
                {...register('phone', { required: 'Phone is required' })}
                className="mt-1.5 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
                className="mt-1.5 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: (v) => v === password || 'Passwords do not match'
                })}
                className="mt-1.5 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-brand-600 py-3 font-semibold text-white shadow-pop transition hover:bg-brand-700"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
