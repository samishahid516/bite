import { APP_NAME } from '../constants'

const SECTIONS = [
  {
    title: 'Information We Collect',
    body:
      'When you create an account or place an order, we collect your name, email address, phone number, delivery address, and order history. We do not collect or store your payment card details — orders are paid by cash on delivery.'
  },
  {
    title: 'How We Use Your Information',
    body:
      'We use your information to process and deliver your orders, send order status updates, respond to support requests, and improve our menu and service. We do not sell your personal information to third parties.'
  },
  {
    title: 'Order & Delivery Data',
    body:
      'Your delivery address and phone number are shared only with our own delivery staff for the purpose of fulfilling your order, and are never used for unrelated marketing without your consent.'
  },
  {
    title: 'Cookies & Local Storage',
    body:
      'Our website uses local storage to keep you logged in and to remember items in your cart between visits. This data stays on your device and is not shared with third parties.'
  },
  {
    title: 'Data Security',
    body:
      'We take reasonable technical measures — including encrypted password storage and secure authentication — to protect your account information from unauthorized access.'
  },
  {
    title: 'Your Rights',
    body:
      'You can update your profile information at any time from your account page, or contact us to request deletion of your account and associated data.'
  },
  {
    title: 'Contact Us',
    body: `If you have questions about this privacy policy, reach out to us at info@ahmedcrunchburger.pk or call 0341-1150099.`
  }
]

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-ink-50">
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-white/80">Last updated: September 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <p className="leading-relaxed text-ink-600">
          {APP_NAME} ("we", "our", "us") respects your privacy. This policy explains what information we collect
          when you use our website to browse the menu and place orders, and how that information is used.
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-lg font-bold text-ink-900">{section.title}</h2>
              <p className="mt-2 leading-relaxed text-ink-600">{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
