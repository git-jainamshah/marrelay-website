'use client'

/**
 * Phone input with a country selector. Formats as you type, keeps the raw
 * digits separate from the formatting, and hands back a stored value of
 * "+1 4165550123" so every form records numbers the same way.
 */
import { useState } from 'react'
import { COUNTRIES, DEFAULT_COUNTRY, countryByCode, digitsOf, formatNational } from '@/lib/form-validate'

export default function PhoneField({
  digits, country, onChange, id, name = 'phone', required, placeholder, className, style, selectStyle, onFocus,
}: {
  digits: string
  country: string
  onChange: (next: { digits: string; country: string }) => void
  id?: string
  name?: string
  required?: boolean
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  selectStyle?: React.CSSProperties
  onFocus?: () => void
}) {
  const [touched, setTouched] = useState(false)
  const c = countryByCode(country || DEFAULT_COUNTRY)

  return (
    <div className="phone-field" style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      <select
        aria-label="Country calling code"
        value={c.code}
        onChange={(e) => onChange({ digits, country: e.target.value })}
        className={className}
        style={{ flex: '0 0 auto', width: 108, ...style, ...selectStyle }}
      >
        {COUNTRIES.map((x) => (
          <option key={x.code} value={x.code}>{x.code} {x.dial}</option>
        ))}
      </select>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required={required}
        placeholder={placeholder || (c.code === 'CA' || c.code === 'US' ? '(416) 555-0123' : 'Phone number')}
        value={formatNational(digits, c.code)}
        onFocus={onFocus}
        onBlur={() => setTouched(true)}
        onChange={(e) => {
          // Keep only what the country can hold, so a pasted number with a
          // country code does not silently overflow the field.
          const next = digitsOf(e.target.value).slice(0, c.max)
          onChange({ digits: next, country: c.code })
        }}
        className={className}
        style={{ flex: '1 1 auto', minWidth: 0, ...style }}
        aria-describedby={touched ? undefined : undefined}
      />
    </div>
  )
}
