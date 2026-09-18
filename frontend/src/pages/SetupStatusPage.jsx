import { useEffect, useState } from 'react'
import { fetchHealth } from '../services/healthService'
import { APP_NAME } from '../constants'

export default function SetupStatusPage() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    fetchHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md rounded-xl2 bg-white p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-semibold text-brand-600">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-ink-900/60">Phase 1 setup check</p>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-ink-50 px-4 py-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              status === 'online' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-400'
            }`}
          />
          <span className="text-sm font-medium">
            {status === 'checking' && 'Checking backend connection…'}
            {status === 'online' && 'Backend API is reachable'}
            {status === 'offline' && 'Backend API is unreachable — start the backend server'}
          </span>
        </div>

        <p className="mt-6 text-xs text-ink-900/50">
          This placeholder confirms the React ↔ Express ↔ MongoDB pipeline is wired correctly.
          It will be replaced by the real homepage in Phase 5.
        </p>
      </div>
    </main>
  )
}
