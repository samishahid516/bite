import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, PackagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import * as inventoryService from '../../services/inventoryService'
import Modal from '../../components/Modal'
import Dropdown from '../../components/Dropdown'

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'g', label: 'Grams' },
  { value: 'l', label: 'Litres' },
  { value: 'ml', label: 'Millilitres' },
  { value: 'pack', label: 'Packs' }
]

const EMPTY_FORM = { name: '', unit: 'pcs', quantityInStock: '', lowStockThreshold: '10', isActive: true }

export default function AdminInventoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    inventoryService
      .listInventoryItems()
      .then((res) => setItems(res.data?.items || []))
      .catch(() => toast.error('Could not load store items'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name,
      unit: item.unit,
      quantityInStock: item.quantityInStock,
      lowStockThreshold: item.lowStockThreshold,
      isActive: item.isActive
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
        name: form.name,
        unit: form.unit,
        quantityInStock: Number(form.quantityInStock),
        lowStockThreshold: Number(form.lowStockThreshold),
        isActive: form.isActive
      }
      if (editing) {
        await inventoryService.updateInventoryItem(editing._id, payload)
        toast.success('Store item updated')
      } else {
        await inventoryService.createInventoryItem(payload)
        toast.success('Store item added')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save store item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await inventoryService.deleteInventoryItem(item._id)
      toast.success('Store item deleted')
      setItems((prev) => prev.filter((i) => i._id !== item._id))
    } catch (err) {
      toast.error(err.message || 'Could not delete store item')
    }
  }

  const handleRestock = async (item) => {
    const input = prompt(`Add how many ${item.unit} of "${item.name}" to stock?`, '10')
    if (input === null) return
    const quantity = Number(input)
    if (!quantity || quantity <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    setBusyId(item._id)
    try {
      const res = await inventoryService.restockInventoryItem(item._id, quantity)
      const updated = res.data?.item
      setItems((prev) => prev.map((i) => (i._id === item._id ? updated : i)))
      toast.success(`Stock updated: ${item.name}`)
    } catch (err) {
      toast.error(err.message || 'Could not restock item')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Store &amp; Inventory</h1>
          <p className="mt-1 text-sm text-ink-500">Track how much of each ingredient you have and how much has been used.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-pop hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl2 bg-white py-16 text-center shadow-card">
          <p className="text-ink-500">No store items yet. Add ingredients like bread, chicken, or sauces to start tracking stock.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">In Stock</th>
                <th className="px-4 py-3">Low Stock At</th>
                <th className="px-4 py-3">Total Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{item.name}</td>
                  <td className="px-4 py-3 text-ink-600">{item.quantityInStock} {item.unit}</td>
                  <td className="px-4 py-3 text-ink-600">{item.lowStockThreshold} {item.unit}</td>
                  <td className="px-4 py-3 text-brand-600">{item.totalUsed} {item.unit}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        !item.isActive
                          ? 'bg-ink-100 text-ink-500'
                          : item.isLowStock
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {!item.isActive ? 'Inactive' : item.isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRestock(item)}
                      disabled={busyId === item._id}
                      className="mr-3 text-ink-500 hover:text-brand-600 disabled:opacity-50"
                      title="Restock"
                    >
                      <PackagePlus className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(item)} className="mr-3 text-ink-500 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="text-ink-500 hover:text-red-600">
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
        <Modal title={editing ? 'Edit Store Item' : 'Add Store Item'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-500">Item Name</label>
              <input
                required
                value={form.name}
                onChange={update('name')}
                placeholder="e.g. Burger Bread"
                className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Unit</label>
                <div className="mt-1">
                  <Dropdown value={form.unit} onChange={(val) => setForm((f) => ({ ...f, unit: val }))} options={UNIT_OPTIONS} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Quantity In Stock</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.quantityInStock}
                  onChange={update('quantityInStock')}
                  className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Low Stock Alert Threshold</label>
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={update('lowStockThreshold')}
                className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save Changes' : 'Add Item'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
