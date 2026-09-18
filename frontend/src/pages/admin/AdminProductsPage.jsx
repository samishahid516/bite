import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import * as adminService from '../../services/adminService'
import * as categoryService from '../../services/categoryService'
import * as inventoryService from '../../services/inventoryService'
import Modal from '../../components/Modal'
import Dropdown from '../../components/Dropdown'

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  images: '',
  basePrice: '',
  discountPrice: '',
  isAvailable: true,
  isFeatured: false,
  isPopular: false,
  recipe: []
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [storeItems, setStoreItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([adminService.listAllProducts(), categoryService.listCategories(), inventoryService.listInventoryItems()])
      .then(([productsRes, categoriesRes, inventoryRes]) => {
        setProducts(productsRes.data?.products || [])
        setCategories(categoriesRes.data?.categories || [])
        setStoreItems(inventoryRes.data?.items || [])
      })
      .catch(() => toast.error('Could not load products'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, category: categories[0]?._id || '' })
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category?._id || '',
      images: product.images?.[0] || '',
      basePrice: product.basePrice,
      discountPrice: product.discountPrice ?? '',
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      isPopular: product.isPopular,
      recipe: (product.recipe || []).map((r) => ({
        item: typeof r.item === 'object' ? r.item?._id : r.item,
        quantity: r.quantity
      }))
    })
    setModalOpen(true)
  }

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const addRecipeRow = () => {
    setForm((f) => ({ ...f, recipe: [...f.recipe, { item: storeItems[0]?._id || '', quantity: 1 }] }))
  }

  const updateRecipeRow = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      recipe: f.recipe.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    }))
  }

  const removeRecipeRow = (idx) => {
    setForm((f) => ({ ...f, recipe: f.recipe.filter((_, i) => i !== idx) }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        images: form.images ? [form.images] : [],
        basePrice: Number(form.basePrice),
        discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
        isAvailable: form.isAvailable,
        isFeatured: form.isFeatured,
        isPopular: form.isPopular,
        recipe: form.recipe
          .filter((r) => r.item && Number(r.quantity) > 0)
          .map((r) => ({ item: r.item, quantity: Number(r.quantity) }))
      }
      if (editing) {
        await adminService.updateProduct(editing._id, payload)
        toast.success('Product updated')
      } else {
        await adminService.createProduct(payload)
        toast.success('Product created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return
    try {
      await adminService.deleteProduct(product._id)
      toast.success('Product deleted')
      setProducts((prev) => prev.filter((p) => p._id !== product._id))
    } catch (err) {
      toast.error(err.message || 'Could not delete product')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Products</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-pop hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Product
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
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{product.name}</td>
                  <td className="px-4 py-3 text-ink-600">{product.category?.name || '-'}</td>
                  <td className="px-4 py-3 text-brand-600">
                    Rs. {product.discountPrice || product.basePrice}
                    {product.discountPrice && <span className="ml-1 text-xs text-ink-400 line-through">{product.basePrice}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(product)} className="mr-3 text-ink-500 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(product)} className="text-ink-500 hover:text-red-600">
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
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setModalOpen(false)}>
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
              <label className="text-xs font-semibold text-ink-500">Category</label>
              <div className="mt-1">
                <Dropdown
                  value={form.category}
                  onChange={(val) => setForm((f) => ({ ...f, category: val }))}
                  options={categories.map((c) => ({ value: c._id, label: c.name }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500">Image URL</label>
              <input
                value={form.images}
                onChange={update('images')}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Base Price (Rs.)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.basePrice}
                  onChange={update('basePrice')}
                  className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Discount Price (optional)</label>
                <input
                  type="number"
                  min="0"
                  value={form.discountPrice}
                  onChange={update('discountPrice')}
                  className="mt-1 w-full rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink-500">Recipe (Store Items Used Per Order)</label>
                <button
                  type="button"
                  onClick={addRecipeRow}
                  disabled={storeItems.length === 0}
                  className="text-xs font-semibold text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Add Ingredient
                </button>
              </div>
              {storeItems.length === 0 ? (
                <p className="mt-2 text-xs text-ink-400">Add items in Store &amp; Inventory first to link a recipe.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {form.recipe.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Dropdown
                          value={row.item}
                          onChange={(val) => updateRecipeRow(idx, 'item', val)}
                          options={storeItems.map((s) => ({ value: s._id, label: `${s.name} (${s.unit})` }))}
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.quantity}
                        onChange={(e) => updateRecipeRow(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-24 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                      />
                      <button type="button" onClick={() => removeRecipeRow(idx)} className="text-ink-400 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isAvailable} onChange={update('isAvailable')} className="accent-brand-600" />
                Available
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isFeatured} onChange={update('isFeatured')} className="accent-brand-600" />
                Featured
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isPopular} onChange={update('isPopular')} className="accent-brand-600" />
                Popular
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Product'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
