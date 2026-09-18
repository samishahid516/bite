import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'
import Modal from '../../components/Modal'

const EMPTY_FORM = { name: '', description: '', image: '', sortOrder: 0, isActive: true }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminService
      .listAllCategories()
      .then((res) => setCategories(res.data?.categories || []))
      .catch(() => toast.error('Could not load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive
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
      const payload = { ...form, sortOrder: Number(form.sortOrder) }
      if (editing) {
        await adminService.updateCategory(editing._id, payload)
        toast.success('Category updated')
      } else {
        await adminService.createCategory(payload)
        toast.success('Category created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat) => {
    if (!confirm(`Delete "${cat.name}"?`)) return
    try {
      await adminService.deleteCategory(cat._id)
      toast.success('Category deleted')
      setCategories((prev) => prev.filter((c) => c._id !== cat._id))
    } catch (err) {
      toast.error(err.message || 'Could not delete category')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-pop hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{cat.name}</td>
                  <td className="px-4 py-3 text-ink-600">{cat.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(cat)} className="mr-3 text-ink-500 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="text-ink-500 hover:text-red-600">
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
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-500">Name</label>
              <input
                required
                value={form.name}
                onChange={update('name')}
                className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Description</label>
              <textarea
                value={form.description}
                onChange={update('description')}
                rows={2}
                className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Image URL</label>
              <input
                value={form.image}
                onChange={update('image')}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={update('sortOrder')}
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Category'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
