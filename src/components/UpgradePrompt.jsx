import { useState } from 'react'
import { Zap, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function UpgradePrompt({ message, requiredPlan = 'pro', onClose }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const { data } = await api.post('/subscription/checkout', { plan: requiredPlan })
      window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <Zap className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-black text-white mb-2">Upgrade to {requiredPlan === 'elite' ? 'Elite' : 'Pro'}</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/25"
          >
            {loading ? 'Redirecting…' : `Upgrade to ${requiredPlan === 'elite' ? 'Elite' : 'Pro'} →`}
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            See all plans
          </button>
        </div>
      </div>
    </div>
  )
}
