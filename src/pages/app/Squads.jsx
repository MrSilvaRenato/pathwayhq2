import { useState, useEffect, useRef } from 'react'
import { Plus, Users, Trash2, X, Pencil, Check, ChevronRight, Loader2, UserPlus, Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const FTEM_COLORS = {
  F1: 'bg-sky-100 text-sky-700',
  F2: 'bg-sky-100 text-sky-700',
  T1: 'bg-violet-100 text-violet-700',
  T2: 'bg-violet-100 text-violet-700',
  T3: 'bg-violet-100 text-violet-700',
  E1: 'bg-amber-100 text-amber-700',
  E2: 'bg-amber-100 text-amber-700',
  M:  'bg-emerald-100 text-emerald-700',
}

const SPORT_EMOJI = {
  soccer: '⚽', football: '🏈', basketball: '🏀', tennis: '🎾',
  swimming: '🏊', athletics: '🏃', rugby: '🏉', cricket: '🏏',
  netball: '🥅', gymnastics: '🤸', volleyball: '🏐', hockey: '🏑',
}

function sportEmoji(sport) {
  if (!sport) return '🏅'
  const key = sport.toLowerCase()
  for (const [k, v] of Object.entries(SPORT_EMOJI)) {
    if (key.includes(k)) return v
  }
  return '🏅'
}

// ── Squad Card ────────────────────────────────────────────────────────────────
function SquadCard({ squad, selected, onSelect, isAdmin, onDelete, onUpdate }) {
  const toast = useToast()
  const [editing, setEditing]         = useState(false)
  const [form, setForm]               = useState({ name: squad.name, description: squad.description || '' })
  const [saving, setSaving]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]       = useState(false)

  async function handleSave(e) {
    e.stopPropagation()
    setSaving(true)
    try {
      await api.put(`/squads/${squad.id}`, form)
      onUpdate(squad.id, form)
      setEditing(false)
      toast.success('Squad updated')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleEditClick(e) {
    e.stopPropagation()
    setForm({ name: squad.name, description: squad.description || '' })
    setEditing(true)
  }

  function handleCancel(e) {
    e.stopPropagation()
    setEditing(false)
  }

  async function handleDeleteConfirm(e) {
    e.stopPropagation()
    setDeleting(true)
    try {
      await api.delete(`/squads/${squad.id}`)
      onDelete(squad.id)
      toast.success('Squad deleted')
    } catch {
      toast.error('Failed to delete')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const athleteCount = squad.athletes_count ?? squad.athlete_count ?? 0

  return (
    <div
      onClick={() => !editing && !confirmDelete && onSelect(squad.id)}
      className={`rounded-2xl border bg-white transition-all p-5 cursor-pointer ${
        selected
          ? 'border-emerald-400 shadow-lg shadow-emerald-100 ring-1 ring-emerald-300'
          : 'border-slate-100 active:bg-slate-50 hover:shadow-md hover:border-slate-200'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-emerald-500' : 'bg-emerald-50'}`}>
          <Users className={`h-5 w-5 ${selected ? 'text-white' : 'text-emerald-600'}`} />
        </div>
        {/* Admin action buttons — always visible on mobile, hover-revealed on desktop */}
        {isAdmin && !editing && !confirmDelete && (
          <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Edit squad"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Delete squad"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Inline delete confirm */}
      {confirmDelete && (
        <div onClick={e => e.stopPropagation()} className="mb-3 rounded-xl bg-red-50 border border-red-100 p-3">
          <p className="text-sm font-semibold text-red-700 mb-2">Delete "{squad.name}"?</p>
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
              disabled={deleting}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-white transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-500 hover:bg-red-400 py-2 text-sm font-bold text-white disabled:opacity-50 transition-colors min-h-[44px] flex items-center justify-center gap-1.5"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      {editing ? (
        <div onClick={e => e.stopPropagation()} className="space-y-2">
          <input
            autoFocus
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[44px]"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2}
            placeholder="Description (optional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 min-h-[44px]"
            >Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1 min-h-[44px]"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-bold text-slate-900 leading-tight">{squad.name}</h2>
          {squad.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{squad.description}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              <Users className="h-3 w-3" />
              {athleteCount} athlete{athleteCount !== 1 ? 's' : ''}
            </span>
            <span className={`text-xs font-semibold flex items-center gap-0.5 transition-colors ${selected ? 'text-emerald-600' : 'text-slate-400'}`}>
              {selected ? 'Viewing' : 'View roster'} <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ── Roster Detail — shared between mobile overlay and desktop inline ───────────
function RosterContent({ squad, athletes, isAdmin, removing, confirmRemoveId, onRemoveClick, onRemoveConfirm, onRemoveCancelConfirm }) {
  const count = athletes?.length ?? (squad.athletes_count ?? squad.athlete_count ?? 0)

  if (athletes === null) {
    return (
      <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading athletes…</span>
      </div>
    )
  }

  if (athletes.length === 0) {
    return (
      <div className="text-center py-10">
        <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm text-slate-400 font-semibold">No athletes in this squad yet</p>
        <p className="text-xs text-slate-300 mt-1">Assign athletes from the Athletes page</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-50">
      {athletes.map(a => (
        <li key={a.id} className="py-3 px-1 gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl leading-none shrink-0">{sportEmoji(a.sport)}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">
                  {a.first_name} {a.last_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {a.ftem_phase && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${FTEM_COLORS[a.ftem_phase] ?? 'bg-slate-100 text-slate-500'}`}>
                      {a.ftem_phase}
                    </span>
                  )}
                  <span className={`text-xs font-semibold ${a.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {a.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            {isAdmin && confirmRemoveId !== a.id && (
              <button
                onClick={() => onRemoveClick(a)}
                disabled={removing === a.id}
                className="shrink-0 h-9 flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-50 min-h-[36px]"
              >
                {removing === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Remove
              </button>
            )}
          </div>
          {/* Inline remove confirm */}
          {isAdmin && confirmRemoveId === a.id && (
            <div className="mt-2 flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
              <span className="text-xs font-semibold text-red-700 flex-1">Remove {a.first_name}?</span>
              <button
                onClick={() => onRemoveCancelConfirm()}
                className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                No
              </button>
              <button
                onClick={() => onRemoveConfirm(a)}
                disabled={removing === a.id}
                className="h-9 px-3 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-400 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {removing === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Yes
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

// ── Add Athlete Picker ────────────────────────────────────────────────────────
function AddAthletePicker({ squad, currentAthletes, onAdded, onCancel }) {
  const toast = useToast()
  const [allAthletes, setAllAthletes] = useState([])
  const [q, setQ]                     = useState('')
  const [adding, setAdding]           = useState(null)

  useEffect(() => {
    api.get('/athletes').then(r => setAllAthletes(r.data)).catch(() => {})
  }, [])

  const currentIds = new Set((currentAthletes ?? []).map(a => a.id))
  const available  = allAthletes
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
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Add athlete to squad</p>
        <button onClick={onCancel} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search athletes…"
          className="w-full h-9 rounded-lg border border-white bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>
      {available.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">{q ? 'No athletes found' : 'All athletes are already in this squad'}</p>
      ) : (
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {available.map(a => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-white border border-slate-100 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{a.first_name} {a.last_name}</p>
                {a.squad_names && <p className="text-xs text-slate-400 truncate">{a.squad_names}</p>}
              </div>
              <button
                onClick={() => handleAdd(a)}
                disabled={adding === a.id}
                className="shrink-0 h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition-colors"
              >
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

// ── Desktop Detail Panel ──────────────────────────────────────────────────────
function SquadDetail({ squad, isAdmin, onClose, onAthleteRemoved, onAthleteAdded }) {
  const toast = useToast()
  const [athletes, setAthletes]               = useState(null)
  const [removing, setRemoving]               = useState(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)
  const [showAddPicker, setShowAddPicker]     = useState(false)
  const cache = useRef({})

  useEffect(() => {
    if (!squad) return
    if (cache.current[squad.id]) {
      setAthletes(cache.current[squad.id])
      return
    }
    setAthletes(null)
    setShowAddPicker(false)
    api.get(`/squads/${squad.id}/athletes`)
      .then(r => {
        cache.current[squad.id] = r.data
        setAthletes(r.data)
      })
      .catch(() => {
        toast.error('Failed to load athletes')
        setAthletes([])
      })
  }, [squad?.id])

  async function handleRemoveConfirm(athlete) {
    setRemoving(athlete.id)
    try {
      await api.delete(`/squads/${squad.id}/athletes/${athlete.id}`)
      const updated = athletes.filter(a => a.id !== athlete.id)
      cache.current[squad.id] = updated
      setAthletes(updated)
      onAthleteRemoved(squad.id, updated.length)
      toast.success(`${athlete.first_name} removed from squad`)
    } catch {
      toast.error('Failed to remove athlete')
    } finally {
      setRemoving(null)
      setConfirmRemoveId(null)
    }
  }

  function handleAthleteAdded(athlete) {
    const updated = [...(athletes ?? []), { ...athlete, status: 'active' }]
    cache.current[squad.id] = updated
    setAthletes(updated)
    onAthleteAdded(squad.id, updated.length)
    setShowAddPicker(false)
  }

  if (!squad) return null

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white shadow-xl shadow-emerald-50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">{squad.name}</h3>
            <p className="text-xs text-slate-500">{athletes?.length ?? (squad.athletes_count ?? 0)} athlete{(athletes?.length ?? 0) !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddPicker(v => !v)}
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add athlete
            </button>
          )}
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="p-6">
        {showAddPicker && isAdmin && (
          <AddAthletePicker
            squad={squad}
            currentAthletes={athletes}
            onAdded={handleAthleteAdded}
            onCancel={() => setShowAddPicker(false)}
          />
        )}
        <RosterContent
          squad={squad}
          athletes={athletes}
          isAdmin={isAdmin}
          removing={removing}
          confirmRemoveId={confirmRemoveId}
          onRemoveClick={a => setConfirmRemoveId(a.id)}
          onRemoveConfirm={handleRemoveConfirm}
          onRemoveCancelConfirm={() => setConfirmRemoveId(null)}
        />
      </div>
    </div>
  )
}

// ── Mobile Roster Overlay ─────────────────────────────────────────────────────
function MobileRosterOverlay({ squad, isAdmin, onClose, onAthleteRemoved, onAthleteAdded }) {
  const toast = useToast()
  const [athletes, setAthletes]               = useState(null)
  const [removing, setRemoving]               = useState(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)
  const [showAddPicker, setShowAddPicker]     = useState(false)
  const cache = useRef({})

  useEffect(() => {
    if (!squad) return
    if (cache.current[squad.id]) {
      setAthletes(cache.current[squad.id])
      return
    }
    setAthletes(null)
    api.get(`/squads/${squad.id}/athletes`)
      .then(r => {
        cache.current[squad.id] = r.data
        setAthletes(r.data)
      })
      .catch(() => {
        toast.error('Failed to load athletes')
        setAthletes([])
      })
  }, [squad?.id])

  async function handleRemoveConfirm(athlete) {
    setRemoving(athlete.id)
    try {
      await api.delete(`/squads/${squad.id}/athletes/${athlete.id}`)
      const updated = athletes.filter(a => a.id !== athlete.id)
      cache.current[squad.id] = updated
      setAthletes(updated)
      onAthleteRemoved(squad.id, updated.length)
      toast.success(`${athlete.first_name} removed from squad`)
    } catch {
      toast.error('Failed to remove athlete')
    } finally {
      setRemoving(null)
      setConfirmRemoveId(null)
    }
  }

  function handleAthleteAdded(athlete) {
    const updated = [...(athletes ?? []), { ...athlete, status: 'active' }]
    cache.current[squad.id] = updated
    setAthletes(updated)
    onAthleteAdded(squad.id, updated.length)
    setShowAddPicker(false)
  }

  const count = athletes?.length ?? (squad?.athletes_count ?? squad?.athlete_count ?? 0)

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-emerald-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-slate-900">{squad.name}</h3>
              <p className="text-xs text-slate-500">{count} athlete{count !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAddPicker(v => !v)}
                className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" /> Add
              </button>
            )}
            <button
              onClick={onClose}
              className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {showAddPicker && isAdmin && (
            <AddAthletePicker
              squad={squad}
              currentAthletes={athletes}
              onAdded={handleAthleteAdded}
              onCancel={() => setShowAddPicker(false)}
            />
          )}
          <RosterContent
            squad={squad}
            athletes={athletes}
            isAdmin={isAdmin}
            removing={removing}
            confirmRemoveId={confirmRemoveId}
            onRemoveClick={a => setConfirmRemoveId(a.id)}
            onRemoveConfirm={handleRemoveConfirm}
            onRemoveCancelConfirm={() => setConfirmRemoveId(null)}
          />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function PendingRequests({ onApproved }) {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [acting, setActing]     = useState(null)

  useEffect(() => {
    api.get('/squad-requests').then(r => setRequests(r.data)).catch(() => {})
  }, [])

  if (requests.length === 0) return null

  async function act(id, action) {
    setActing(id + action)
    try {
      await api.put(`/squad-requests/${id}/${action}`)
      setRequests(p => p.filter(r => r.id !== id))
      if (action === 'approve') {
        toast.success('Athlete added to squad')
        onApproved?.()
      } else {
        toast.success('Request declined')
      }
    } catch {
      toast.error('Action failed')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-bold text-amber-800">
          Pending squad request{requests.length !== 1 ? 's' : ''} ({requests.length})
        </h2>
      </div>
      <div className="space-y-2">
        {requests.map(r => (
          <div key={r.id} className="flex items-start gap-3 rounded-xl bg-white border border-amber-100 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
              {r.athlete?.first_name?.[0]}{r.athlete?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">
                {r.athlete?.first_name} {r.athlete?.last_name}
              </p>
              <p className="text-xs text-slate-500">
                Wants to join <span className="font-semibold text-slate-700">{r.squad?.name}</span>
              </p>
              {r.reason && (
                <p className="mt-1 text-xs text-slate-400 italic line-clamp-2">"{r.reason}"</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => act(r.id, 'approve')}
                disabled={!!acting}
                className="flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white transition-colors"
              >
                {acting === r.id + 'approve' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                Approve
              </button>
              <button
                onClick={() => act(r.id, 'reject')}
                disabled={!!acting}
                className="flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors"
              >
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

export default function Squads() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [squads, setSquads]           = useState([])
  const [selectedId, setSelectedId]   = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState({ name: '', description: '' })
  const [saving, setSaving]           = useState(false)
  const detailRef = useRef(null)

  function reloadSquads() {
    api.get('/squads').then(r => setSquads(r.data)).catch(() => {})
  }

  useEffect(() => {
    api.get('/squads')
      .then(r => setSquads(r.data))
      .catch(() => toast.error('Failed to load squads'))
  }, [])

  const selectedSquad = squads.find(s => s.id === selectedId) ?? null

  function handleSelect(id) {
    setSelectedId(prev => prev === id ? null : id)
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  function handleDelete(id) {
    setSquads(p => p.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleUpdate(id, patch) {
    setSquads(p => p.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  function handleAthleteRemoved(squadId, newCount) {
    setSquads(p => p.map(s => s.id === squadId
      ? { ...s, athletes_count: newCount, athlete_count: newCount }
      : s
    ))
  }

  function handleAthleteAdded(squadId, newCount) {
    setSquads(p => p.map(s => s.id === squadId
      ? { ...s, athletes_count: newCount, athlete_count: newCount }
      : s
    ))
  }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.post('/squads', form)
      setSquads(p => [...p, { ...data, athletes_count: 0, athlete_count: 0 }])
      setShowModal(false)
      setForm({ name: '', description: '' })
      toast.success('Squad created')
    } catch {
      toast.error('Failed to create squad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 md:px-8 md:pt-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Squads</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {squads.length} squad{squads.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="hidden md:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" /> New squad
          </button>
        )}
      </div>

      <div className="px-4 md:px-8 max-w-6xl mx-auto">
        {/* Pending squad requests — admin/coach only */}
        {isAdmin && <PendingRequests onApproved={reloadSquads} />}

        {/* Grid */}
        {squads.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-400">No squads yet</p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-sm text-emerald-600 underline min-h-[44px] inline-flex items-center"
              >
                Create your first squad
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {squads.map(s => (
              <SquadCard
                key={s.id}
                squad={s}
                selected={selectedId === s.id}
                onSelect={handleSelect}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}

        {/* Desktop detail panel */}
        <div ref={detailRef} className="hidden md:block">
          <SquadDetail
            squad={selectedSquad}
            isAdmin={isAdmin}
            onClose={() => setSelectedId(null)}
            onAthleteRemoved={handleAthleteRemoved}
            onAthleteAdded={handleAthleteAdded}
          />
        </div>
      </div>

      {/* Mobile roster overlay */}
      {selectedSquad && (
        <div className="md:hidden">
          <MobileRosterOverlay
            squad={selectedSquad}
            isAdmin={isAdmin}
            onClose={() => setSelectedId(null)}
            onAthleteRemoved={handleAthleteRemoved}
            onAthleteAdded={handleAthleteAdded}
          />
        </div>
      )}

      {/* Admin FAB (mobile) */}
      {isAdmin && (
        <button
          onClick={() => setShowModal(true)}
          className="md:hidden fixed bottom-20 right-4 z-20 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-colors"
          aria-label="New squad"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Add squad modal / bottom sheet */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full md:max-w-sm md:rounded-2xl bg-white md:shadow-2xl rounded-t-3xl shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900">New squad</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Squad name *</label>
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[44px]"
                  placeholder="e.g. U14 Boys"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Optional description…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="flex gap-3 pb-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Creating…' : 'Create squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
