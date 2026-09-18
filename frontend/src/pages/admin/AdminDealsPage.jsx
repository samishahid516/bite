import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'
import Modal from '../../components/Modal'

function toDateInputValue(date) {
  return new Date(date).toISOString().slice(0, 10)
}

const EMPTY_FORM = {
  name: '',
  description: '',
  image: '',
  originalPrice: '',
  discountPrice: '',
  startDate: toDateInputValue(new Date()),
  endDate: toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  isActive: true,
  selectedProducts: {} // { productId: quantity }
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([adminService.listAllDeals(), adminService.listAllProducts()])
      .then(([dealsRes, productsRes]) => {
        setDeals(dealsRes.data?.deals || [])
        setProducts(productsRes.data?.products || [])
      })
      .catch(() => toast.error('Could not load deals'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (deal) => {
    setEditing(deal)
    const selectedProducts = {}
    ;(deal.products || []).forEach((p) => {
      const id = p.product?._id || p.product
      if (id) selectedProducts[id] = p.quantity
    })
    setForm({
      name: deal.name,
      description: deal.description || '',
      image: deal.image || '',
      originalPrice: deal.originalPrice,
      discountPrice: deal.discountPrice,
      startDate: toDateInputValue(deal.startDate),
      endDate: toDateInputValue(deal.endDate),
      isActive: deal.isActive,
      selectedProducts
    })
    setModalOpen(true)
  }

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const toggleProduct = (productId) => {
    setForm((f) => {
      const next = { ...f.selectedProducts }
      if (next[productId]) delete next[productId]
      else next[productId] = 1
      return { ...f, selectedProducts: next }
    })
  }

  const setProductQty = (productId, qty) => {
    setForm((f) => ({ ...f, selectedProducts: { ...f.selectedProducts, [productId]: Math.max(1, Number(qty) || 1) } }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const productIds = Object.keys(form.selectedProducts)
    if (productIds.length === 0) {
      toast.error('Select at least one product for this deal')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image,
        products: productIds.map((id) => ({ product: id, quantity: form.selectedProducts[id] })),
        originalPrice: Number(form.originalPrice),
        discountPrice: Number(form.discountPrice),
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive
      }
      if (editing) {
        await adminService.updateDeal(editing._id, payload)
        toast.success('Deal updated')
      } else {
        await adminService.createDeal(payload)
        toast.success('Deal created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save deal')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (deal) => {
    if (!confirm(`Delete "${deal.name}"?`)) return
    try {
      await adminService.deleteDeal(deal._id)
      toast.success('Deal deleted')
      setDeals((prev) => prev.filter((d) => d._id !== deal._id))
    } catch (err) {
      toast.error(err.message || 'Could not delete deal')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Deals</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-pop hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Deal
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Ends</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {deals.map((deal) => (
                <tr key={deal._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{deal.name}</td>
                  <td className="px-4 py-3 text-brand-600">
                    Rs. {deal.discountPrice} <span className="ml-1 text-xs text-ink-400 line-through">{deal.originalPrice}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{new Date(deal.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${deal.isActive ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                      {deal.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(deal)} className="mr-3 text-ink-500 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(deal)} className="text-ink-500 hover:text-red-600">
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
        <Modal title={editing ? 'Edit Deal' : 'Add Deal'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-500">Deal Name</label>
              <input required value={form.name} onChange={update('name')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Description</label>
              <textarea value={form.description} onChange={update('description')} rows={2} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Image URL</label>
              <input value={form.image} onChange={update('image')} placeholder="https://..." className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Products in this Deal</label>
              <div className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-ink-100 p-2">
                {products.map((p) => (
                  <div key={p._id} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-ink-50">
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={!!form.selectedProducts[p._id]}
                        onChange={() => toggleProduct(p._id)}
                        className="accent-brand-600"
                      />
                      {p.name}
                    </label>
                    {form.selectedProducts[p._id] && (
                      <input
                        type="number"
                        min="1"
                        value={form.selectedProducts[p._id]}
                        onChange={(e) => setProductQty(p._id, e.target.value)}
                        className="w-16 rounded border border-ink-100 px-2 py-1 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Original Price (Rs.)</label>
                <input required type="number" min="0" value={form.originalPrice} onChange={update('originalPrice')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Deal Price (Rs.)</label>
                <input required type="number" min="0" value={form.discountPrice} onChange={update('discountPrice')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Start Date</label>
                <input required type="date" value={form.startDate} onChange={update('startDate')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">End Date</label>
                <input required type="date" value={form.endDate} onChange={update('endDate')} className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Deal'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
