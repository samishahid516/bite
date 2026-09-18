import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Clock,
  Truck,
  ShieldCheck,
  Star,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import * as productService from '../services/productService'
import * as categoryService from '../services/categoryService'
import * as dealService from '../services/dealService'
import * as bannerService from '../services/bannerService'
import FoodImage from '../components/FoodImage'

const HERO_IMAGE = 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg'
const DEALS_PER_PAGE = 3

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const [deals, setDeals] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [dealPage, setDealPage] = useState(0)
  const [bannerIndex, setBannerIndex] = useState(0)
  const selectedBranchId = useSelector((s) => s.cart.selectedBranchId)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      productService.listProducts({ featured: true, limit: 6 }),
      categoryService.listCategories(),
      dealService.listDeals(),
      bannerService.listBanners()
    ])
      .then(([productsRes, categoriesRes, dealsRes, bannersRes]) => {
        setFeatured(productsRes.data?.items || [])
        setCategories(categoriesRes.data?.categories || [])
        setDeals(dealsRes.data?.deals || [])
        setBanners(bannersRes.data?.banners || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleOrderNow = () => navigate(selectedBranchId ? '/menu' : '/branch-select')

  useEffect(() => {
    if (banners.length < 2) return
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [banners.length])

  const dealPageCount = Math.max(1, Math.ceil(deals.length / DEALS_PER_PAGE))
  const visibleDeals = deals.slice(dealPage * DEALS_PER_PAGE, dealPage * DEALS_PER_PAGE + DEALS_PER_PAGE)
  const goPrevDeals = () => setDealPage((p) => (p - 1 + dealPageCount) % dealPageCount)
  const goNextDeals = () => setDealPage((p) => (p + 1) % dealPageCount)

  return (
    <main className="min-h-screen bg-ink-50">
      <section className="relative flex min-h-screen items-center overflow-hidden bg-brand-700 text-white">
        <div className="absolute inset-0">
          {(() => {
            const slides = banners.length > 0 ? banners : [{ _id: 'default', image: HERO_IMAGE, title: 'Zinger Burger' }]
            const activeIndex = bannerIndex % slides.length
            return (
              <div
                className="flex h-full w-full transition-transform duration-1000 ease-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {slides.map((banner) => (
                  <img
                    key={banner._id}
                    src={banner.image}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full shrink-0 object-cover"
                  />
                ))}
              </div>
            )
          })()}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/25 to-brand-900/40" />
        </div>
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
            🔥 Freshly made, every order
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Crispy. Crunchy. <br /> Loaded With Flavor.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-white/85 sm:text-lg">
            Zinger burgers, loaded shawarma &amp; crispy fries — delivered hot to your door in 30 minutes or less.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleOrderNow}
              className="flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-brand-700 shadow-pop transition hover:bg-ink-50"
            >
              Order Now <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/branch-select"
              className="flex items-center gap-2 rounded-full border-2 border-white/70 px-8 py-3.5 font-bold text-white transition hover:bg-white/10"
            >
              <MapPin className="h-4 w-4" /> Find a Branch
            </Link>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="overflow-hidden py-12">
          <div className="no-scrollbar flex w-max gap-10 animate-marquee">
            {[...categories, ...categories].map((cat, idx) => (
              <Link
                key={`${cat._id}-${idx}`}
                to="/menu"
                className="flex w-20 shrink-0 flex-col items-center gap-2.5 text-center"
              >
                <FoodImage
                  src={cat.image}
                  alt={cat.name}
                  className="h-16 w-16 rounded-full object-cover shadow-card transition hover:shadow-pop"
                  iconClassName="h-6 w-6"
                />
                <span className="text-xs font-semibold text-ink-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {deals.length > 0 && (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">Hot Deals 🔥</h2>
              {dealPageCount > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrevDeals}
                    aria-label="Previous deals"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-600 transition hover:border-brand-500 hover:text-brand-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={goNextDeals}
                    aria-label="Next deals"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-600 transition hover:border-brand-500 hover:text-brand-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleDeals.map((deal) => {
                const pctOff = deal.originalPrice
                  ? Math.round(((deal.originalPrice - deal.discountPrice) / deal.originalPrice) * 100)
                  : null
                return (
                  <div
                    key={deal._id}
                    className="relative overflow-hidden rounded-xl2 border border-ink-100 shadow-card transition hover:-translate-y-1 hover:shadow-pop"
                  >
                    {pctOff && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
                        {pctOff}% OFF
                      </span>
                    )}
                    <FoodImage src={deal.image} alt={deal.name} className="h-40 w-full object-cover" />
                    <div className="p-4">
                      <h3 className="font-display font-bold text-ink-900">{deal.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-ink-500">{deal.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-lg font-extrabold text-brand-600">Rs. {deal.discountPrice}</span>
                        {deal.originalPrice && (
                          <span className="text-sm text-ink-400 line-through">Rs. {deal.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {dealPageCount > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: dealPageCount }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDealPage(idx)}
                    aria-label={`Go to deals page ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      idx === dealPage ? 'w-6 bg-brand-600' : 'w-2 bg-ink-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">Featured Items</h2>
              <Link to="/menu" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                View Menu <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <div
                  key={product._id}
                  className="overflow-hidden rounded-xl2 border border-ink-100 shadow-card transition hover:-translate-y-1 hover:shadow-pop"
                >
                  <FoodImage src={product.images?.[0]} alt={product.name} className="h-44 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-display font-bold text-ink-900">{product.name}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-extrabold text-brand-600">
                        Rs. {product.discountPrice || product.basePrice}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-ink-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {product.rating || '4.5'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl2 bg-white p-6 shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
              <Clock className="h-6 w-6 text-brand-600" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink-900">Fast Delivery</h3>
            <p className="mt-2 text-sm text-ink-500">30-45 minutes guaranteed delivery to your doorstep</p>
          </div>
          <div className="rounded-xl2 bg-white p-6 shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
              <Truck className="h-6 w-6 text-brand-600" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink-900">Multiple Branches</h3>
            <p className="mt-2 text-sm text-ink-500">Order from any of our branches across major cities</p>
          </div>
          <div className="rounded-xl2 bg-white p-6 shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
              <ShieldCheck className="h-6 w-6 text-brand-600" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink-900">Quality Assured</h3>
            <p className="mt-2 text-sm text-ink-500">Fresh ingredients and hygienic food preparation</p>
          </div>
        </div>
      </section>

      {loading && (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-ink-400">Loading...</div>
      )}
    </main>
  )
}
