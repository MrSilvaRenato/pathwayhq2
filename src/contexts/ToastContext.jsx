import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

let id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((message, type = 'success', duration = 4000) => {
    const key = ++id
    setToasts(t => [...t, { key, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.key !== key)), duration)
  }, [])

  const remove = useCallback(key => setToasts(t => t.filter(x => x.key !== key)), [])

  const toast = {
    success: (msg, dur) => add(msg, 'success', dur),
    error:   (msg, dur) => add(msg, 'error', dur),
    info:    (msg, dur) => add(msg, 'info', dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map(t => (
          <Toast key={t.key} toast={t} onClose={() => remove(t.key)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onClose }) {
  const icons = {
    success: <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />,
    error:   <XCircle    className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />,
    info:    <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />,
  }
  const borders = {
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error:   'border-red-500/30 bg-red-500/10',
    info:    'border-blue-500/30 bg-blue-500/10',
  }
  const texts = {
    success: 'text-emerald-200',
    error:   'text-red-200',
    info:    'text-blue-200',
  }

  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${borders[toast.type]} backdrop-blur-md px-4 py-3 shadow-2xl min-w-[280px] max-w-sm animate-slide-in`}>
      {icons[toast.type]}
      <p className={`text-sm font-medium flex-1 ${texts[toast.type]}`}>{toast.message}</p>
      <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors shrink-0">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
