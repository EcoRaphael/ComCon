// src/components/ui/BottomSheet.jsx
// The pop-up that slides up from the bottom of the screen: used for cancelling a
// booking, rating a ride and reporting a problem, so all three look and behave
// the same.
//
// WHY IT IS RENDERED INTO document.body (a "portal"): every page is wrapped in
// .page-enter, whose animation leaves a transform on the page. A transformed
// parent traps anything inside it, so a pop-up written inside the page was drawn
// UNDER the bottom navigation bar (while the notification bell, which is outside
// the page, drew on top of it). That hid the lower choices, the description box
// and the Submit button. Rendered into the body, the pop-up sits above the page,
// the bottom bar, the floating button and the bell.
//
// It also never grows taller than the screen: if the content is long (the report
// form is), the sheet scrolls inside itself so every part can be reached.
import { createPortal } from 'react-dom'

export default function BottomSheet({ children }) {
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center">
      <div
        className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
        // dvh follows the visible screen on phones, where the browser's address
        // bar changes the height. Browsers that do not know dvh keep the 90vh above.
        style={{ maxHeight: '90dvh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}