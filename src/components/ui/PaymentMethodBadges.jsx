// src/components/ui/PaymentMethodBadges.jsx
// Shows a driver's accepted payment methods as small labeled badges.
// Used wherever a commuter sees driver info — the Routes.jsx driver
// selection list, the driver profile popup, the active booking card on
// Home.jsx, and ride history in MyRides.jsx — so this one component
// keeps that presentation consistent everywhere instead of duplicating
// the icon/label mapping in each file.
const ICONS  = { cash: '💵', gcash: '📱', maya: '💳' }
const LABELS = { cash: 'Cash', gcash: 'GCash', maya: 'Maya' }

export default function PaymentMethodBadges({ methods, size = 'sm', className = '' }) {
  if (!methods || methods.length === 0) return null
  const sizeCls = size === 'sm'
    ? 'text-[10px] px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5'
  return (
    <div className={`flex gap-1.5 flex-wrap ${className}`}>
      {methods.map(m => (
        <span
          key={m}
          className={`flex items-center bg-green-light text-green font-bold rounded-full ${sizeCls}`}
        >
          {ICONS[m] || ''} {LABELS[m] || m}
        </span>
      ))}
    </div>
  )
}