import { Link } from 'react-router-dom'
import { ChefHat, Flame, Heart, ShieldCheck, ArrowRight } from 'lucide-react'
import { APP_NAME } from '../constants'

const MAKES = [
  {
    name: 'Burgers',
    image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
    description: 'Zinger, beef & shami patties grilled fresh to order'
  },
  {
    name: 'Shawarma Rolls',
    image: 'https://images.pexels.com/photos/28897047/pexels-photo-28897047.jpeg?w=800',
    description: 'Chicken & beef shawarma wrapped tight with garlic sauce'
  },
  {
    name: 'Parathas',
    image: 'https://images.pexels.com/photos/35079296/pexels-photo-35079296.jpeg?w=800',
    description: 'Flaky, hand-rolled parathas cooked on the tawa'
  },
  {
    name: 'Fries & Sides',
    image: 'https://images.pexels.com/photos/11485199/pexels-photo-11485199.jpeg?w=800',
    description: 'Crispy masala fries and loaded sides'
  }
]

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-ink-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 py-20 text-center text-white">
        <img
          src="https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-3xl px-4">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">About {APP_NAME}</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            From a single street cart to a name people crave — this is our story.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="font-display text-2xl font-extrabold text-ink-900">Our Story</h2>
        <p className="mt-4 leading-relaxed text-ink-600">
          {APP_NAME} started as a small food cart on the streets of Lahore, serving crispy zinger burgers and
          loaded shawarma to hungry passersby. What began with a single grill and a handful of recipes has grown
          into a name locals trust for a quick, satisfying meal — without ever losing the street-food soul that
          made us who we are.
        </p>
        <p className="mt-4 leading-relaxed text-ink-600">
          Every burger, shawarma, and basket of fries is still made fresh to order, right in front of you —
          no shortcuts, no pre-made stock sitting under a heat lamp.
        </p>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="font-display text-2xl font-extrabold text-ink-900">Who Makes Your Food</h2>
          <p className="mt-4 leading-relaxed text-ink-600">
            Our small kitchen team is led by our founding cooks, who trained on the grill itself — perfecting the
            crunch on every zinger fillet and the char on every patty through years of hands-on practice. Every
            item on the menu is prepared fresh by the same hands that opened the cart each day, using recipes
            that haven't changed since day one because customers keep asking for them exactly the same way.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl2 border border-ink-100 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50">
                <ChefHat className="h-5 w-5 text-brand-600" />
              </span>
              <h3 className="mt-4 font-display font-bold text-ink-900">Hands-On Cooking</h3>
              <p className="mt-2 text-sm text-ink-500">
                Every order is grilled, fried, and assembled fresh by our in-house cooks — nothing is pre-made.
              </p>
            </div>
            <div className="rounded-xl2 border border-ink-100 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50">
                <Flame className="h-5 w-5 text-brand-600" />
              </span>
              <h3 className="mt-4 font-display font-bold text-ink-900">Same Recipe, Every Time</h3>
              <p className="mt-2 text-sm text-ink-500">
                The sauces, spice blends, and marinades are made in-house, following the same recipe since we started.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="font-display text-2xl font-extrabold text-ink-900">What We Make</h2>
        <p className="mt-2 text-ink-500">A few of the things our kitchen makes fresh, every single day.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MAKES.map((item) => (
            <div key={item.name} className="overflow-hidden rounded-xl2 border border-ink-100 bg-white shadow-card">
              <img src={item.image} alt={item.name} className="h-36 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-display font-bold text-ink-900">{item.name}</h3>
                <p className="mt-1 text-xs text-ink-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="font-display text-2xl font-extrabold text-ink-900">What We Stand For</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl2 bg-white p-6 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink-900">Quality First</h3>
            <p className="mt-2 text-sm text-ink-500">Fresh ingredients sourced daily, cooked to order.</p>
          </div>
          <div className="rounded-xl2 bg-white p-6 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <Heart className="h-5 w-5 text-brand-600" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink-900">Made With Care</h3>
            <p className="mt-2 text-sm text-ink-500">Every order is treated like it's for a regular customer.</p>
          </div>
          <div className="rounded-xl2 bg-white p-6 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <Flame className="h-5 w-5 text-brand-600" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink-900">Always Fresh</h3>
            <p className="mt-2 text-sm text-ink-500">Nothing sits around — food is made when you order it.</p>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/menu"
            className="flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3.5 font-bold text-white shadow-pop transition hover:bg-brand-700"
          >
            Order Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
