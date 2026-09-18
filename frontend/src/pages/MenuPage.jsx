import { useState, useEffect } from 'react'
import { Plus, Loader2, Star, Search, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, setBranch } from '../features/cartSlice'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import * as dealService from '../services/dealService'
import { getNearestBranch } from '../utils/nearestBranch'
import FoodImage from '../components/FoodImage'
import Dropdown from '../components/Dropdown'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' }
]

export default function MenuPage() {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [deals, setDeals] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('popular')
  const selectedBranch = useSelector((s) => s.cart.selectedBranchId)
  const branchName = useSelector((s) => s.cart.selectedBranchName)

  useEffect(() => {
    if (selectedBranch) return
    getNearestBranch().then((branch) => {
      if (branch) dispatch(setBranch({ id: branch._id, name: branch.name }))
    })
  }, [selectedBranch, dispatch])

  useEffect(() => {
    if (!selectedBranch) return
    setLoading(true)
    Promise.all([
      productService.listProducts({ category: selectedCategory, sort, search: search || undefined, limit: 50 }),
      categoryService.listCategories(),
      dealService.listDeals(selectedBranch)
    ])
      .then(([productsRes, categoriesRes, dealsRes]) => {
        setProducts(productsRes.data?.items || [])
        const cats = categoriesRes.data?.categories || []
        setCategories(cats)
        setDeals(dealsRes.data?.deals || [])
      })
      .catch(() => toast.error('Could not load menu'))
      .finally(() => setLoading(false))
  }, [selectedCategory, sort, search, selectedBranch])

  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        itemType: 'PRODUCT',
        productId: product._id,
        name: product.name,
        image: product.images?.[0],
        basePrice: product.discountPrice || product.basePrice,
        customization: {}
      })
    )
    toast.success(`${product.name} added to cart`)
  }

  const handleAddDealToCart = (deal) => {
    dispatch(
      addToCart({
        itemType: 'DEAL',
        dealId: deal._id,
        productId: null,
        name: deal.name,
        image: deal.image,
        basePrice: deal.discountPrice,
        customization: {}
      })
    )
    toast.success(`${deal.name} added to cart`)
  }

  if (!selectedBranch) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-ink-50">
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold text-ink-900">Our Menu</h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                <MapPin className="h-3.5 w-3.5" /> Ordering from {branchName || 'selected branch'}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for food..."
                  className="w-48 rounded-full border border-ink-100 bg-ink-50 py-2.5 pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none sm:w-64"
                />
              </div>
              <div className="w-48">
                <Dropdown
                  value={sort}
                  onChange={setSort}
                  options={SORT_OPTIONS}
                  align="right"
                  triggerClassName="flex w-full items-center justify-between gap-2 rounded-full border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm font-medium text-ink-700 focus:border-brand-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                  selectedCategory === null ? 'bg-brand-600 text-white shadow-pop' : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                    selectedCategory === cat._id ? 'bg-brand-600 text-white shadow-pop' : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {!loading && deals.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-xl font-extrabold text-ink-900">Deals &amp; Combos 🔥</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => {
                const pctOff = deal.originalPrice
                  ? Math.round(((deal.originalPrice - deal.discountPrice) / deal.originalPrice) * 100)
                  : null
                return (
                  <div
                    key={deal._id}
                    className="group relative overflow-hidden rounded-xl2 border border-ink-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-pop"
                  >
                    <div className="relative">
                      <FoodImage src={deal.image} alt={deal.name} className="h-44 w-full object-cover" />
                      {pctOff && (
                        <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
                          {pctOff}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-bold text-ink-900 line-clamp-1">{deal.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-ink-500">{deal.description}</p>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-brand-600">Rs. {deal.discountPrice}</span>
                        {deal.originalPrice && (
                          <span className="text-xs text-ink-400 line-through">Rs. {deal.originalPrice}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddDealToCart(deal)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Deal to Cart
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : products.length > 0 ? (
          <div>
            {deals.length > 0 && <h2 className="mb-4 font-display text-xl font-extrabold text-ink-900">Menu</h2>}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
              <div
                key={product._id}
                className="group overflow-hidden rounded-xl2 border border-ink-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-pop"
              >
                <div className="relative">
                  <FoodImage src={product.images?.[0]} alt={product.name} className="h-44 w-full object-cover" />
                  {product.discountPrice && (
                    <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
                      SALE
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-ink-900 line-clamp-1">{product.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-500">{product.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-brand-600">
                        Rs. {product.discountPrice || product.basePrice}
                      </span>
                      {product.discountPrice && (
                        <span className="text-xs text-ink-400 line-through">Rs. {product.basePrice}</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-ink-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {product.rating || '4.5'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl2 bg-white py-20 text-center shadow-card">
            <p className="text-ink-500">No products found. Try a different category or search.</p>
          </div>
        )}
      </div>
    </main>
  )
}
