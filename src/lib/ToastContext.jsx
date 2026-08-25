// src/lib/ToastContext.jsx
import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  // A counter, not Date.now() — two toasts fired in the same millisecond
  // (e.g. from a quick batch action) would otherwise get the same id,
  // causing a duplicate React key and the removal timer clearing the
  // wrong toast.
  const counter = useRef(0)

  const toast = useCallback((msg, type = 'info') => {
    const id = ++counter.current
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg text-white animate-bounce-in
            ${t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-green' : 'bg-navy'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)