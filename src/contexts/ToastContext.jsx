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
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map(t => (
          <Toast key={t.key} toast={t} onClose={() => remove(t.key)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onClose }) {
  const styles = {
    success: {
      icon:   <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />,
      dot:    'bg-emerald-500',
    },
    error: {
      icon:   <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
      dot:    'bg-red-500',
    },
    info: {
      icon:   <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />,
      dot:    'bg-blue-500',
    },
  }

  const s = styles[toast.type]

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-white border border-slate-200 shadow-lg px-4 py-3 min-w-[260px] max-w-xs animate-slide-in">
      {s.icon}
      <p className="text-sm font-medium text-slate-700 flex-1 leading-snug">{toast.message}</p>
      <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0 ml-1">
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
