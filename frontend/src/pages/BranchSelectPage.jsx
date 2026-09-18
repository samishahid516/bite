import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { MapPin, Phone, Clock, Navigation, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { setBranch } from '../features/cartSlice'
import * as branchService from '../services/branchService'

export default function BranchSelectPage() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const loadBranches = (lat, lng) => {
    setLoading(true)
    branchService
      .listBranches(lat, lng)
      .then((res) => setBranches(res.data?.branches || []))
      .catch(() => toast.error('Could not load branches'))
      .finally(() => {
        setLoading(false)
        setLocating(false)
      })
  }

  useEffect(() => {
    loadBranches()
  }, [])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => loadBranches(pos.coords.latitude, pos.coords.longitude),
      () => {
        toast.error('Could not access your location')
        setLocating(false)
      }
    )
  }

  const handleSelect = (branch) => {
    dispatch(setBranch({ id: branch._id, name: branch.name }))
    toast.success(`${branch.name} selected`)
    navigate('/menu')
  }

  return (
    <main className="min-h-screen bg-ink-50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink-900">Choose Your Branch</h1>
            <p className="mt-1 text-sm text-ink-500">We'll show you the menu and delivery options for this location.</p>
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="flex items-center gap-2 rounded-full border-2 border-brand-500 px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-60"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            Use My Location
          </button>
        </div>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : branches.length === 0 ? (
          <div className="mt-16 rounded-xl2 bg-white p-12 text-center shadow-card">
            <p className="text-ink-500">No branches available right now.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {branches.map((branch) => (
              <div
                key={branch._id}
                className="flex flex-col rounded-xl2 border border-ink-100 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg font-bold text-ink-900">{branch.name}</h3>
                  {branch.isOpenNow ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Open Now</span>
                  ) : (
                    <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-500">Closed</span>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-sm text-ink-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    {branch.area}, {branch.city}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-brand-500" />
                    {branch.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-brand-500" />
                    {branch.openingTime} - {branch.closingTime}
                  </p>
                  {typeof branch.distanceKm === 'number' && (
                    <p className="text-xs font-semibold text-brand-600">{branch.distanceKm} km away</p>
                  )}
                </div>
                <button
                  onClick={() => handleSelect(branch)}
                  className="mt-5 flex items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Select This Branch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
