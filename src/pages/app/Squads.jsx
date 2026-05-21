import { useState, useEffect, useRef } from 'react'
import { Plus, Users, Trash2, X, Pencil, Check, ChevronRight, Loader2 } from 'lucide-react'
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

// ── Desktop Detail Panel ──────────────────────────────────────────────────────
function SquadDetail({ squad, isAdmin, onClose, onAthleteRemoved }) {
  const toast = useToast()
  const [athletes, setAthletes]               = useState(null)
  const [removing, setRemoving]               = useState(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)
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
        <button
          onClick={onClose}
          className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6">
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
function MobileRosterOverlay({ squad, isAdmin, onClose, onAthleteRemoved }) {
  const toast = useToast()
  const [athletes, setAthletes]               = useState(null)
  const [removing, setRemoving]               = useState(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)
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
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
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
export default function Squads() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [squads, setSquads]           = useState([])
  const [selectedId, setSelectedId]   = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState({ name: '', description: '' })
  const [saving, setSaving]           = useState(false)
  const detailRef = useRef(null)

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
