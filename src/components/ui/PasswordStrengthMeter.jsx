// src/components/ui/PasswordStrengthMeter.jsx
// Visual strength meter + requirement checklist. Exports the scoring
// logic separately (getPasswordStrength) so the same rules can gate
// actual form submission, not just drive the visual — a meter that
// shows "weak" but still lets you submit isn't actually enforcing
// anything.
import { Check } from 'lucide-react'

export function getPasswordStrength(password) {
  const checks = {
    length:    password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  // "Strong" requires every category, not just a score threshold — a
  // 20-character all-lowercase password would score decently on length
  // alone but isn't actually strong in the way this is meant to enforce.
  const isStrong = Object.values(checks).every(Boolean)
  return { checks, score, isStrong }
}

const REQUIREMENTS = [
  { key: 'length',    label: '8+ characters' },
  { key: 'uppercase', label: 'Uppercase letter' },
  { key: 'lowercase', label: 'Lowercase letter' },
  { key: 'number',    label: 'Number' },
  { key: 'special',   label: 'Special character' },
]

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null
  const { checks, score } = getPasswordStrength(password)
  const label = score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong'
  const barColor  = score <= 2 ? 'bg-red-500'   : score <= 4 ? 'bg-amber-500'  : 'bg-green-500'
  const textColor = score <= 2 ? 'text-red-600' : score <= 4 ? 'text-amber-600' : 'text-green-600'

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {REQUIREMENTS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? barColor : 'bg-border'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-bold mb-1.5 ${textColor}`}>{label}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {REQUIREMENTS.map(({ key, label: reqLabel }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
              checks[key] ? 'bg-green-500' : 'bg-border'
            }`}>
              {checks[key] && <Check size={11} strokeWidth={3} className="text-white" />}
            </span>
            <span className={`text-[10px] ${checks[key] ? 'text-navy' : 'text-sub'}`}>{reqLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}