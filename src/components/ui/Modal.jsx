// src/components/ui/Modal.jsx
// A modal dialog, centered on the screen: used for cancelling a booking, rating a
// ride and reporting a problem, so all three look and behave the same on a phone,
// a tablet or a computer.
//
// WHY IT IS RENDERED INTO document.body (a "portal"): every page is wrapped in
// .page-enter, whose animation leaves a transform on the page. A transformed
// parent traps anything inside it, so a dialog written inside the page was drawn
// UNDER the bottom navigation bar. Rendered into the body, the modal sits above the
// page, the bottom bar, the floating button and the notification bell.
//
// BEHAVIOUR
//   - Centered, never wider than a phone-sized column, never taller than the
//     screen. If the content is long (the report form is), the modal scrolls
//     inside itself, so every part can be reached.
//   - It keeps clear of the notch and the home bar on phones (the safe areas).
//   - The page behind does not scroll while it is open, and is put back exactly
//     as it was afterwards.
//   - Escape closes it (handy on a computer). Tapping the dark background does
//     NOT, so a long report is never lost to a stray tap. Use the X or a button.
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ children, onClose }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  useEffect(() => {
    if (!onClose) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      // p-4 above is the fallback; this keeps at least 1rem AND clears the notch / home bar
      style={{ padding: 'max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))' }}
    >
      {/* max-h-full = never taller than the space inside the overlay, whatever the device */}
      <div className="bg-white w-full max-w-md max-h-full overflow-y-auto overscroll-contain rounded-3xl p-6 shadow-xl">
        {children}
      </div>
    </div>,
    document.body
  )
}