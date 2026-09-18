import { useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'

const GRADIENTS = [
  'from-brand-400 to-brand-700',
  'from-orange-400 to-rose-600',
  'from-amber-400 to-brand-600',
  'from-rose-400 to-brand-700',
  'from-yellow-400 to-orange-600'
]

function pickGradient(seed = '') {
  const idx = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % GRADIENTS.length
  return GRADIENTS[idx]
}

export default function FoodImage({ src, alt = '', className = '', iconClassName = 'h-10 w-10' }) {
  const [failed, setFailed] = useState(!src)

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${pickGradient(alt)} ${className}`}>
        <UtensilsCrossed className={`${iconClassName} text-white/80`} strokeWidth={1.5} />
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}
