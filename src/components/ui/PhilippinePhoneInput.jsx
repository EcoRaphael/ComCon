// src/components/ui/PhilippinePhoneInput.jsx
// Phone input for registration that shows a fixed "+63" prefix so people
// only ever type their local 10-digit mobile number — no need to type
// the country code themselves, and no risk of a malformed/inconsistent
// format landing in the database. `value`/`onChange` deal only in the
// raw 10-digit local number (e.g. "9171234567"); the caller is
// responsible for prefixing "+63" when actually saving it.
export default function PhilippinePhoneInput({ value, onChange, disabled, placeholder = '9XX XXX XXXX', className = '' }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    onChange(digits)
  }

  // Display as "917 123 4567" while typing, for readability — the
  // underlying value stays a plain 10-digit string.
  const formatted = value
    ? value.replace(/(\d{3})(\d{0,3})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' ')).trim()
    : ''

  return (
    <div className={`flex items-center h-11 mt-1.5 bg-surface rounded-2xl overflow-hidden ${disabled ? 'opacity-60' : ''} ${className}`}>
      <span className="pl-4 pr-3 h-full flex items-center gap-1.5 text-sm font-bold text-navy border-r border-border/60 flex-shrink-0">
        🇵🇭 +63
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={formatted}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 h-full px-3 bg-transparent outline-none text-sm font-medium text-navy min-w-0"
      />
    </div>
  )
}