import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'
import Modal from '../../components/Modal'
import Dropdown from '../../components/Dropdown'

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'FIXED', label: 'Fixed Amount' }
]

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  maxDiscount: '',
  minOrder: '',
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  usageLimit: '',
  isActive: true
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminService
      .listAllCoupons()
      .then((res) => setCoupons(res.data?.coupons || []))
      .catch(() => toast.error('Could not load coupons'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount ?? '',
      minOrder: coupon.minOrder ?? '',
      expiryDate: new Date(coupon.expiryDate).toISOString().slice(0, 10),
      usageLimit: coupon.usageLimit ?? '',
      isActive: coupon.isActive
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
        code: form.code,
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
        minOrder: form.minOrder === '' ? 0 : Number(form.minOrder),
        expiryDate: form.expiryDate,
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        isActive: form.isActive
      }
      if (editing) {
        await adminService.updateCoupon(editing._id, payload)
        toast.success('Coupon updated')
      } else {
        await adminService.createCoupon(payload)
        toast.success('Coupon created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (coupon) => {
    if (!confirm(`Delete "${coupon.code}"?`)) return
    try {
      await adminService.deleteCoupon(coupon._id)
      toast.success('Coupon deleted')
      setCoupons((prev) => prev.filter((c) => c._id !== coupon._id))
    } catch (err) {
      toast.error(err.message || 'Could not delete coupon')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Coupons</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-pop hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Coupon
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
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{coupon.code}</td>
                  <td className="px-4 py-3 text-brand-600">
                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `Rs. ${coupon.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</td>
                  <td className="px-4 py-3 text-ink-600">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(coupon)} className="mr-3 text-ink-500 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(coupon)} className="text-ink-500 hover:text-red-600">
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
        <Modal title={editing ? 'Edit Coupon' : 'Add Coupon'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-500">Coupon Code</label>
              <input required value={form.code} onChange={update('code')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm uppercase focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Description</label>
              <input value={form.description} onChange={update('description')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Discount Type</label>
                <div className="mt-1">
                  <Dropdown
                    value={form.discountType}
                    onChange={(val) => setForm((f) => ({ ...f, discountType: val }))}
                    options={DISCOUNT_TYPE_OPTIONS}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Value</label>
                <input required type="number" min="0" value={form.discountValue} onChange={update('discountValue')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Max Discount (optional)</label>
                <input type="number" min="0" value={form.maxDiscount} onChange={update('maxDiscount')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Min Order (Rs.)</label>
                <input type="number" min="0" value={form.minOrder} onChange={update('minOrder')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Expiry Date</label>
                <input required type="date" value={form.expiryDate} onChange={update('expiryDate')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Usage Limit (optional)</label>
                <input type="number" min="1" value={form.usageLimit} onChange={update('usageLimit')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Coupon'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
