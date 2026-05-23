import { useState, useEffect, useCallback } from 'react'
import {
  CalendarDays, Plus, ChevronRight, Loader2, CheckCircle2,
  Clock, XCircle, Send, X, Pencil, Trash2, DollarSign, Users,
} from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'

const STATUS_COLOR = {
  draft:  'bg-slate-100 text-slate-600',
  open:   'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
}

const REG_STATUS = {
  invited:         { label: 'Invited',       color: 'bg-blue-100 text-blue-700' },
  manual_pending:  { label: 'Pay at club',   color: 'bg-amber-100 text-amber-700' },
  paid:            { label: 'Paid',          color: 'bg-emerald-100 text-emerald-700' },
  manual_confirmed:{ label: 'Paid (manual)', color: 'bg-emerald-100 text-emerald-700' },
  rejected:        { label: 'Rejected',      color: 'bg-red-100 text-red-700' },
}

function fmtMoney(cents, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(cents / 100)
}

// ─── Season form modal ────────────────────────────────────────────────────────
function SeasonModal({ season, onSave, onClose }) {
  const [form, setForm] = useState({
    name: season?.name ?? '',
    description: season?.description ?? '',
    start_date: season?.start_date ?? '',
    end_date: season?.end_date ?? '',
    registration_deadline: season?.registration_deadline ?? '',
    fee: season ? (season.fee_cents / 100).toFixed(2) : '',
    status: season?.status ?? 'draft',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { fee, ...rest } = form
      const payload = { ...rest, fee_cents: Math.round(parseFloat(fee || 0) * 100) }
      if (season) {
        await api.put(`/seasons/${season.id}`, payload)
      } else {
        await api.post('/seasons', payload)
      }
      onSave()
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Failed to save season')
    } finally { setSaving(false) }
  }

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900">{season ? 'Edit Season' : 'New Season'}</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Season name *</label>
            <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="e.g. Winter 2025, Season 1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className={inputCls + ' resize-none'} placeholder="Optional notes about this season" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Start date</label>
              <input type="date" value={form.start_date} onChange={set('start_date')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">End date</label>
              <input type="date" value={form.end_date} onChange={set('end_date')} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Registration deadline</label>
              <input type="date" value={form.registration_deadline} onChange={set('registration_deadline')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Fee (AUD $)</label>
              <input type="number" min="0" step="0.01" value={form.fee} onChange={set('fee')} className={inputCls} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
            <select value={form.status} onChange={set('status')} className={inputCls + ' cursor-pointer'}>
              <option value="draft">Draft — not visible to athletes</option>
              <option value="open">Open — athletes can be invited to register</option>
              <option value="closed">Closed — registration complete</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 py-2.5 text-sm font-bold text-white transition-colors">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {season ? 'Save changes' : 'Create season'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Season detail panel ──────────────────────────────────────────────────────
function SeasonDetail({ seasonId, onBack, athletes }) {
  const toast = useToast()
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState([])
  const [sending,  setSending]  = useState(false)
  const [acting,   setActing]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/seasons/${seasonId}`)
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => { toast.error('Failed to load season'); setLoading(false) })
  }, [seasonId])

  useEffect(() => { load() }, [load])

  const registeredIds = new Set(data?.registrations?.map(r => r.athlete_id) ?? [])
  const eligible = athletes.filter(a => a.user_id && !registeredIds.has(a.id))

  function toggleSelect(id) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  async function sendInvites() {
    if (!selected.length) return
    setSending(true)
    try {
      const res = await api.post(`/seasons/${seasonId}/invite`, { athlete_ids: selected })
      toast.success(`${res.data.invited} registration request${res.data.invited !== 1 ? 's' : ''} sent`)
      setSelected([])
      load()
    } catch { toast.error('Failed to send invites') } finally { setSending(false) }
  }

  async function markPaid(regId) {
    setActing(regId)
    try {
      await api.put(`/registrations/${regId}/mark-paid`)
      toast.success('Marked as paid')
      load()
    } catch { toast.error('Failed') } finally { setActing(null) }
  }

  async function removeReg(regId) {
    setActing(regId + 'd')
    try {
      await api.delete(`/registrations/${regId}`)
      load()
    } catch { toast.error('Failed') } finally { setActing(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  )

  const { season, registrations } = data
  const paidCount = registrations.filter(r => r.status === 'paid' || r.status === 'manual_confirmed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
          ← Seasons
        </button>
        <span className="text-slate-300">/</span>
        <h2 className="font-black text-slate-900">{season.name}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLOR[season.status]}`}>{season.status}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total registrations', value: registrations.length, color: 'text-blue-600' },
          { label: 'Paid', value: paidCount, color: 'text-emerald-600' },
          { label: 'Fee per athlete', value: fmtMoney(season.fee_cents), color: 'text-slate-800' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invite roster athletes */}
      {eligible.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">Send registration request</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select athletes from your roster who attended the trial</p>
            </div>
            {selected.length > 0 && (
              <button onClick={sendInvites} disabled={sending}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-4 py-2 text-sm font-bold text-white transition-colors shrink-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to {selected.length}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {eligible.map(a => (
              <label key={a.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs">
                  {a.first_name?.[0]}{a.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{a.first_name} {a.last_name}</p>
                  <p className="text-xs text-slate-400">{a.squad_names || a.ftem_phase}</p>
                </div>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
              <p className="text-sm text-emerald-700 font-semibold">{selected.length} selected · {fmtMoney(selected.length * season.fee_cents)} total</p>
              <button onClick={() => setSelected([])} className="text-xs text-emerald-600 hover:text-emerald-800 underline">Clear</button>
            </div>
          )}
        </div>
      )}

      {/* Registrations list */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Registrations ({registrations.length})</h3>
        </div>
        {registrations.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">No registrations yet. Select athletes above to send payment requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Athlete</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Paid at</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {registrations.map(r => {
                  const s = REG_STATUS[r.status] ?? { label: r.status, color: 'bg-slate-100 text-slate-500' }
                  const canMarkPaid = ['invited', 'manual_pending'].includes(r.status)
                  const canRemove  = !['paid', 'manual_confirmed'].includes(r.status)
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-800">{r.athlete_name}</td>
                      <td className="px-6 py-3 hidden sm:table-cell text-slate-500 text-xs">{r.email}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell text-slate-400 text-xs">
                        {r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-AU') : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2 justify-end">
                          {canMarkPaid && (
                            <button onClick={() => markPaid(r.id)} disabled={acting === r.id}
                              className="flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 text-xs font-bold transition-colors">
                              {acting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
                              Mark paid
                            </button>
                          )}
                          {canRemove && (
                            <button onClick={() => removeReg(r.id)} disabled={acting === r.id + 'd'}
                              className="flex items-center gap-1 rounded-lg text-slate-400 hover:text-red-500 px-2 py-1.5 text-xs transition-colors">
                              {acting === r.id + 'd' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Seasons() {
  const toast = useToast()
  const [seasons,    setSeasons]    = useState([])
  const [athletes,   setAthletes]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [detail,     setDetail]     = useState(null) // seasonId being viewed

  const loadSeasons = () => {
    api.get('/seasons').then(r => setSeasons(r.data)).catch(() => toast.error('Failed to load seasons'))
  }

  useEffect(() => {
    Promise.all([
      api.get('/seasons'),
      api.get('/athletes'),
    ]).then(([s, a]) => {
      setSeasons(s.data)
      setAthletes(Array.isArray(a.data) ? a.data : a.data.data ?? [])
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  async function deleteSeason(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this season? This cannot be undone.')) return
    try {
      await api.delete(`/seasons/${id}`)
      setSeasons(p => p.filter(s => s.id !== id))
      toast.success('Season deleted')
    } catch { toast.error('Failed to delete') }
  }

  if (detail) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <SeasonDetail seasonId={detail} athletes={athletes} onBack={() => { setDetail(null); loadSeasons() }} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
          <CalendarDays className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Seasons</h1>
          <p className="text-sm text-slate-500">Manage seasons and registration payments</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true) }}
          className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/25">
          <Plus className="h-4 w-4" /> New season
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-500">No seasons yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Create your first season to start collecting registration payments.</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors">
            <Plus className="h-4 w-4" /> Create season
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map(s => (
            <div key={s.id} onClick={() => setDetail(s.id)}
              className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{s.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[s.status]}`}>{s.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> {fmtMoney(s.fee_cents)} per athlete
                    </span>
                    {s.start_date && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(s.start_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                        {s.end_date && <> – {new Date(s.end_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</>}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {s.registrations_count} registered · {s.paid_count} paid
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditing(s); setShowModal(true) }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={e => deleteSeason(s.id, e)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SeasonModal
          season={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={() => { setShowModal(false); setEditing(null); loadSeasons() }}
        />
      )}
    </div>
  )
}
