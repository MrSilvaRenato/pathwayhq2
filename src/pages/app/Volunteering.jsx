import { useState, useEffect, useCallback } from 'react'
import {
  Plus, X, HandHeart, CheckCircle, Users, Calendar,
  MapPin, Loader2, ChevronDown, ChevronUp, Mail, Phone, Trash2,
} from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import UpgradePrompt from '../../components/UpgradePrompt'

const EMPTY_FORM = { title: '', description: '', date: '', spots: 1, location: '' }

// ── Date helpers ──────────────────────────────────────────────────────────────
function fmtRelative(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now   = new Date()
  const diffMs = date - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays > 1 && diffDays <= 14) return `In ${diffDays} days`
  return null
}

function fmtAbsolute(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Spots progress bar ────────────────────────────────────────────────────────
function SpotsBar({ spots, signedUp }) {
  if (!spots) return null
  const pct = Math.min(100, Math.round(((signedUp ?? 0) / spots) * 100))
  const full = pct >= 100
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-500 font-medium">{signedUp ?? 0} / {spots} volunteers</span>
        <span className={`font-bold ${full ? 'text-red-500' : 'text-emerald-600'}`}>
          {full ? 'Full' : `${spots - (signedUp ?? 0)} left`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${full ? 'bg-red-400' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Slide-up drawer for volunteer list (mobile) ───────────────────────────────
function VolunteerDrawer({ v, signups, isLoading, onClose, onRemove }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full rounded-t-3xl bg-white shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Volunteers</p>
            <h3 className="font-bold text-slate-900 mt-0.5 text-sm">{v.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
            </div>
          ) : signups.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">No volunteers yet.</p>
          ) : (
            <div className="space-y-2">
              {signups.map(s => (
                <div key={s.signup_id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {s.full_name}
                      <span className="ml-2 text-xs font-normal text-slate-400 capitalize">{s.role?.replace('_', ' ')}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <a href={`mailto:${s.email}`}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 transition-colors">
                        <Mail className="h-3 w-3" /> {s.email}
                      </a>
                      {s.phone && (
                        <a href={`tel:${s.phone}`}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-600 transition-colors">
                          <Phone className="h-3 w-3 text-slate-400" /> {s.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(s.user_id, s.full_name)}
                    className="shrink-0 rounded-lg p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title={`Remove ${s.full_name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add opportunity modal / bottom sheet ──────────────────────────────────────
function AddModal({ onClose, onSave }) {
  const [form, setForm]   = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[48px]"

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl p-5 pb-8 sm:pb-5">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900">Add opportunity</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={inputCls} placeholder="e.g. Canteen helper" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} className={inputCls + ' min-h-0 h-auto resize-none'} placeholder="What's involved?" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Location</label>
            <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              className={inputCls} placeholder="e.g. Club grounds" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Spots</label>
              <input type="number" min="1" value={form.spots} onChange={e => setForm(p => ({ ...p, spots: +e.target.value }))} className={inputCls} />
            </div>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
            <Users className="h-3 w-3" /> All club members will be notified when you save.
          </p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors min-h-[48px]">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50 min-h-[48px]">
              {saving ? 'Saving…' : 'Add & notify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Volunteer card ────────────────────────────────────────────────────────────
function VolunteerCard({ v, isAdmin, onToggle, onDelete, toggling, expanded, onExpandToggle, onRemoveVolunteer, isPast }) {
  const spotsLeft = v.spots ? v.spots - (v.signed_up ?? 0) : null
  const full      = spotsLeft !== null && spotsLeft <= 0
  const signups   = Array.isArray(expanded) ? expanded : []
  const isLoading = expanded === 'loading'
  const isOpen    = expanded !== undefined
  const relative  = !isPast ? fmtRelative(v.date) : null
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleExpandToggle() {
    if (isAdmin && (v.signed_up ?? 0) > 0) {
      setDrawerOpen(true)
      onExpandToggle(v.id)
    }
  }

  return (
    <div className={`rounded-2xl border bg-white transition-shadow hover:shadow-sm ${v.i_signed_up ? 'border-emerald-200' : 'border-slate-100'}`}>
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Title + badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-slate-900">{v.title}</h2>
              {v.i_signed_up && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  <CheckCircle className="h-3 w-3" /> You're in
                </span>
              )}
            </div>

            {v.description && <p className="text-sm text-slate-500 mt-1">{v.description}</p>}

            {/* Meta row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {v.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {relative && (
                    <span className={`font-semibold mr-0.5 ${relative === 'Today' || relative === 'Tomorrow' ? 'text-amber-600' : 'text-slate-600'}`}>
                      {relative} —
                    </span>
                  )}
                  {fmtAbsolute(v.date)}
                </span>
              )}
              {v.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {v.location}
                </span>
              )}
            </div>

            {/* Spots progress bar */}
            {!isPast && <SpotsBar spots={v.spots} signedUp={v.signed_up} />}

            {/* Admin: view volunteers button */}
            {isAdmin && (v.signed_up ?? 0) > 0 && (
              <button
                onClick={handleExpandToggle}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-600 transition-colors">
                <ChevronDown className="h-3.5 w-3.5" />
                View {v.signed_up} volunteer{v.signed_up !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {!isPast && (
              <button
                onClick={() => onToggle(v)}
                disabled={toggling || (full && !v.i_signed_up)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-40 min-h-[44px] min-w-[100px] ${
                  v.i_signed_up
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-red-50 hover:text-red-600'
                    : full
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-400'
                }`}>
                {toggling
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CheckCircle className="h-4 w-4" />}
                {toggling ? '…' : v.i_signed_up ? 'Cancel' : full ? 'Full' : 'Volunteer'}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onDelete(v.id, v.title)}
                className="rounded-lg p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Remove opportunity">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop inline volunteer list (md+) */}
        {isAdmin && isOpen && (
          <div className="hidden md:block border-t border-slate-100 mt-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Volunteer list</p>
              <button
                onClick={() => onExpandToggle(v.id)}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                <ChevronUp className="h-3.5 w-3.5" /> Hide
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : signups.length === 0 ? (
              <p className="text-sm text-slate-400">No volunteers yet.</p>
            ) : (
              <div className="space-y-2">
                {signups.map(s => (
                  <div key={s.signup_id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {s.full_name}
                        <span className="ml-2 text-xs font-normal text-slate-400 capitalize">{s.role?.replace('_', ' ')}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5">
                        <a href={`mailto:${s.email}`}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 transition-colors">
                          <Mail className="h-3 w-3" /> {s.email}
                        </a>
                        {s.phone && (
                          <a href={`tel:${s.phone}`}
                            className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-600 transition-colors">
                            <Phone className="h-3 w-3 text-slate-400" /> {s.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveVolunteer(v.id, s.user_id, s.full_name)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                      title={`Remove ${s.full_name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile slide-up drawer for volunteer list */}
      {isAdmin && drawerOpen && (
        <div className="md:hidden">
          <VolunteerDrawer
            v={v}
            signups={signups}
            isLoading={isLoading}
            onClose={() => {
              setDrawerOpen(false)
              onExpandToggle(v.id)
            }}
            onRemove={(userId, name) => onRemoveVolunteer(v.id, userId, name)}
          />
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Volunteering() {
  const { isAdmin, user } = useAuth()
  const toast = useToast()
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toggling, setToggling]   = useState({})
  const [expanded, setExpanded]   = useState({})
  const [tab, setTab]             = useState('upcoming') // 'upcoming' | 'past'
  const [upgrade, setUpgrade]     = useState(null)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/volunteering')
      setItems(data)
    } catch {
      toast.error('Failed to load volunteering opportunities')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd(form) {
    try {
      await api.post('/volunteering', form)
      await load()
      setShowModal(false)
      toast.success(`"${form.title}" added — all club members have been notified`)
    } catch (err) {
      const d = err?.response?.data
      if (d?.upgrade_required) {
        setShowModal(false)
        setUpgrade({ message: d.error ?? 'Upgrade to add volunteering opportunities.', requiredPlan: d.required_plan ?? 'pro' })
      } else {
        toast.error(d?.message ?? d?.error ?? 'Failed to save opportunity')
      }
      throw err
    }
  }

  async function toggleSignup(item) {
    setToggling(p => ({ ...p, [item.id]: true }))
    try {
      if (item.i_signed_up) {
        await api.delete(`/volunteering/${item.id}/signup`)
        toast.info(`Signup cancelled for "${item.title}"`)
      } else {
        if (item.spots && item.signed_up >= item.spots) {
          toast.error('No spots remaining')
          return
        }
        await api.post(`/volunteering/${item.id}/signup`)
        toast.success(`You're signed up for "${item.title}"!`)
      }
      await load()
      if (expanded[item.id]) await loadSignups(item.id)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Action failed')
    } finally {
      setToggling(p => { const n = { ...p }; delete n[item.id]; return n })
    }
  }

  async function handleDelete(id, title) {
    if (!confirm(`Remove "${title}"? All signed-up volunteers will be notified.`)) return
    try {
      await api.delete(`/volunteering/${id}`)
      setItems(p => p.filter(v => v.id !== id))
      setExpanded(p => { const n = { ...p }; delete n[id]; return n })
      toast.success(`"${title}" removed — volunteers notified`)
    } catch {
      toast.error('Failed to remove opportunity')
    }
  }

  async function loadSignups(id) {
    setExpanded(p => ({ ...p, [id]: 'loading' }))
    try {
      const { data } = await api.get(`/volunteering/${id}/signups`)
      setExpanded(p => ({ ...p, [id]: data }))
    } catch {
      setExpanded(p => { const n = { ...p }; delete n[id]; return n })
      toast.error('Failed to load volunteer list')
    }
  }

  function toggleExpanded(id) {
    if (expanded[id]) {
      setExpanded(p => { const n = { ...p }; delete n[id]; return n })
    } else {
      loadSignups(id)
    }
  }

  async function removeVolunteer(opportunityId, userId, name) {
    if (!confirm(`Remove ${name} from this opportunity? They will be notified.`)) return
    try {
      await api.delete(`/volunteering/${opportunityId}/volunteers/${userId}`)
      toast.success(`${name} removed and notified`)
      await loadSignups(opportunityId)
      await load()
    } catch {
      toast.error('Failed to remove volunteer')
    }
  }

  const today    = new Date(new Date().setHours(0, 0, 0, 0))
  const upcoming = items.filter(v => !v.date || new Date(v.date) >= today)
  const past     = items.filter(v => v.date  && new Date(v.date)  <  today)
  const displayed = tab === 'upcoming' ? upcoming : past

  return (
    <div className="px-4 py-4 md:p-6 lg:p-8 max-w-3xl mx-auto pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Volunteering</h1>
          <p className="text-sm text-slate-500 mt-0.5">Help out your club — every hand counts</p>
        </div>
        {/* Desktop new button — FAB used on mobile */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> Add opportunity
          </button>
        )}
      </div>

      {/* Upcoming / Past tab switcher */}
      {items.length > 0 && (
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-5 w-fit">
          {[
            { key: 'upcoming', label: `Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}` },
            { key: 'past',     label: `Past${past.length ? ` (${past.length})` : ''}` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-4">
            <HandHeart className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-bold text-slate-500 text-base">No volunteering opportunities yet</p>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin ? 'Add an opportunity to get your community involved.' : 'Your club hasn\'t posted any opportunities yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors">
              <Plus className="h-4 w-4" /> Add first opportunity
            </button>
          )}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm font-medium">No {tab} opportunities</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${tab === 'past' ? 'opacity-70' : ''}`}>
          {displayed.map(v => (
            <VolunteerCard
              key={v.id} v={v} isAdmin={isAdmin}
              onToggle={toggleSignup} onDelete={handleDelete}
              toggling={!!toggling[v.id]}
              expanded={expanded[v.id]}
              onExpandToggle={toggleExpanded}
              onRemoveVolunteer={removeVolunteer}
              isPast={tab === 'past'}
            />
          ))}
        </div>
      )}

      {/* FAB for admin on mobile */}
      {isAdmin && (
        <button
          onClick={() => setShowModal(true)}
          className="sm:hidden fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/30 transition-all text-white">
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Add modal */}
      {showModal && (
        <AddModal
          onClose={() => setShowModal(false)}
          onSave={handleAdd}
        />
      )}

      {/* Upgrade prompt */}
      {upgrade && (
        <UpgradePrompt
          message={upgrade.message}
          requiredPlan={upgrade.requiredPlan}
          onClose={() => setUpgrade(null)}
        />
      )}
    </div>
  )
}
