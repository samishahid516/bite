import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Loader2, MapPin, Wallet, ArrowRight, LocateFixed } from 'lucide-react'
import toast from 'react-hot-toast'
import { clearCart, removeFromCart, setBranch } from '../features/cartSlice'
import * as branchService from '../services/branchService'
import * as orderService from '../services/orderService'

// Free reverse-geocoding via OpenStreetMap Nominatim (no API key required).
// Google's Geocoding API needs a billing-enabled API key we don't have, so this
// is the closest "fetch address from location" option that's genuinely free.
async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error('Reverse geocoding failed')
  return res.json()
}

export default function CheckoutPage() {
  const items = useSelector((s) => s.cart.items)
  const branchId = useSelector((s) => s.cart.selectedBranchId)
  const branchName = useSelector((s) => s.cart.selectedBranchName)
  const appliedCoupon = useSelector((s) => s.cart.appliedCoupon)
  const user = useSelector((s) => s.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [areas, setAreas] = useState([])
  const [branchCity, setBranchCity] = useState('')
  const [loadingAreas, setLoadingAreas] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    areaId: '',
    landmark: '',
    instructions: '',
    latitude: null,
    longitude: null,
    paymentMethod: 'COD'
  })

  useEffect(() => {
    if (!branchId || items.length === 0) {
      navigate(items.length === 0 ? '/cart' : '/branch-select')
      return
    }

    let cancelled = false

    const loadForBranch = async (id) => {
      const [areasRes, branchRes] = await Promise.all([
        branchService.listDeliveryAreas(id),
        branchService.getBranch(id)
      ])
      return {
        areas: areasRes.data?.areas || [],
        city: branchRes.data?.branch?.city || ''
      }
    }

    // Self-heal: if the selected branch no longer exists (a stale ID left over from
    // before a data reset) or simply has no delivery areas configured, transparently
    // switch to a branch that works instead of dead-ending the checkout flow.
    const findWorkingBranch = async (excludeId) => {
      const branchesRes = await branchService.listBranches()
      const candidates = branchesRes.data?.branches || []
      for (const candidate of candidates) {
        if (candidate._id === excludeId) continue
        try {
          const candidateResult = await loadForBranch(candidate._id)
          if (candidateResult.areas.length > 0) {
            if (!cancelled) dispatch(setBranch({ id: candidate._id, name: candidate.name }))
            return candidateResult
          }
        } catch {
          // this candidate is broken too, try the next one
        }
      }
      return null
    }

    loadForBranch(branchId)
      .then(async (result) => (result.areas.length === 0 ? (await findWorkingBranch(branchId)) || result : result))
      .catch(() => findWorkingBranch(branchId))
      .then((result) => {
        if (cancelled || !result) return
        setAreas(result.areas)
        if (result.areas.length > 0) setForm((f) => ({ ...f, areaId: result.areas[0]._id }))
        setBranchCity(result.city)
      })
      .catch(() => toast.error('Could not load delivery details'))
      .finally(() => !cancelled && setLoadingAreas(false))

    return () => {
      cancelled = true
    }
  }, [branchId, items.length, navigate, dispatch])

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const data = await reverseGeocode(latitude, longitude)
          setForm((f) => ({
            ...f,
            address: data.display_name || f.address,
            latitude,
            longitude
          }))
          toast.success('Location detected')
        } catch {
          toast.error('Could not detect address from your location')
        } finally {
          setLocating(false)
        }
      },
      () => {
        toast.error('Could not access your location')
        setLocating(false)
      }
    )
  }

  const subtotal = items.reduce((sum, it) => sum + it.basePrice * it.quantity, 0)
  const selectedArea = areas.find((a) => a._id === form.areaId)
  const deliveryFee = selectedArea?.deliveryFee || 0
  const discount = appliedCoupon?.discount || 0
  const estimatedTotal = Math.max(0, subtotal - discount) + deliveryFee

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedArea) {
      toast.error('Please select a delivery area')
      return
    }
    if (subtotal < (selectedArea.minimumOrder || 0)) {
      toast.error(`Minimum order for this area is Rs. ${selectedArea.minimumOrder}`)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        branch: branchId,
        items: items.map((it) => ({
          itemType: it.itemType === 'DEAL' ? 'DEAL' : 'PRODUCT',
          product: it.itemType === 'DEAL' ? null : it.productId,
          deal: it.itemType === 'DEAL' ? it.dealId : null,
          name: it.name,
          image: it.image || null,
          quantity: it.quantity,
          specialInstructions: ''
        })),
        deliveryAddress: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: branchCity,
          area: selectedArea.name,
          landmark: form.landmark,
          instructions: form.instructions,
          latitude: form.latitude,
          longitude: form.longitude
        },
        deliveryArea: selectedArea._id,
        paymentMethod: form.paymentMethod,
        couponCode: appliedCoupon?.code || '',
        specialInstructions: form.instructions
      }
      const res = await orderService.createOrder(payload)
      dispatch(clearCart())
      toast.success('Order placed successfully!')
      navigate(`/order-success/${res.data.order._id}`, { state: { order: res.data.order } })
    } catch (err) {
      const msg = err.message || 'Could not place order'
      // A product/deal can go stale between adding to cart and checkout (e.g. an
      // admin removed it, or - during active development - a database reseed).
      // Drop just that item instead of leaving the whole cart permanently stuck.
      const match = msg.match(/^(Product|Deal) not found: (\S+)/)
      const staleIndex = match
        ? items.findIndex((it) => (match[1] === 'Product' ? it.productId === match[2] : it.dealId === match[2]))
        : -1
      if (staleIndex !== -1) {
        toast.error(`"${items[staleIndex].name}" is no longer available and was removed from your cart. Please review and try again.`)
        dispatch(removeFromCart(staleIndex))
      } else {
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!branchId || items.length === 0) return null

  return (
    <main className="min-h-screen bg-ink-50 py-10">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="font-display text-3xl font-extrabold text-ink-900">Checkout</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin className="h-4 w-4 text-brand-500" /> Delivering from {branchName}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="font-display font-bold text-ink-900">Delivery Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-500">Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={update('name')}
                    className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500">Phone (optional)</label>
                  <input
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="For delivery updates"
                    className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink-500">Street Address</label>
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={locating}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
                    >
                      {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                      Use My Location
                    </button>
                  </div>
                  <input
                    required
                    value={form.address}
                    onChange={update('address')}
                    placeholder="House #, Street, Block"
                    className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-ink-500">Landmark (optional)</label>
                  <input
                    value={form.landmark}
                    onChange={update('landmark')}
                    className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-ink-500">Delivery Instructions (optional)</label>
                  <textarea
                    value={form.instructions}
                    onChange={update('instructions')}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="font-display font-bold text-ink-900">Payment Method</h2>
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border-2 border-brand-500 bg-brand-50 p-4">
                <input type="radio" checked readOnly className="accent-brand-600" />
                <Wallet className="h-5 w-5 text-brand-600" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Cash on Delivery</p>
                  <p className="text-xs text-ink-500">Pay when your order arrives</p>
                </div>
              </label>
            </div>
          </div>

          <div className="h-fit rounded-xl2 border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-ink-900">Order Summary</h2>
            <ul className="mt-4 space-y-2 text-sm text-ink-600">
              {items.map((it, idx) => (
                <li key={idx} className="flex justify-between">
                  <span className="line-clamp-1">{it.quantity}x {it.name}</span>
                  <span>Rs. {it.basePrice * it.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
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
              <div className="flex justify-between text-ink-600">
                <span>Delivery Fee</span>
                <span>Rs. {deliveryFee}</span>
              </div>
              <p className="text-xs text-ink-400">Tax calculated at order confirmation</p>
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-ink-900">
                <span>Estimated Total</span>
                <span>Rs. {estimatedTotal}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || loadingAreas || areas.length === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 font-semibold text-white shadow-pop transition hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Place Order <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
