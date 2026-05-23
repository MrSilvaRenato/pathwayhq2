import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus, Users, Trash2, X, Pencil, Loader2, UserPlus,
  Search, CheckCircle, XCircle, Clock, ChevronRight,
  Shield, Layers,
} from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

// ── Helpers ───────────────────────────────────────────────────────────────────
const FTEM_META = {
  F1: { color: 'bg-sky-100 text-sky-700 border-sky-200',         ring: 'ring-sky-300' },
  F2: { color: 'bg-sky-100 text-sky-700 border-sky-200',         ring: 'ring-sky-300' },
  T1: { color: 'bg-violet-100 text-violet-700 border-violet-200',ring: 'ring-violet-300' },
  T2: { color: 'bg-violet-100 text-violet-700 border-violet-200',ring: 'ring-violet-300' },
  T3: { color: 'bg-violet-100 text-violet-700 border-violet-200',ring: 'ring-violet-300' },
  E1: { color: 'bg-amber-100 text-amber-700 border-amber-200',   ring: 'ring-amber-300' },
  E2: { color: 'bg-amber-100 text-amber-700 border-amber-200',   ring: 'ring-amber-300' },
  M:  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', ring: 'ring-emerald-300' },
}

const SPORT_EMOJI = {
  soccer:'⚽',football:'🏈',basketball:'🏀',tennis:'🎾',
  swimming:'🏊',athletics:'🏃',rugby:'🏉',cricket:'🏏',
  netball:'🥅',gymnastics:'🤸',volleyball:'🏐',hockey:'🏑',
}

function sportEmoji(sport) {
  if (!sport) return '🏅'
  const key = sport.toLowerCase()
  for (const [k, v] of Object.entries(SPORT_EMOJI)) {
    if (key.includes(k)) return v
  }
  return '🏅'
}

function initials(first = '', last = '') {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?'
}

