import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Trophy, Search, ChevronDown, Loader2, Zap, Globe, GlobeLock } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

// ─── helpers ────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function monthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function athleteCount(items) {
  return new Set(items.map(m => m.athlete_id).filter(Boolean)).size
}

// Abbreviated FTEM code: F1 → F1, T2 → T2, E1 → E1, M → M
function ftemAbbr(phase) {
  return phase
}

// ─── sub-components ──────────────────────────────────────────────────────────

function FtemBadge({ phase, abbreviated = false }) {
  const meta = FTEM_PHASES[phase]
  if (!meta) return null
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.color}`}>
      {abbreviated ? ftemAbbr(phase) : phase}
    </span>
  )
}

function MilestoneCard({ m, isAdmin, onDelete, onTogglePublic }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling]           = useState(false)
  const phase = FTEM_PHASES[m.ftem_phase]

  async function handleTogglePublic(e) {
    e.stopPropagation()
    setToggling(true)
    await onTogglePublic(m.id, !m.is_shared_with_parent)
    setToggling(false)
  }

  return (
    <div className="rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
      {/* Coloured top accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-yellow-300" />

      <div className="px-4 py-3.5 md:px-5">
        <div className="flex items-start gap-3">
          {/* Trophy icon with FTEM colour */}
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${phase?.color ?? 'bg-amber-50 text-amber-500'}`}>
            <Trophy className="h-5 w-5" />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-bold text-slate-900 leading-snug">{m.title}</h2>
              {m.is_claimed && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="Athlete has linked account" />
              )}
            </div>
            {(m.first_name || m.last_name) && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{m.first_name} {m.last_name}</p>
            )}
            {m.description && (
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{m.description}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5 sm:hidden">{fmtDate(m.achieved_at)}</p>
          </div>

          {/* Right column: date + FTEM + actions */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <p className="text-xs text-slate-400 whitespace-nowrap hidden sm:block">{fmtDate(m.achieved_at)}</p>
            <FtemBadge phase={m.ftem_phase} />
            {isAdmin && !confirmDelete && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleTogglePublic}
                  disabled={toggling}
                  title={m.is_shared_with_parent ? 'Remove from public profile' : 'Show on public profile'}
                  className={`h-8 px-2 flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    m.is_shared_with_parent
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {toggling
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : m.is_shared_with_parent
                      ? <><Globe className="h-3 w-3" /> Public</>
                      : <><GlobeLock className="h-3 w-3" /> Private</>
                  }
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete milestone"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {!isAdmin && m.is_shared_with_parent && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 whitespace-nowrap">
                Public
              </span>
            )}
          </div>
        </div>

        {/* Inline delete confirm */}
        {isAdmin && confirmDelete && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
            <span className="text-xs font-semibold text-red-700 flex-1">Delete this milestone?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors min-w-[48px]"
            >
              No
            </button>
            <button
              onClick={() => onDelete(m.id)}
              className="h-9 px-3 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-400 active:scale-95 transition-all min-w-[80px]"
            >
              Yes, delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function MonthGroup({ monthKey: key, milestones, isAdmin, onDelete, onTogglePublic }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 sticky top-0 bg-slate-50 md:bg-transparent py-2 z-10">
        <div className="w-1 h-5 rounded-full bg-amber-400 shrink-0" />
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
          {monthLabel(key)}
        </h3>
        <span className="text-xs text-slate-400">({milestones.length})</span>
      </div>
      <div className="flex flex-col gap-3 pl-0 md:pl-4">
        {milestones.map(m => (
          <MilestoneCard key={m.id} m={m} isAdmin={isAdmin} onDelete={onDelete} onTogglePublic={onTogglePublic} />
        ))}
      </div>
    </div>
  )
}

// ─── Add Milestone Modal / Bottom Sheet ──────────────────────────────────────

const BLANK_FORM = {
  athlete_id: '', title: '', description: '',
  ftem_phase: 'F1', achieved_at: todayISO(), is_shared_with_parent: false,
}

function AddMilestoneModal({ athletes, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [saving, setSaving] = useState(false)

  const selectedAthlete = useMemo(
    () => athletes.find(a => String(a.id) === String(form.athlete_id)) ?? null,
    [athletes, form.athlete_id],
  )

  function handleAthleteChange(e) {
    const id = e.target.value
    const athlete = athletes.find(a => String(a.id) === String(id)) ?? null
    setForm(p => ({
      ...p,
      athlete_id: id,
      ftem_phase: athlete?.ftem_phase ?? p.ftem_phase,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/milestones', form)
      toast.success('Milestone added!')
      onSaved()
    } catch {
      toast.error('Failed to save milestone.')
      setSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-h-[44px]'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full md:max-w-md md:rounded-2xl bg-white md:shadow-2xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-black text-slate-900">Add milestone</h2>
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-3" id="add-milestone-form">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Athlete</label>
              <select
                required
                value={form.athlete_id}
                onChange={handleAthleteChange}
                className={inputCls}
              >
                <option value="">Select athlete…</option>
                {athletes.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name}{a.squad_names ? ` — ${a.squad_names}` : ''}
                  </option>
                ))}
              </select>
              {selectedAthlete?.ftem_phase && (
                <p className="mt-1 text-xs text-slate-400">
                  Current phase:{' '}
                  <span className="font-semibold text-slate-600">
                    {selectedAthlete.ftem_phase} — {FTEM_PHASES[selectedAthlete.ftem_phase]?.label ?? selectedAthlete.ftem_phase}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={inputCls}
                placeholder="e.g. First hat-trick"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">FTEM Phase</label>
                <select
                  value={form.ftem_phase}
                  onChange={e => setForm(p => ({ ...p, ftem_phase: e.target.value }))}
                  className={inputCls}
                >
                  {Object.entries(FTEM_PHASES).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Date achieved</label>
                <input
                  type="date"
                  required
                  value={form.achieved_at}
                  onChange={e => setForm(p => ({ ...p, achieved_at: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                placeholder="Add context or notes…"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer select-none min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <input
                type="checkbox"
                checked={form.is_shared_with_parent}
                onChange={e => setForm(p => ({ ...p, is_shared_with_parent: e.target.checked }))}
                className="rounded accent-emerald-500 h-4 w-4 mt-0.5 shrink-0"
              />
              <div>
                <span className="font-semibold text-slate-700">Show on public club profile</span>
                <p className="text-xs text-slate-400 mt-0.5">Displays this milestone in the club's trophy cabinet and shares with parents</p>
              </div>
            </label>
          </form>
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-milestone-form"
            disabled={saving}
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors min-h-[44px]"
          >
            {saving ? 'Saving…' : 'Add milestone'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Milestones() {
  const { isAdmin } = useAuth()
  const toast = useToast()

  const [items, setItems]       = useState([])
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [q, setQ]                         = useState('')
  const [filterAthlete, setFilterAthlete] = useState('')
  const [filterPhase, setFilterPhase]     = useState('')

  async function fetchMilestones() {
    try {
      const { data } = await api.get('/milestones')
      setItems(data)
    } catch {
      toast.error('Failed to load milestones.')
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true)
      await fetchMilestones()
      if (isAdmin) {
        try {
          const { data } = await api.get('/athletes')
          setAthletes(data)
        } catch {
          // non-fatal
        }
      }
      setLoading(false)
    }
    init()
  }, [isAdmin])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return items.filter(m => {
      if (q && !`${m.first_name ?? ''} ${m.last_name ?? ''} ${m.title}`.toLowerCase().includes(ql)) return false
      if (filterAthlete && String(m.athlete_id) !== String(filterAthlete)) return false
      if (filterPhase && m.ftem_phase !== filterPhase) return false
      return true
    })
  }, [items, q, filterAthlete, filterPhase])

  const hasFilters = q || filterAthlete || filterPhase

  function clearFilters() {
    setQ(''); setFilterAthlete(''); setFilterPhase('')
  }

  const grouped = useMemo(() => {
    const map = new Map()
    for (const m of filtered) {
      if (!m.achieved_at) continue
      const key = monthKey(m.achieved_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(m)
    }
    return [...map.entries()]
  }, [filtered])

  async function handleDelete(id) {
    try {
      await api.delete(`/milestones/${id}`)
      setItems(p => p.filter(x => x.id !== id))
      toast.success('Milestone deleted.')
    } catch {
      toast.error('Failed to delete milestone.')
    }
  }

  async function handleTogglePublic(id, value) {
    const item = items.find(m => m.id === id)
    if (!item) return
    try {
      await api.put(`/milestones/${id}`, {
        athlete_id:            item.athlete_id,
        title:                 item.title,
        description:           item.description,
        ftem_phase:            item.ftem_phase,
        achieved_at:           item.achieved_at,
        is_shared_with_parent: value,
      })
      setItems(p => p.map(m => m.id === id ? { ...m, is_shared_with_parent: value } : m))
      toast.success(value ? 'Now showing on public profile' : 'Removed from public profile')
    } catch {
      toast.error('Failed to update milestone.')
    }
  }

  async function handleSaved() {
    setShowModal(false)
    await fetchMilestones()
  }

  const totalAthletesCount = athleteCount(items)
  const subtitle = items.length === 0
    ? 'No milestones yet'
    : `${items.length} milestone${items.length !== 1 ? 's' : ''} across ${totalAthletesCount} athlete${totalAthletesCount !== 1 ? 's' : ''}`

  const selectCls =
    'h-11 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer'

  // Phase breakdown for athlete — shows their own phases
  const myPhases = useMemo(() => {
    if (isAdmin) return []
    const counts = {}
    for (const m of items) {
      if (m.ftem_phase) counts[m.ftem_phase] = (counts[m.ftem_phase] || 0) + 1
    }
    return Object.entries(counts)
  }, [items, isAdmin])

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2 md:px-8 md:pt-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Milestones</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {/* Desktop add button */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="hidden md:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <Plus className="h-4 w-4" /> Add milestone
          </button>
        )}
      </div>

      {/* Athlete: phase summary strip */}
      {!isAdmin && myPhases.length > 0 && (
        <div className="px-4 md:px-8 mb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {myPhases.map(([phase, count]) => {
              const meta = FTEM_PHASES[phase]
              return (
                <div key={phase} className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 border ${meta?.color ?? 'bg-slate-50 border-slate-200'}`}>
                  <Trophy className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{phase}</span>
                  <span className="text-xs font-black">{count}</span>
                </div>
              )
            })}
            <div className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 border bg-slate-50 border-slate-100`}>
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-bold text-slate-600">{items.length} total</span>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 max-w-3xl mx-auto">
        {/* ── Filters — horizontal scroll on mobile ── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-none">
          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search…"
              className="h-11 w-44 md:w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Athlete filter */}
          {isAdmin && (
            <div className="relative shrink-0">
              <select
                value={filterAthlete}
                onChange={e => setFilterAthlete(e.target.value)}
                className={selectCls}
              >
                <option value="">All athletes</option>
                {athletes.map(a => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}

          {/* Phase filter */}
          <div className="relative shrink-0">
            <select
              value={filterPhase}
              onChange={e => setFilterPhase(e.target.value)}
              className={selectCls}
            >
              <option value="">All phases</option>
              {Object.entries(FTEM_PHASES).map(([k, v]) => (
                <option key={k} value={k}>{k} — {v.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="shrink-0 flex items-center gap-1.5 h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 bg-white">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-amber-300" />
            </div>
            {isAdmin ? (
              <>
                <p className="font-bold text-slate-500 text-base mb-1">
                  {hasFilters ? 'No milestones match your filters' : 'No milestones recorded yet'}
                </p>
                <p className="text-sm text-slate-400">
                  {hasFilters ? 'Try adjusting your search or filters.' : 'Start celebrating your athletes\' achievements.'}
                </p>
                {!hasFilters && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-5 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20 min-h-[44px]"
                  >
                    <Plus className="h-4 w-4" /> Record first milestone
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-slate-500 text-base mb-1">No milestones yet</p>
                <p className="text-sm text-slate-400">Keep training — your coach will celebrate your progress here.</p>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-emerald-600 font-semibold">
                  <Zap className="h-3.5 w-3.5" /> Keep going!
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {grouped.map(([key, milestones]) => (
              <MonthGroup
                key={key}
                monthKey={key}
                milestones={milestones}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onTogglePublic={handleTogglePublic}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB — sits above the 64px bottom nav + safe area */}
      {isAdmin && (
        <button
          onClick={() => setShowModal(true)}
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
          className="md:hidden fixed right-4 z-20 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all"
          aria-label="Add milestone"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <AddMilestoneModal
          athletes={athletes}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
