import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

const DEFAULT_TRIGGER =
  'flex w-full items-center justify-between gap-2 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-700 transition focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'

export default function Dropdown({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Select...',
  triggerClassName,
  menuClassName = '',
  align = 'left'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find((o) => o.value === value)

  const handleSelect = (opt) => {
    if (opt.disabled) return
    onChange(opt.value)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative inline-block w-full text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName || DEFAULT_TRIGGER}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div
          className={`absolute z-50 mt-2 min-w-full overflow-hidden rounded-xl2 border border-ink-100 bg-white py-1 shadow-card ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => handleSelect(opt)}
              className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-4 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                opt.value === value ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-700 hover:bg-ink-50'
              }`}
            >
              {opt.label}
              {opt.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
