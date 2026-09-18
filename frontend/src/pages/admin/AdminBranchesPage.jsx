import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'
import Modal from '../../components/Modal'

const EMPTY_FORM = {
  name: '',
  city: '',
  area: '',
  address: '',
  phone: '',
  latitude: '',
  longitude: '',
  openingTime: '09:00',
  closingTime: '23:00',
  isActive: true
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminService
      .listAllBranches()
      .then((res) => setBranches(res.data?.branches || []))
      .catch(() => toast.error('Could not load branches'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (branch) => {
    setEditing(branch)
    setForm({
      name: branch.name,
      city: branch.city,
      area: branch.area,
      address: branch.address,
      phone: branch.phone,
      latitude: branch.latitude,
      longitude: branch.longitude,
      openingTime: branch.openingTime,
      closingTime: branch.closingTime,
      isActive: branch.isActive
    })
    setModalOpen(true)
  }

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }
      if (editing) {
        await adminService.updateBranch(editing._id, payload)
        toast.success('Branch updated')
      } else {
        await adminService.createBranch(payload)
        toast.success('Branch created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save branch')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (branch) => {
    if (!confirm(`Delete "${branch.name}"?`)) return
    try {
      await adminService.deleteBranch(branch._id)
      toast.success('Branch deleted')
      setBranches((prev) => prev.filter((b) => b._id !== branch._id))
    } catch (err) {
      toast.error(err.message || 'Could not delete branch')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Branches</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-pop hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {branches.map((branch) => (
                <tr key={branch._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{branch.name}</td>
                  <td className="px-4 py-3 text-ink-600">{branch.area}, {branch.city}</td>
                  <td className="px-4 py-3 text-ink-600">{branch.openingTime} - {branch.closingTime}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(branch)} className="mr-3 text-ink-500 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(branch)} className="text-ink-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit Branch' : 'Add Branch'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-ink-500">Branch Name</label>
              <input required value={form.name} onChange={update('name')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Phone</label>
              <input required value={form.phone} onChange={update('phone')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">City</label>
              <input required value={form.city} onChange={update('city')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Area</label>
              <input required value={form.area} onChange={update('area')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-ink-500">Address</label>
              <input required value={form.address} onChange={update('address')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Latitude</label>
              <input required type="number" step="any" value={form.latitude} onChange={update('latitude')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Longitude</label>
              <input required type="number" step="any" value={form.longitude} onChange={update('longitude')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Opening Time</label>
              <input required type="time" value={form.openingTime} onChange={update('openingTime')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Closing Time</label>
              <input required type="time" value={form.closingTime} onChange={update('closingTime')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={update('isActive')} className="accent-brand-600" />
              Active
            </label>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 sm:col-span-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Branch'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
