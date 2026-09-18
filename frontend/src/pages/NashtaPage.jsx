import { useState, useEffect } from 'react'
import { Plus, Loader2, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, setBranch } from '../features/cartSlice'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import { getNearestBranch } from '../utils/nearestBranch'
import FoodImage from '../components/FoodImage'

export default function NashtaPage() {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const selectedBranch = useSelector((s) => s.cart.selectedBranchId)

  useEffect(() => {
    if (selectedBranch) return
    getNearestBranch().then((branch) => {
      if (branch) dispatch(setBranch({ id: branch._id, name: branch.name }))
    })
  }, [selectedBranch, dispatch])

  useEffect(() => {
    if (!selectedBranch) return
    setLoading(true)
    categoryService
      .listCategories()
      .then((categoriesRes) => {
        const nashtaCategory = (categoriesRes.data?.categories || []).find((c) => c.name === 'Nashta')
        if (!nashtaCategory) {
          setNotFound(true)
          return Promise.resolve(null)
        }
        return productService.listProducts({ category: nashtaCategory._id, limit: 50 })
      })
      .then((productsRes) => {
        if (productsRes) setProducts(productsRes.data?.items || [])
      })
      .catch(() => toast.error('Could not load nashta menu'))
      .finally(() => setLoading(false))
  }, [selectedBranch])

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

  return (
    <main className="min-h-screen bg-ink-50">
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 py-14 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Nashta 🍳</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Classic Pakistani breakfast — nan chanay, kofta chanay, anda chanay, halwa puri &amp; more.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : notFound || products.length === 0 ? (
          <div className="rounded-xl2 bg-white py-20 text-center shadow-card">
            <p className="text-ink-500">Nashta items aren't available right now. Check back soon!</p>
          </div>
        ) : (
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
        )}
      </div>
    </main>
  )
}