// ── Squad form modal (create + edit) ─────────────────────────────────────────
function SquadModal({ squad, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm]   = useState({ name: squad?.name ?? '', description: squad?.description ?? '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (squad) {
        await api.put(`/squads/${squad.id}`, form)
        onSaved({ ...squad, ...form })
        toast.success('Squad updated')
      } else {
        const { data } = await api.post('/squads', form)
        onSaved({ ...data, athletes_count: 0 })
        toast.success('Squad created')
      }
      onClose()
    } catch {
      toast.error(squad ? 'Failed to save' : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Layers className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-black text-slate-900">{squad ? 'Edit squad' : 'New squad'}</h2>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Squad name *</label>
            <input
              required autoFocus
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Senior Div 1 Men, U16 Girls…"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[48px] placeholder:font-normal placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Age group, competition level, notes…"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-300"
            />
          </div>
          <div className="flex gap-3 pt-1 pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[48px] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !form.name.trim()}
              className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] transition-colors shadow-lg shadow-emerald-500/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : squad ? 'Save changes' : 'Create squad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ squad, onClose, onDeleted }) {
  const toast    = useToast()
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await api.delete(`/squads/${squad.id}`)
      onDeleted(squad.id)
      toast.success('Squad deleted')
      onClose()
    } catch {
      toast.error('Failed to delete squad')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-1">Delete squad?</h2>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">"{squad.name}"</span> will be permanently removed.
            Athletes won't be deleted — just unassigned from this squad.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[48px] transition-colors">
            Cancel
          </button>
          <button onClick={confirm} disabled={busy}
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-400 py-3 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] transition-colors">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Deleting…' : 'Delete squad'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pending squad-change requests ─────────────────────────────────────────────
function PendingRequests({ onApproved }) {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [acting,   setActing]   = useState(null)

  useEffect(() => {
    api.get('/squad-requests').then(r => setRequests(r.data)).catch(() => {})
  }, [])

  if (requests.length === 0) return null

  async function act(id, action) {
    setActing(id + action)
    try {
      await api.put(`/squad-requests/${id}/${action}`)
      setRequests(p => p.filter(r => r.id !== id))
      if (action === 'approve') { toast.success('Athlete added to squad'); onApproved?.() }
      else toast.success('Request declined')
    } catch {
      toast.error('Action failed')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="mb-5 rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 bg-amber-100/60">
        <Clock className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-bold text-amber-800">
          {requests.length} pending squad request{requests.length !== 1 ? 's' : ''}
        </h2>
      </div>
      <div className="divide-y divide-amber-100">
        {requests.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-amber-200 flex items-center justify-center text-xs font-black text-amber-800">
              {initials(r.athlete?.first_name, r.athlete?.last_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {r.athlete?.first_name} {r.athlete?.last_name}
              </p>
              <p className="text-xs text-slate-500">
                Wants to join <span className="font-semibold text-slate-700">{r.squad?.name}</span>
                {r.reason && <> · <span className="italic text-slate-400">"{r.reason}"</span></>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => act(r.id, 'approve')} disabled={!!acting}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3 py-2 text-xs font-bold text-white transition-colors min-h-[36px]">
                {acting === r.id + 'approve' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                Approve
              </button>
              <button onClick={() => act(r.id, 'reject')} disabled={!!acting}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors min-h-[36px]">
                {acting === r.id + 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Add athlete picker ────────────────────────────────────────────────────────
function AddAthletePicker({ squad, currentAthletes, onAdded, onCancel }) {
  const toast = useToast()
  const [all,    setAll]    = useState([])
  const [q,      setQ]      = useState('')
  const [adding, setAdding] = useState(null)

  useEffect(() => {
    api.get('/athletes').then(r => setAll(r.data)).catch(() => {})
  }, [])

  const currentIds = new Set((currentAthletes ?? []).map(a => a.id))
  const available  = all
    .filter(a => !currentIds.has(a.id) && a.is_active !== false)
    .filter(a => !q || `${a.first_name} ${a.last_name}`.toLowerCase().includes(q.toLowerCase()))

  async function handleAdd(athlete) {
    setAdding(athlete.id)
    try {
      await api.post(`/squads/${squad.id}/athletes`, { athlete_id: athlete.id })
      onAdded(athlete)
      toast.success(`${athlete.first_name} added to ${squad.name}`)
    } catch {
      toast.error('Failed to add athlete')
      setAdding(null)
    }
  }

  return (
    <div className="border-b border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Add athlete</p>
        <button onClick={onCancel} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          autoFocus value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search athletes…"
          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>
      {available.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">{q ? 'No athletes found' : 'All athletes already in this squad'}</p>
      ) : (
        <ul className="space-y-1.5 max-h-52 overflow-y-auto">
          {available.map(a => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 px-3 py-2.5 hover:border-slate-200 transition-colors">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700 shrink-0">
                {initials(a.first_name, a.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{a.first_name} {a.last_name}</p>
                {a.ftem_phase && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${FTEM_META[a.ftem_phase]?.color ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {a.ftem_phase}
                  </span>
                )}
              </div>
              <button onClick={() => handleAdd(a)} disabled={adding === a.id}
                className="shrink-0 h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition-colors">
                {adding === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Roster panel content ──────────────────────────────────────────────────────
function RosterPanel({ squad, isAdmin, onClose, onAthleteRemoved, onAthleteAdded, asSheet }) {
  const toast = useToast()
  const [athletes,        setAthletes]        = useState(null)
  const [removing,        setRemoving]        = useState(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)
  const [showAddPicker,   setShowAddPicker]   = useState(false)
  const cacheRef = useRef({})

  useEffect(() => {
    if (!squad) return
    setShowAddPicker(false)
    setConfirmRemoveId(null)
    if (cacheRef.current[squad.id]) {
      setAthletes(cacheRef.current[squad.id])
      return
    }
    setAthletes(null)
    api.get(`/squads/${squad.id}/athletes`)
      .then(r => { cacheRef.current[squad.id] = r.data; setAthletes(r.data) })
      .catch(() => { toast.error('Failed to load athletes'); setAthletes([]) })
  }, [squad?.id])

  async function handleRemove(athlete) {
    setRemoving(athlete.id)
    try {
      await api.delete(`/squads/${squad.id}/athletes/${athlete.id}`)
      const updated = athletes.filter(a => a.id !== athlete.id)
      cacheRef.current[squad.id] = updated
      setAthletes(updated)
      onAthleteRemoved(squad.id, updated.length)
      toast.success(`${athlete.first_name} removed`)
    } catch {
      toast.error('Failed to remove athlete')
    } finally {
      setRemoving(null)
      setConfirmRemoveId(null)
    }
  }

  function handleAdded(athlete) {
    const updated = [...(athletes ?? []), { ...athlete, status: 'active' }]
    cacheRef.current[squad.id] = updated
    setAthletes(updated)
    onAthleteAdded(squad.id, updated.length)
    setShowAddPicker(false)
  }

  if (!squad) return null

  const count = athletes?.length ?? (squad.athletes_count ?? 0)

  const inner = (
    <div className={`flex flex-col ${asSheet ? 'h-full' : 'h-full'}`}>
      {/* Panel header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 ${asSheet ? 'bg-emerald-50 rounded-t-3xl' : 'bg-emerald-50'}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 leading-tight">{squad.name}</h3>
            <p className="text-xs text-slate-500">
              {athletes === null ? 'Loading…' : `${count} athlete${count !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddPicker(v => !v)}
              className={`h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors ${
                showAddPicker
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-500/20'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{showAddPicker ? 'Cancel' : 'Add athlete'}</span>
            </button>
          )}
          <button onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Add picker */}
      {showAddPicker && isAdmin && (
        <AddAthletePicker
          squad={squad}
          currentAthletes={athletes}
          onAdded={handleAdded}
          onCancel={() => setShowAddPicker(false)}
        />
      )}

      {/* Athlete list */}
      <div className="flex-1 overflow-y-auto">
        {athletes === null ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading athletes…</span>
          </div>
        ) : athletes.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-500">No athletes yet</p>
            <p className="text-xs text-slate-400 mt-1">
              {isAdmin ? 'Use "Add athlete" to assign someone to this squad.' : 'Athletes will appear here once added by your coach.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {athletes.map(a => {
              const ftem = FTEM_META[a.ftem_phase]
              return (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-black text-slate-600 shrink-0 border border-slate-200">
                      {initials(a.first_name, a.last_name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-slate-800">
                          {a.first_name} {a.last_name}
                        </p>
                        {a.ftem_phase && (
                          <span className={`inline-flex text-[10px] font-black px-1.5 py-0.5 rounded-md border ${ftem?.color ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {a.ftem_phase}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{sportEmoji(a.sport)} {a.sport ?? 'General'}</span>
                        <span className={`text-[10px] font-semibold ${a.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {a.status === 'active' ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>
                    {/* Remove */}
                    {isAdmin && confirmRemoveId !== a.id && (
                      <button
                        onClick={() => setConfirmRemoveId(a.id)}
                        disabled={removing === a.id}
                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        title="Remove from squad"
                      >
                        {removing === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                  {/* Inline remove confirm */}
                  {isAdmin && confirmRemoveId === a.id && (
                    <div className="mt-2.5 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold text-red-700 flex-1">Remove {a.first_name} from squad?</p>
                      <button onClick={() => setConfirmRemoveId(null)}
                        className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                        No
                      </button>
                      <button onClick={() => handleRemove(a)} disabled={removing === a.id}
                        className="h-8 px-3 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-400 disabled:opacity-50 transition-colors flex items-center gap-1">
                        {removing === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )

  if (asSheet) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
          {inner}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ maxHeight: '75vh' }}>
      {inner}
    </div>
  )
}

// ── Squad card ────────────────────────────────────────────────────────────────
function SquadCard({ squad, selected, onSelect, isAdmin, onEdit, onDelete }) {
  const count = squad.athletes_count ?? squad.athlete_count ?? 0

  return (
    <button
      onClick={() => onSelect(squad.id)}
      className={`w-full text-left rounded-2xl border transition-all group ${
        selected
          ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100 ring-1 ring-emerald-300'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            selected ? 'bg-emerald-500' : 'bg-slate-100 group-hover:bg-emerald-50'
          }`}>
            <Layers className={`h-5 w-5 transition-colors ${selected ? 'text-white' : 'text-slate-500 group-hover:text-emerald-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-black text-base truncate leading-tight ${selected ? 'text-emerald-900' : 'text-slate-900'}`}>
              {squad.name}
            </p>
            {squad.description ? (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{squad.description}</p>
            ) : (
              <p className="text-xs text-slate-300 mt-0.5 italic">No description</p>
            )}
          </div>
          {/* Admin action buttons */}
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={e => { e.stopPropagation(); onEdit(squad) }}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Edit squad"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(squad) }}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete squad"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className={`flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1 ${
            selected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <Users className="h-3 w-3" />
            {count} athlete{count !== 1 ? 's' : ''}
          </div>
          <span className={`text-xs font-semibold flex items-center gap-0.5 transition-colors ${
            selected ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            {selected ? 'Viewing roster' : 'View roster'}
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Squads() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [squads,      setSquads]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selectedId,  setSelectedId]  = useState(null)
  const [editSquad,   setEditSquad]   = useState(null)  // null = closed, false = new, object = edit
  const [deleteSquad, setDeleteSquad] = useState(null)

  const load = useCallback(() => {
    api.get('/squads')
      .then(r => setSquads(r.data))
      .catch(() => toast.error('Failed to load squads'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const selected = squads.find(s => s.id === selectedId) ?? null

  function handleSelect(id) {
    setSelectedId(prev => prev === id ? null : id)
  }

  function handleSaved(squad) {
    setSquads(prev => {
      const idx = prev.findIndex(s => s.id === squad.id)
      if (idx >= 0) return prev.map(s => s.id === squad.id ? squad : s)
      return [...prev, squad]
    })
    if (!selectedId) setSelectedId(squad.id)
  }

  function handleDeleted(id) {
    setSquads(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleAthleteRemoved(squadId, newCount) {
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, athletes_count: newCount } : s))
  }

  function handleAthleteAdded(squadId, newCount) {
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, athletes_count: newCount } : s))
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 md:px-8 md:pt-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Squads</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? '…' : `${squads.length} squad${squads.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setEditSquad(false)}
            className="hidden md:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" /> New squad
          </button>
        )}
      </div>

      <div className="px-4 md:px-8 max-w-7xl mx-auto">
        {/* Pending requests */}
        {isAdmin && <PendingRequests onApproved={load} />}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : squads.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-400 text-lg">No squads yet</p>
            <p className="text-sm text-slate-300 mt-1">Create your first squad to start organising athletes.</p>
            {isAdmin && (
              <button onClick={() => setEditSquad(false)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
                <Plus className="h-4 w-4" /> Create first squad
              </button>
            )}
          </div>
        ) : (
          // Split layout: squad list | roster panel
          <div className={`flex gap-5 items-start ${selected ? 'flex-col lg:flex-row' : ''}`}>
            {/* Squad list */}
            <div className={`${selected ? 'w-full lg:w-80 shrink-0' : 'w-full'}`}>
              <div className={`grid gap-3 ${selected ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {squads.map(s => (
                  <SquadCard
                    key={s.id}
                    squad={s}
                    selected={selectedId === s.id}
                    onSelect={handleSelect}
                    isAdmin={isAdmin}
                    onEdit={sq => setEditSquad(sq)}
                    onDelete={sq => setDeleteSquad(sq)}
                  />
                ))}
                {/* Add squad inline card */}
                {isAdmin && (
                  <button
                    onClick={() => setEditSquad(false)}
                    className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all p-4 flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-600 min-h-[100px] group"
                  >
                    <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold">New squad</span>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop roster panel */}
            {selected && (
              <div className="hidden lg:flex flex-col flex-1 sticky top-6" style={{ minHeight: '400px' }}>
                <RosterPanel
                  squad={selected}
                  isAdmin={isAdmin}
                  onClose={() => setSelectedId(null)}
                  onAthleteRemoved={handleAthleteRemoved}
                  onAthleteAdded={handleAthleteAdded}
                  asSheet={false}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile roster bottom sheet */}
      {selected && (
        <div className="lg:hidden">
          <RosterPanel
            squad={selected}
            isAdmin={isAdmin}
            onClose={() => setSelectedId(null)}
            onAthleteRemoved={handleAthleteRemoved}
            onAthleteAdded={handleAthleteAdded}
            asSheet
          />
        </div>
      )}

      {/* Mobile FAB */}
      {isAdmin && (
        <button
          onClick={() => setEditSquad(false)}
          className="lg:hidden fixed bottom-20 right-4 z-20 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-colors"
          aria-label="New squad"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Create / Edit modal */}
      {editSquad !== null && (
        <SquadModal
          squad={editSquad || null}
          onClose={() => setEditSquad(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteSquad && (
        <DeleteModal
          squad={deleteSquad}
          onClose={() => setDeleteSquad(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
