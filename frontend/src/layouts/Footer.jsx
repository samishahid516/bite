import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react'
import { APP_NAME } from '../constants'

export default function Footer() {
  return (
    <footer className="no-print bg-ink-900 text-ink-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl2 bg-gradient-to-br from-brand-500 to-brand-700 font-display text-base font-extrabold text-white">
              A
            </span>
            <span className="font-display text-lg font-extrabold text-white">{APP_NAME}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-300">
            Crispy zinger burgers, loaded shawarma &amp; fries — freshly made and delivered hot to your doorstep.
          </p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-ink-200 transition hover:bg-brand-600 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">Quick Links</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/" className="hover:text-brand-400">Home</Link></li>
            <li><Link to="/menu" className="hover:text-brand-400">Menu</Link></li>
            <li><Link to="/branch-select" className="hover:text-brand-400">Find a Branch</Link></li>
            <li><Link to="/orders" className="hover:text-brand-400">Track Order</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">Company</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/about-us" className="hover:text-brand-400">About Us</Link></li>
            <li><a href="#" className="hover:text-brand-400">Terms &amp; Conditions</a></li>
            <li><Link to="/privacy-policy" className="hover:text-brand-400">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">Get in Touch</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              Main Bazaar, Lahore, Pakistan
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-brand-400" />
              0341-1150099
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-brand-400" />
              info@ahmedcrunchburger.pk
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
          <span>Made with ❤️ in Pakistan</span>
        </div>
      </div>
    </footer>
  )
}
