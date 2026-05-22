import { useState, useEffect } from 'react'
import { Plus, X, Pencil, Trash2, Trophy, Image, Loader2, Globe, GlobeLock } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const CATEGORIES = [
  { value: 'competition',  label: 'Competition',  emoji: '🏆', desc: 'League titles, cups, tournaments' },
  { value: 'award',        label: 'Award',         emoji: '⭐', desc: 'Club of the year, recognition' },
  { value: 'sponsorship',  label: 'Sponsorship',   emoji: '🤝', desc: 'Sponsors, partnerships, deals' },
  { value: 'facility',     label: 'Facility',      emoji: '🏗️', desc: 'Renovations, new grounds, upgrades' },
  { value: 'milestone',    label: 'Club Milestone', emoji: '🎯', desc: 'Membership targets, goals achieved' },
  { value: 'other',        label: 'Other',          emoji: '📌', desc: 'Anything else worth celebrating' },
]

const catMeta = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[CATEGORIES.length - 1]

const CARD_COLORS = {
  competition: 'border-amber-200 bg-amber-50',
  award:       'border-yellow-200 bg-yellow-50',
  sponsorship: 'border-blue-200 bg-blue-50',
  facility:    'border-slate-200 bg-slate-50',
  milestone:   'border-emerald-200 bg-emerald-50',
  other:       'border-slate-200 bg-white',
}

const BLANK = {
  title: '', description: '', category: 'competition',
  achieved_at: '', image_url: '', is_public: true,
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

function TrophyCard({ trophy, isAdmin, onEdit, onDelete, onTogglePublic }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling]           = useState(false)
  const cat = catMeta(trophy.category)

  async function handleToggle() {
    setToggling(true)
    await onTogglePublic(trophy.id, !trophy.is_public)
    setToggling(false)
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${CARD_COLORS[trophy.category] || CARD_COLORS.other} transition-shadow hover:shadow-md`}>
      {trophy.image_url && (
        <img src={trophy.image_url} alt={trophy.title} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{cat.emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{cat.label}</span>
          </div>
          {isAdmin && !confirmDelete && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleToggle}
                disabled={toggling}
                title={trophy.is_public ? 'Remove from public profile' : 'Show on public profile'}
                className={`h-7 px-2 flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-colors ${
                  trophy.is_public
                    ? 'bg-emerald-100 border border-emerald-200 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                {toggling ? <Loader2 className="h-3 w-3 animate-spin" /> : trophy.is_public ? <><Globe className="h-3 w-3" /> Public</> : <><GlobeLock className="h-3 w-3" /> Private</>}
              </button>
              <button onClick={() => onEdit(trophy)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(true)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <h3 className="font-black text-slate-900 text-base leading-snug mb-1">{trophy.title}</h3>
        {trophy.description && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{trophy.description}</p>
        )}
        {trophy.achieved_at && (
          <p className="text-xs text-slate-400 font-semibold mt-2">{fmtDate(trophy.achieved_at)}</p>
        )}

        {isAdmin && confirmDelete && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-red-700 flex-1">Delete this trophy?</span>
            <button onClick={() => setConfirmDelete(false)} className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200">No</button>
            <button onClick={() => onDelete(trophy.id)} className="h-8 px-3 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-400">Yes</button>
          </div>
        )}
      </div>
    </div>
  )
}

