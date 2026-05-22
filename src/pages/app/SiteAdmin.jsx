import { useState, useEffect } from 'react'
import { Shield, Users, Building2, RefreshCw, CheckCircle, XCircle, Loader2, Copy, Check } from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs font-mono text-slate-700 transition-colors">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {text}
    </button>
  )
}

function ClaimsPanel() {
  const toast = useToast()
  const [claims,  setClaims]  = useState([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState(null)
  const [credentials, setCredentials] = useState(null)

  useEffect(() => {
    api.get('/club-claims')
      .then(r => setClaims(r.data))
      .catch(() => toast.error('Failed to load claims'))
      .finally(() => setLoading(false))
  }, [])

  async function approve(id) {
    setActing(id + 'approve')
    try {
      const { data } = await api.put(`/club-claims/${id}/approve`)
      setClaims(p => p.map(c => c.id === id ? { ...c, status: 'approved' } : c))
      if (data.temp_password) {
        setCredentials({ email: data.email, password: data.temp_password })
      } else {
        toast.success('Claim approved — existing user updated')
      }
    } catch {
      toast.error('Failed to approve claim')
    } finally {
      setActing(null)
    }
  }

  async function reject(id) {
    setActing(id + 'reject')
    try {
      await api.put(`/club-claims/${id}/reject`)
      setClaims(p => p.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
      toast.success('Claim rejected')
    } catch {
      toast.error('Failed to reject claim')
    } finally {
      setActing(null)
    }
  }

  const pending  = claims.filter(c => c.status === 'pending')
  const resolved = claims.filter(c => c.status !== 'pending')

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {credentials && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5">
          <h3 className="font-black text-emerald-900 mb-1">✅ Account created — share these credentials</h3>
          <p className="text-sm text-emerald-700 mb-3">Send these to the club manager. The password cannot be retrieved again.</p>
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <p className="text-xs font-semibold text-emerald-800 mb-1">Email</p>
              <CopyButton text={credentials.email} />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 mb-1">Temp password</p>
              <CopyButton text={credentials.password} />
            </div>
          </div>
          <button onClick={() => setCredentials(null)} className="mt-3 text-xs text-emerald-600 hover:text-emerald-800 underline">
            Dismiss
          </button>
        </div>
      )}

      {pending.length === 0 && resolved.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Shield className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold">No club claims yet</p>
          <p className="text-sm mt-1">Claims will appear here when clubs submit requests.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Pending claims</h2>
            <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5">{pending.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {pending.map(c => (
              <div key={c.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <span className="text-xs text-slate-400">·</span>
                    <p className="text-sm text-slate-500">{c.email}</p>
                    {c.phone && <p className="text-sm text-slate-400">{c.phone}</p>}
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 mb-1">
                    {c.club?.name}
                    {c.club?.city && <span className="font-normal text-slate-400"> · {c.club.city}, {c.club.state}</span>}
                  </p>
                  {c.role_at_club && (
                    <p className="text-xs text-slate-500 mb-1">Role: <span className="font-semibold text-slate-700">{c.role_at_club}</span></p>
                  )}
                  {c.message && (
                    <p className="text-xs text-slate-400 italic mt-1 line-clamp-2">"{c.message}"</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(c.id)}
                    disabled={!!acting}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3 py-2 text-sm font-bold text-white transition-colors"
                  >
                    {acting === c.id + 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => reject(c.id)}
                    disabled={!!acting}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-3 py-2 text-sm font-bold text-slate-600 transition-colors"
                  >
                    {acting === c.id + 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
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
            <h2 className="font-bold text-slate-900 text-sm text-slate-500">Resolved claims</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {resolved.map(c => (
              <div key={c.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{c.name} <span className="font-normal text-slate-400">— {c.club?.name}</span></p>
                  <p className="text-xs text-slate-400">{c.email}</p>
                </div>
                <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${
                  c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SiteAdmin() {
  const toast = useToast()
  const [tab,     setTab]    = useState('clubs')
  const [clubs,   setClubs]  = useState([])
  const [loading, setLoading] = useState(true)
  const [claimCount, setClaimCount] = useState(0)

  useEffect(() => {
    api.get('/clubs/all')
      .then(r => setClubs(r.data))
      .catch(() => toast.error('Failed to load clubs'))
      .finally(() => setLoading(false))
    api.get('/club-claims')
      .then(r => setClaimCount(r.data.filter(c => c.status === 'pending').length))
      .catch(() => {})
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Shield className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Site Admin</h1>
          <p className="text-sm text-slate-500">Platform-wide overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Clubs</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{clubs.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Claimed</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{clubs.filter(c => c.is_claimed).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unclaimed</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{clubs.filter(c => !c.is_claimed).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sports</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{new Set(clubs.map(c => c.sport)).size}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { key: 'clubs',  label: 'All Clubs' },
          { key: 'claims', label: 'Club Claims', badge: claimCount },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            {t.label}
            {t.badge > 0 && (
              <span className="rounded-full bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 leading-none">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'clubs' && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No clubs registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Club</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Sport</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Location</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clubs.map(club => (
                    <tr key={club.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{club.name}</p>
                        {club.slug && <p className="text-xs text-slate-400 mt-0.5">/{club.slug}</p>}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-500 capitalize">{club.sport}</td>
                      <td className="px-6 py-4 hidden lg:table-cell text-slate-500">
                        {[club.city, club.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            club.is_public ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {club.is_public ? 'Public' : 'Private'}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            club.is_claimed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {club.is_claimed ? 'Claimed' : 'Unclaimed'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'claims' && <ClaimsPanel />}
    </div>
  )
}
