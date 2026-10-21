// src/components/ui/InstallPrompt.jsx
// Asks people to install CommuterConnect to their home screen.
//
// Browsers do NOT all work the same way, so this shows a different card:
//   - Chrome / Edge / Samsung Internet (Android, desktop): the browser hands
//     the app a "beforeinstallprompt" event. We keep it and show our own
//     Install button, which opens the browser's real install dialog.
//   - iPhone / iPad: Safari never fires that event and offers no way for a
//     web page to open the install dialog. The only route is the person
//     tapping Share -> Add to Home Screen themselves, so we show those steps.
//   - Facebook / Messenger / Instagram etc. in-app browsers: they cannot
//     install web apps at all, so we ask the person to open the link in
//     Safari or Chrome first.
// Nothing shows once the app is already installed (opened from the home
// screen), and "Not now" hides the card for a week.
import { useEffect, useState } from 'react'
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react'

const DISMISS_KEY = 'cc-install-dismissed-at'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

const ua = () => (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '')

// iPhone, iPod and iPad. Recent iPads report themselves as a Mac, so a
// "Mac" that has a touch screen is an iPad.
export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(ua()) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// True when the app was opened from the home screen rather than a browser tab.
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
    window.navigator.standalone === true     // older iOS Safari
}

export function isInAppBrowser() {
  return /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Snapchat|TikTok|Twitter/i.test(ua())
}

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(ua()) || isIOS()

function isSnoozed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY))
    return Boolean(t) && Date.now() - t < SNOOZE_MS
  } catch { return false }
}
function snooze() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* private mode */ }
}

const Step = ({ n, children }) => (
  <li className="flex items-center gap-2">
    <span className="w-5 h-5 rounded-full bg-green-light text-green font-black text-[10px] flex items-center justify-center flex-shrink-0">{n}</span>
    <span>{children}</span>
  </li>
)

export default function InstallPrompt({ delayMs = 2500 }) {
  const [mode, setMode] = useState(null)          // 'install' | 'ios' | 'inapp'
  const [visible, setVisible] = useState(false)
  const [deferred, setDeferred] = useState(null)  // the browser's install event

  useEffect(() => {
    if (isStandalone() || isSnoozed()) return
    let timer
    // A short pause so the card doesn't pop over the screen the moment it loads.
    const reveal = () => { clearTimeout(timer); timer = setTimeout(() => setVisible(true), delayMs) }

    const onPrompt = (e) => {
      e.preventDefault()        // keep the browser's own mini-bar away; ours replaces it
      setDeferred(e); setMode('install'); reveal()
    }
    const onInstalled = () => { setVisible(false); setDeferred(null); setMode(null) }

    if (isMobile() && isInAppBrowser()) { setMode('inapp'); reveal() }
    else if (isIOS()) { setMode('ios'); reveal() }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [delayMs])

  const dismiss = () => { snooze(); setVisible(false) }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    const choice = await Promise.resolve(deferred.userChoice).catch(() => null)
    setDeferred(null)
    setVisible(false)
    if (!choice || choice.outcome !== 'accepted') snooze()   // they said no: don't nag
  }

  if (!visible || !mode) return null

  const title = mode === 'inapp' ? 'Open in your browser to install' : 'Install CommuterConnect'

  return (
    <div
      role="dialog"
      aria-label={title}
      className="fixed inset-x-0 top-0 z-[60] px-3 pointer-events-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <div className="pointer-events-auto max-w-md mx-auto bg-white rounded-2xl border border-border shadow-[0_10px_30px_rgba(0,0,0,0.18)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green flex items-center justify-center flex-shrink-0">
            {mode === 'inapp' ? <Smartphone size={20} className="text-white" /> : <Download size={20} className="text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-navy text-sm leading-snug">{title}</p>

            {mode === 'install' && (
              <p className="text-xs text-sub mt-0.5 leading-relaxed">
                Add it to your home screen to open it like an app, with a faster start and no browser bar.
              </p>
            )}

            {mode === 'ios' && (
              <ol className="mt-2 space-y-1.5 text-xs text-navy">
                <Step n="1">Tap the Share button <Share size={13} className="inline text-blue-600 -mt-0.5" /> in the toolbar or the ••• menu</Step>
                <Step n="2">Choose <b>Add to Home Screen</b> <PlusSquare size={13} className="inline text-navy -mt-0.5" /></Step>
                <Step n="3">Tap <b>Add</b></Step>
              </ol>
            )}

            {mode === 'inapp' && (
              <p className="text-xs text-sub mt-0.5 leading-relaxed">
                This page is open inside another app, which can't install CommuterConnect. Open it in
                Safari (iPhone) or Chrome (Android), then install it from there.
              </p>
            )}
          </div>
          <button type="button" onClick={dismiss} aria-label="Close" className="text-sub p-1 -mr-1 -mt-1">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          {mode === 'install' ? (
            <>
              <button type="button" onClick={install}
                className="flex-1 py-2.5 rounded-xl bg-green text-white text-sm font-bold flex items-center justify-center gap-1.5">
                <Download size={15} /> Install
              </button>
              <button type="button" onClick={dismiss}
                className="px-4 py-2.5 rounded-xl border border-border text-sub text-sm font-bold">
                Not now
              </button>
            </>
          ) : (
            <button type="button" onClick={dismiss}
              className="w-full py-2.5 rounded-xl bg-green text-white text-sm font-bold">
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  )
}