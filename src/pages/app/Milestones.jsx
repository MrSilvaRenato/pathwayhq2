import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Trophy, Search, ChevronDown, Loader2, Zap, Globe, GlobeLock, Star, Building2 } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import UpgradePrompt from '../../components/UpgradePrompt'

// ─── helpers ────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function yearKey(dateStr) {
  return new Date(dateStr).getFullYear()
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtMonth(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', { month: 'short' })
}

function athleteCount(items) {
  return new Set(items.map(m => m.athlete_id).filter(Boolean)).size
}

function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?'
}

// ─── tier styling ────────────────────────────────────────────────────────────

function tierStyle(phase) {
  if (phase === 'M')                    return { emoji: '🥇', dot: 'bg-amber-400 ring-amber-300',   card: 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50',  badge: 'bg-amber-100 text-amber-700 border-amber-200',  icon: 'bg-amber-100 text-amber-600',  line: 'border-amber-300' }
  if (phase === 'E1' || phase === 'E2') return { emoji: '🥈', dot: 'bg-slate-400 ring-slate-300',   card: 'border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50',    badge: 'bg-slate-100 text-slate-600 border-slate-200',  icon: 'bg-slate-100 text-slate-500',  line: 'border-slate-300' }
  if (phase?.startsWith('T'))           return { emoji: '🥉', dot: 'bg-orange-400 ring-orange-300', card: 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'bg-orange-100 text-orange-600', line: 'border-orange-300' }
  return                                       { emoji: '🏅', dot: 'bg-emerald-400 ring-emerald-300',card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50', badge: 'bg-emerald-100 text-emerald-700 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', line: 'border-emerald-200' }
}

// ─── MilestoneCard ───────────────────────────────────────────────────────────

function MilestoneCard({ m, isAdmin, onDelete, onTogglePublic, isLast }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling]           = useState(false)
  const t = tierStyle(m.ftem_phase)

  async function handleTogglePublic(e) {
    e.stopPropagation()
    setToggling(true)
    await onTogglePublic(m.id, !m.is_shared_with_parent)
    setToggling(false)
  }

  return (
    <div className="flex gap-4 group">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        {/* dot */}
        <div className={`w-4 h-4 rounded-full ring-2 ring-offset-2 shrink-0 mt-3.5 z-10 ${t.dot}`} />
        {/* vertical line */}
        {!isLast && <div className="w-px flex-1 mt-1 border-l-2 border-dashed border-slate-200" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-5 rounded-2xl border shadow-sm hover:shadow-md transition-all ${t.card}`}>
        {/* Date strip */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{fmtDate(m.achieved_at)}</span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${t.badge}`}>{m.ftem_phase}</span>
        </div>

        <div className="px-4 pt-2.5 pb-4">
          <div className="flex items-start gap-3">
            {/* Big trophy emoji */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm ${t.icon}`}>
              {t.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-black text-slate-900 text-base leading-snug">{m.title}</h3>

              {/* Athlete row (admin) */}
              {isAdmin && (m.first_name || m.last_name) && (
                <div className="flex items-center gap-2 mt-1.5">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                      {initials(m.first_name, m.last_name)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-600">{m.first_name} {m.last_name}</span>
                  {m.is_claimed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Linked account" />}
                </div>
              )}

              {/* Club name */}
              {m.club_name && (
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-medium">{m.club_name}</span>
                </div>
              )}

              {/* Description */}
              {m.description && (
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{m.description}</p>
              )}
            </div>

            {/* Actions */}
            {isAdmin && !confirmDelete && (
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button
                  onClick={handleTogglePublic}
                  disabled={toggling}
                  title={m.is_shared_with_parent ? 'Remove from public profile' : 'Show on public profile'}
                  className={`h-7 px-2 flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    m.is_shared_with_parent
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {toggling ? <Loader2 className="h-3 w-3 animate-spin" />
                    : m.is_shared_with_parent ? <><Globe className="h-3 w-3" /> Public</> : <><GlobeLock className="h-3 w-3" /> Private</>}
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="h-7 w-7 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {!isAdmin && m.is_shared_with_parent && (
              <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 whitespace-nowrap">
                Public
              </span>
            )}
          </div>

          {/* Inline delete confirm */}
          {isAdmin && confirmDelete && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
              <span className="text-xs font-semibold text-red-700 flex-1">Delete this milestone?</span>
              <button onClick={() => setConfirmDelete(false)} className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">No</button>
              <button onClick={() => onDelete(m.id)} className="h-8 px-3 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-400 active:scale-95 transition-all min-w-[80px]">Yes, delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Year section ─────────────────────────────────────────────────────────────

function YearGroup({ year, milestones, isAdmin, onDelete, onTogglePublic }) {
  return (
    <div>
      {/* Year marker */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-1.5 shadow-sm">
          <Star className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-sm font-black tracking-wider">{year}</span>
          <span className="text-xs text-slate-400 font-medium">{milestones.length} achievement{milestones.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <div className="pl-2">
        {milestones.map((m, i) => (
          <MilestoneCard
            key={m.id}
            m={m}
            isAdmin={isAdmin}
            onDelete={onDelete}
            onTogglePublic={onTogglePublic}
            isLast={i === milestones.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Add Milestone Modal ──────────────────────────────────────────────────────

const BLANK_FORM = {
  athlete_id: '', title: '', description: '',
  ftem_phase: 'F1', achieved_at: todayISO(), is_shared_with_parent: false,
}

function AddMilestoneModal({ athletes, onClose, onSaved, onUpgrade }) {
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
    setForm(p => ({ ...p, athlete_id: id, ftem_phase: athlete?.ftem_phase ?? p.ftem_phase }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/milestones', form)
      toast.success('Milestone added!')
      onSaved()
    } catch (err) {
      const d = err?.response?.data
      if (d?.upgrade_required) { onClose(); onUpgrade?.({ message: d.error ?? 'Upgrade to record athlete milestones.', requiredPlan: d.required_plan ?? 'pro' }) }
      else { toast.error('Failed to save milestone.'); setSaving(false) }
    }
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-h-[44px]'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full md:max-w-md md:rounded-2xl bg-white md:shadow-2xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">Record achievement</h2>
            <p className="text-xs text-slate-400 mt-0.5">Celebrate a milestone in their journey</p>
          </div>
          <button onClick={onClose} className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-3" id="add-milestone-form">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Athlete</label>
              <select required value={form.athlete_id} onChange={handleAthleteChange} className={inputCls}>
                <option value="">Select athlete…</option>
                {athletes.map(a => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name}{a.squad_names ? ` — ${a.squad_names}` : ''}</option>
                ))}
              </select>
              {selectedAthlete?.ftem_phase && (
                <p className="mt-1 text-xs text-slate-400">Current phase: <span className="font-semibold text-slate-600">{selectedAthlete.ftem_phase} — {FTEM_PHASES[selectedAthlete.ftem_phase]?.label ?? selectedAthlete.ftem_phase}</span></p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Achievement title</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="e.g. First hat-trick, Player of the Season…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">FTEM Phase</label>
                <select value={form.ftem_phase} onChange={e => setForm(p => ({ ...p, ftem_phase: e.target.value }))} className={inputCls}>
                  {Object.entries(FTEM_PHASES).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Date achieved</label>
                <input type="date" required value={form.achieved_at} onChange={e => setForm(p => ({ ...p, achieved_at: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes (optional)</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" placeholder="What made this special?" />
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer select-none min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <input type="checkbox" checked={form.is_shared_with_parent} onChange={e => setForm(p => ({ ...p, is_shared_with_parent: e.target.checked }))} className="rounded accent-emerald-500 h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-700">Show on public athlete profile</span>
                <p className="text-xs text-slate-400 mt-0.5">Displays in the athlete's public trophy cabinet</p>
              </div>
            </label>
          </form>
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]">Cancel</button>
          <button type="submit" form="add-milestone-form" disabled={saving} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors min-h-[44px]">
            {saving ? 'Saving…' : 'Record achievement'}
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

  const [items, setItems]         = useState([])
  const [athletes, setAthletes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [upgrade, setUpgrade]     = useState(null)

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
          setAthletes(data.filter(a => a.invite_status === 'accepted'))
        } catch { /* non-fatal */ }
      }
      setLoading(false)
    }
    init()
  }, [isAdmin])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return items.filter(m => {
      if (q && !`${m.first_name ?? ''} ${m.last_name ?? ''} ${m.title} ${m.club_name ?? ''}`.toLowerCase().includes(ql)) return false
      if (filterAthlete && String(m.athlete_id) !== String(filterAthlete)) return false
      if (filterPhase && m.ftem_phase !== filterPhase) return false
      return true
    })
  }, [items, q, filterAthlete, filterPhase])

  const hasFilters = q || filterAthlete || filterPhase

  const grouped = useMemo(() => {
    const map = new Map()
    for (const m of filtered) {
      if (!m.achieved_at) continue
      const key = yearKey(m.achieved_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(m)
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0])
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
        athlete_id: item.athlete_id, title: item.title, description: item.description,
        ftem_phase: item.ftem_phase, achieved_at: item.achieved_at, is_shared_with_parent: value,
      })
      setItems(p => p.map(m => m.id === id ? { ...m, is_shared_with_parent: value } : m))
      toast.success(value ? 'Now showing on public profile' : 'Removed from public profile')
    } catch {
      toast.error('Failed to update milestone.')
    }
  }

  const totalAthletes = athleteCount(items)
  const phaseCounts   = useMemo(() => {
    const c = {}
    for (const m of items) c[m.ftem_phase] = (c[m.ftem_phase] || 0) + 1
    return c
  }, [items])

  const selectCls = 'h-11 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer'

  return (
    <div className="pb-24 md:pb-8">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-4 md:px-8 md:pt-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Achievement History</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {items.length === 0
                ? 'No achievements recorded yet'
                : `${items.length} milestone${items.length !== 1 ? 's' : ''} across ${totalAthletes} athlete${totalAthletes !== 1 ? 's' : ''}`}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="hidden md:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Plus className="h-4 w-4" /> Record achievement
            </button>
          )}
        </div>

        {/* Phase summary pills */}
        {items.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
            {['M','E2','E1','T2','T1','F2','F1'].filter(p => phaseCounts[p]).map(phase => {
              const t = tierStyle(phase)
              return (
                <button
                  key={phase}
                  onClick={() => setFilterPhase(filterPhase === phase ? '' : phase)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 border text-xs font-bold transition-all ${
                    filterPhase === phase ? 'ring-2 ring-offset-1 ring-emerald-400 ' : ''
                  }${t.badge}`}
                >
                  <span>{t.emoji}</span>
                  <span>{phase}</span>
                  <span className="opacity-60">{phaseCounts[phase]}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 max-w-2xl mx-auto">
        {/* ── Filters ── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="h-11 w-44 md:w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {isAdmin && (
            <div className="relative shrink-0">
              <select value={filterAthlete} onChange={e => setFilterAthlete(e.target.value)} className={selectCls}>
                <option value="">All athletes</option>
                {athletes.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}
          {hasFilters && (
            <button onClick={() => { setQ(''); setFilterAthlete(''); setFilterPhase('') }} className="shrink-0 flex items-center gap-1.5 h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Body ── */}
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
                  {hasFilters ? 'No achievements match your filters' : 'No achievements recorded yet'}
                </p>
                <p className="text-sm text-slate-400">
                  {hasFilters ? 'Try adjusting your search or filters.' : "Start building your athletes' legacy."}
                </p>
                {!hasFilters && (
                  <button onClick={() => setShowModal(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-5 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20 min-h-[44px]">
                    <Plus className="h-4 w-4" /> Record first achievement
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-slate-500 text-base mb-1">Your journey starts here</p>
                <p className="text-sm text-slate-400">Keep training — your coach will celebrate your milestones here.</p>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-emerald-600 font-semibold">
                  <Zap className="h-3.5 w-3.5" /> Keep going!
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {grouped.map(([year, milestones]) => (
              <YearGroup
                key={year}
                year={year}
                milestones={milestones}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onTogglePublic={handleTogglePublic}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {isAdmin && (
        <button
          onClick={() => setShowModal(true)}
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
          className="md:hidden fixed right-4 z-20 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all"
          aria-label="Record achievement"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      )}

      {showModal && (
        <AddMilestoneModal
          athletes={athletes}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchMilestones() }}
          onUpgrade={up => { setShowModal(false); setUpgrade(up) }}
        />
      )}

      {upgrade && (
        <UpgradePrompt message={upgrade.message} requiredPlan={upgrade.requiredPlan} onClose={() => setUpgrade(null)} />
      )}
    </div>
  )
}