function TrophyModal({ trophy, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm]       = useState(trophy ? { ...trophy, achieved_at: trophy.achieved_at?.slice(0, 7) || '' } : { ...BLANK })
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const isEdit = !!trophy

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('image', file)
    fd.append('folder', 'trophies')
    try {
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(p => ({ ...p, image_url: data.url }))
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      achieved_at: form.achieved_at ? form.achieved_at + '-01' : null,
    }
    try {
      if (isEdit) {
        await api.put(`/club-trophies/${trophy.id}`, payload)
      } else {
        await api.post('/club-trophies', payload)
      }
      toast.success(isEdit ? 'Trophy updated' : 'Trophy added!')
      onSaved()
    } catch {
      toast.error('Failed to save')
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full md:max-w-lg md:rounded-2xl bg-white md:shadow-2xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-black text-slate-900">{isEdit ? 'Edit trophy' : 'Add club achievement'}</h2>
          <button onClick={onClose} className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form onSubmit={handleSubmit} id="trophy-form" className="space-y-4">
            {/* Category picker */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-2 block">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, category: c.value }))}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      form.category === c.value
                        ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg shrink-0">{c.emoji}</span>
                    <span className="text-xs font-semibold text-slate-700">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Title *</label>
              <input required value={form.title} onChange={set('title')} className={inputCls} placeholder="e.g. State League Champions 2024" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                className={inputCls}
                placeholder="Tell the story of this achievement…"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Month & Year</label>
              <input
                type="month"
                value={form.achieved_at}
                onChange={set('achieved_at')}
                className={inputCls}
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-2 block">Photo</label>
              {form.image_url ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={form.image_url} alt="" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, image_url: '' }))}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors h-28 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  {uploading ? <Loader2 className="h-6 w-6 text-slate-400 animate-spin" /> : <Image className="h-6 w-6 text-slate-400" />}
                  <span className="text-xs font-semibold text-slate-400">{uploading ? 'Uploading…' : 'Click to upload photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))}
                className="h-4 w-4 mt-0.5 accent-emerald-500 rounded shrink-0"
              />
              <div>
                <span className="text-sm font-semibold text-slate-700">Show on public club profile</span>
                <p className="text-xs text-slate-400 mt-0.5">Displays in your club's trophy cabinet for visitors to see</p>
              </div>
            </label>
          </form>
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]">Cancel</button>
          <button type="submit" form="trophy-form" disabled={saving} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 min-h-[44px]">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add to cabinet'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClubTrophies() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [trophies, setTrophies] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)

  async function load() {
    try {
      const { data } = await api.get('/club-trophies')
      setTrophies(data)
    } catch {
      toast.error('Failed to load trophies')
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    try {
      await api.delete(`/club-trophies/${id}`)
      setTrophies(p => p.filter(t => t.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function handleTogglePublic(id, value) {
    const t = trophies.find(x => x.id === id)
    if (!t) return
    try {
      await api.put(`/club-trophies/${id}`, { ...t, is_public: value, achieved_at: t.achieved_at?.slice(0, 7) || null })
      setTrophies(p => p.map(x => x.id === id ? { ...x, is_public: value } : x))
      toast.success(value ? 'Now public' : 'Set to private')
    } catch {
      toast.error('Failed to update')
    }
  }

  async function handleSaved() {
    setShowModal(false)
    setEditing(null)
    await load()
  }

  const grouped = CATEGORIES.map(c => ({
    ...c,
    items: trophies.filter(t => t.category === c.value),
  })).filter(g => g.items.length > 0)

  return (
    <div className="pb-24 md:pb-8">
      <div className="flex items-start justify-between px-4 pt-4 pb-2 md:px-8 md:pt-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Trophy Cabinet</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {trophies.length} achievement{trophies.length !== 1 ? 's' : ''} · club history
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="hidden md:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" /> Add achievement
          </button>
        )}
      </div>

      <div className="px-4 md:px-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : trophies.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
            <div className="text-5xl mb-4">🏆</div>
            <p className="font-bold text-slate-500 text-lg mb-1">No achievements yet</p>
            <p className="text-sm text-slate-400 mb-6">Add competition wins, sponsorships, facility upgrades and more.</p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Plus className="h-4 w-4" /> Add first achievement
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(group => (
              <div key={group.value}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{group.emoji}</span>
                  <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">{group.label}</h2>
                  <span className="text-xs text-slate-400 font-semibold">({group.items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map(t => (
                    <TrophyCard
                      key={t.id}
                      trophy={t}
                      isAdmin={isAdmin}
                      onEdit={t => { setEditing(t); setShowModal(true) }}
                      onDelete={handleDelete}
                      onTogglePublic={handleTogglePublic}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {isAdmin && (
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="md:hidden fixed bottom-20 right-4 z-20 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-colors"
          aria-label="Add achievement"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      )}

      {showModal && (
        <TrophyModal
          trophy={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
