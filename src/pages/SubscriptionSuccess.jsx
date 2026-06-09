import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function SubscriptionSuccess() {
  const navigate     = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    refreshUser().catch(() => {})
    const t = setTimeout(() => navigate('/settings'), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-white mb-3">You're all set!</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Your subscription is now active. All features have been unlocked for your club.
        </p>
        <p className="text-slate-600 text-xs">Redirecting to settings…</p>
      </div>
    </div>
  )
}
