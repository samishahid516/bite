import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      adminService
        .getCustomers(1, search)
        .then((res) => setCustomers(res.data?.customers || []))
        .catch(() => toast.error('Could not load customers'))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Customers</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-64 rounded-full border border-ink-100 bg-white py-2 pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-8 rounded-xl2 bg-white py-16 text-center shadow-card">
          <p className="text-ink-500">No customers found.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {customers.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{c.name}</td>
                  <td className="px-4 py-3 text-ink-600">{c.email}</td>
                  <td className="px-4 py-3 text-ink-600">{c.phone}</td>
                  <td className="px-4 py-3 text-xs text-ink-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
