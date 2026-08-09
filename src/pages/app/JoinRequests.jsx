import { useState, useEffect } from 'react'
import { UserPlus, CheckCircle, XCircle, Loader2, Clock, Users, Mail, Phone, CalendarDays, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'

function initials(name = '') {
  return (name || '?').split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

const STATUS_META = {
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600 border-red-200' },
}

export default function JoinRequests() {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(null) // e.g. "42a" or "42r"

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

  async function deleteRequest(id) {
    setActing(id + 'd')
    try {
      await api.delete(`/club/join-requests/${id}`)
      setRequests(p => p.filter(r => r.id !== id))
      toast.success('Request deleted — athlete can now re-apply')
    } catch { toast.error('Failed to delete') } finally { setActing(null) }
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
          <UserPlus className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Join Requests</h1>
          <p className="text-sm text-slate-500">Athletes requesting to join your club</p>
        </div>
        {pending.length > 0 && (
          <span className="ml-auto rounded-full bg-amber-400 text-white text-xs font-black px-3 py-1.5 shadow-sm">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && requests.length === 0 && (
        <div className="text-center py-24 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <Users className="h-12 w-12 mx-auto mb-4 text-slate-200" />
          <p className="font-bold text-slate-500 text-lg">No join requests yet</p>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
            Share your club page so athletes can discover you and request to join.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-8">

          {/* Pending section */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Pending review · {pending.length}
              </h2>
              <div className="space-y-4">
                {pending.map(r => (
                  <div key={r.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">

                        {/* Avatar */}
                        <div className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-black text-lg select-none">
                          {r.user?.avatar_url
                            ? <img src={r.user.avatar_url} alt={r.user?.full_name} className="h-full w-full object-cover" />
                            : initials(r.user?.full_name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">

                          {/* Name + date */}
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <p className="text-lg font-black text-slate-900 leading-tight">
                              {r.user?.full_name ?? '—'}
                            </p>
                            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium shrink-0">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          {/* Email + phone */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {r.user?.email && (
                              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {r.user.email}
                              </span>
                            )}
                            {r.user?.phone && (
                              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {r.user.phone}
                              </span>
                            )}
                          </div>

                          {/* Message */}
                          {r.message && (
                            <blockquote className="mt-3 rounded-xl bg-slate-50 border-l-4 border-blue-200 pl-3 pr-3 py-2.5 text-sm text-slate-600 italic leading-relaxed">
                              {r.message}
                            </blockquote>
                          )}

                          {/* Action buttons */}
                          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                            <button
                              onClick={() => approve(r.id)}
                              disabled={!!acting}
                              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors shadow-sm shadow-emerald-500/20"
                            >
                              {acting === r.id + 'a'
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <CheckCircle className="h-4 w-4" />}
                              Approve
                            </button>
                            <button
                              onClick={() => reject(r.id)}
                              disabled={!!acting}
                              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors"
                            >
                              {acting === r.id + 'r'
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <XCircle className="h-4 w-4" />}
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved section */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Resolved · {resolved.length}
              </h2>
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-50">
                {resolved.map(r => {
                  const meta = STATUS_META[r.status] ?? STATUS_META.rejected
                  return (
                    <div key={r.id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-black text-xs select-none overflow-hidden">
                        {r.user?.avatar_url
                          ? <img src={r.user.avatar_url} alt={r.user.full_name} className="h-full w-full object-cover" />
                          : initials(r.user?.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{r.user?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400 truncate">{r.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">
                          {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className={`text-xs font-bold rounded-full border px-2.5 py-0.5 ${meta.color}`}>
                          {meta.label}
                        </span>
                        <button
                          onClick={() => deleteRequest(r.id)}
                          disabled={!!acting}
                          title="Delete request (allows athlete to re-apply)"
                          className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {acting === r.id + 'd'
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
