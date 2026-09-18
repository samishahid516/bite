import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'
import Modal from '../../components/Modal'
import Dropdown from '../../components/Dropdown'

const EMPTY_FORM = { branch: '', name: '', deliveryFee: '', minimumOrder: '', estimatedDeliveryTime: '30-45 mins', isActive: true }

export default function AdminDeliveryAreasPage() {
  const [areas, setAreas] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([adminService.listAllDeliveryAreas(), adminService.listAllBranches()])
      .then(([areasRes, branchesRes]) => {
        setAreas(areasRes.data?.deliveryAreas || [])
        setBranches(branchesRes.data?.branches || [])
      })
      .catch(() => toast.error('Could not load delivery areas'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, branch: branches[0]?._id || '' })
    setModalOpen(true)
  }

  const openEdit = (area) => {
    setEditing(area)
    setForm({
      branch: area.branch?._id || '',
      name: area.name,
      deliveryFee: area.deliveryFee,
      minimumOrder: area.minimumOrder,
      estimatedDeliveryTime: area.estimatedDeliveryTime,
      isActive: area.isActive
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
      const payload = {
        ...form,
        deliveryFee: Number(form.deliveryFee),
        minimumOrder: Number(form.minimumOrder)
      }
      if (editing) {
        await adminService.updateDeliveryArea(editing._id, payload)
        toast.success('Delivery area updated')
      } else {
        await adminService.createDeliveryArea(payload)
        toast.success('Delivery area created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save delivery area')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (area) => {
    if (!confirm(`Delete "${area.name}"?`)) return
    try {
      await adminService.deleteDeliveryArea(area._id)
      toast.success('Delivery area deleted')
      setAreas((prev) => prev.filter((a) => a._id !== area._id))
    } catch (err) {
      toast.error(err.message || 'Could not delete delivery area')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Delivery Areas</h1>
        <button
          onClick={openCreate}
          disabled={branches.length === 0}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-pop hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add Area
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
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Delivery Fee</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {areas.map((area) => (
                <tr key={area._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{area.name}</td>
                  <td className="px-4 py-3 text-ink-600">{area.branch?.name || '-'}</td>
                  <td className="px-4 py-3 text-brand-600">Rs. {area.deliveryFee}</td>
                  <td className="px-4 py-3 text-ink-600">Rs. {area.minimumOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(area)} className="mr-3 text-ink-500 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(area)} className="text-ink-500 hover:text-red-600">
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
        <Modal title={editing ? 'Edit Delivery Area' : 'Add Delivery Area'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-500">Branch</label>
              <div className="mt-1">
                <Dropdown
                  value={form.branch}
                  onChange={(val) => setForm((f) => ({ ...f, branch: val }))}
                  options={branches.map((b) => ({ value: b._id, label: b.name }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Area Name</label>
              <input required value={form.name} onChange={update('name')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Delivery Fee (Rs.)</label>
                <input required type="number" min="0" value={form.deliveryFee} onChange={update('deliveryFee')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Minimum Order (Rs.)</label>
                <input type="number" min="0" value={form.minimumOrder} onChange={update('minimumOrder')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Estimated Delivery Time</label>
              <input value={form.estimatedDeliveryTime} onChange={update('estimatedDeliveryTime')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={update('isActive')} className="accent-brand-600" />
              Active
            </label>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Delivery Area'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
