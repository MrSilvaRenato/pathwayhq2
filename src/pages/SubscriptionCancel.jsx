import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

export default function SubscriptionCancel() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 border border-white/10">
            <X className="h-10 w-10 text-slate-400" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Upgrade cancelled</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          No charge was made. You can upgrade any time from your settings.
        </p>
        <div className="flex flex-col gap-2">
          <Link to="/pricing" className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-sm font-bold text-white transition-all">
            See plans
          </Link>
          <Link to="/settings" className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-400 hover:text-white transition-all">
            Back to settings
          </Link>
        </div>
      </div>
    </div>
  )
}
