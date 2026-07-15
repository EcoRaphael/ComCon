// src/components/ui/Spinner.jsx
export default function Spinner({ size = 32, fullScreen = false, label = '' }) {
  const r = (size / 2) - 4
  const circ = 2 * Math.PI * r
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ animation: 'cc-spin 1s linear infinite' }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#2E7D32" strokeWidth="3.5"
          strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
          strokeLinecap="round" />
      </svg>
      {label && <p className="text-sm text-sub font-medium">{label}</p>}
    </div>
  )
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {spinner}
      </div>
    )
  }
  return spinner
}
