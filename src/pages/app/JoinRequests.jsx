import { useState, useEffect } from 'react'
import { UserPlus, CheckCircle, XCircle, Loader2, Clock, Users } from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'

const STATUS_BADGE = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-slate-100 text-slate-500',
}

export default function JoinRequests() {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(null)

  useEffect(() => {
    api.get('/club/join-requests')
      .then(r => setRequests(r.data))
      .catch(() => toast.error('Failed to load join requests'))
      .finally(() => setLoading(false))
  }, [])

  async function approve(id) {
    setActing(id + 'a')
    try {
      await api.put(`/club/join-requests/${id}/approve`)
      setRequests(p => p.map(r => r.id === id ? { ...r, status: 'approved' } : r))
      toast.success('Athlete added to your roster')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to approve')
    } finally { setActing(null) }
  }

  async function reject(id) {
    setActing(id + 'r')
    try {
      await api.put(`/club/join-requests/${id}/reject`)
      setRequests(p => p.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
      toast.success('Request rejected')
    } catch { toast.error('Failed to reject') } finally { setActing(null) }
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
          <UserPlus className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Join Requests</h1>
          <p className="text-sm text-slate-500">Athletes requesting to join your club</p>
        </div>
        {pending.length > 0 && (
          <span className="ml-auto rounded-full bg-amber-400 text-white text-xs font-black px-2.5 py-1">
            {pending.length} pending
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-500">No join requests yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Share your club page so athletes can request to join.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Pending requests</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {pending.map(r => (
                  <div key={r.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-black text-sm">
                      {(r.user?.full_name ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800">{r.user?.full_name ?? '—'}</p>
                      <p className="text-sm text-slate-500">{r.user?.email}</p>
                      {r.user?.phone && <p className="text-xs text-slate-400">{r.user.phone}</p>}
                      {r.message && (
                        <p className="text-sm text-slate-500 italic mt-1.5 bg-slate-50 rounded-lg px-3 py-2">
                          "{r.message}"
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => approve(r.id)} disabled={!!acting}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3 py-2 text-sm font-bold text-white transition-colors">
                        {acting === r.id + 'a' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Approve
                      </button>
                      <button onClick={() => reject(r.id)} disabled={!!acting}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-3 py-2 text-sm font-bold text-slate-600 transition-colors">
                        {acting === r.id + 'r' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-500 text-sm">Resolved</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {resolved.map(r => (
                  <div key={r.id} className="px-6 py-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-black text-xs">
                      {(r.user?.full_name ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{r.user?.full_name}</p>
                      <p className="text-xs text-slate-400">{r.user?.email}</p>
                    </div>
                    <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
