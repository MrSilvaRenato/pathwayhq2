import { useState, useEffect, useRef } from 'react'
import {
  Plus, X, Megaphone, Trash2, Pencil, Pin, PinOff,
  ImageIcon, ChevronDown, ChevronUp, CheckCircle2,
} from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import ImageUpload from '../../components/ImageUpload'

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORIES = {
  match:    { label: 'Match Day',   emoji: '⚽', gradient: 'from-emerald-600 to-teal-500',   badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',   header: 'bg-gradient-to-br from-emerald-600 to-teal-500'   },
  training: { label: 'Training',    emoji: '💪', gradient: 'from-blue-600 to-blue-400',       badge: 'bg-blue-100 text-blue-700 border-blue-200',             header: 'bg-gradient-to-br from-blue-600 to-blue-400'       },
  news:     { label: 'Club News',   emoji: '📰', gradient: 'from-purple-600 to-violet-500',   badge: 'bg-purple-100 text-purple-700 border-purple-200',       header: 'bg-gradient-to-br from-purple-600 to-violet-500'   },
  camp:     { label: 'Camp / Trip', emoji: '🏕️', gradient: 'from-amber-500 to-orange-400',    badge: 'bg-amber-100 text-amber-700 border-amber-200',          header: 'bg-gradient-to-br from-amber-500 to-orange-400'    },
  urgent:   { label: 'Urgent',      emoji: '🚨', gradient: 'from-red-600 to-rose-500',        badge: 'bg-red-100 text-red-700 border-red-200',                header: 'bg-gradient-to-br from-red-600 to-rose-500'        },
  general:  { label: 'General',     emoji: '📢', gradient: 'from-slate-600 to-slate-500',     badge: 'bg-slate-100 text-slate-600 border-slate-200',          header: 'bg-gradient-to-br from-slate-600 to-slate-500'     },
}

const QUICK_EMOJIS = [
  '⚽','🏆','🥇','💪','🔥','🎯','🎉','🌟',
  '🏃','👊','🏅','🎊','📢','🚨','🏕️','📰',
  '👏','✅','❤️','⚡','🤝','💬','📅','🎽',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return `${diffDays} days ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: diffDays > 365 ? 'numeric' : undefined })
}

// ─── Announcement Card ────────────────────────────────────────────────────────
function AnnouncementCard({ a, isAdmin, onDelete, onEdit, onTogglePin }) {
  const [expanded, setExpanded]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imgError, setImgError]       = useState(false)

  const cat      = CATEGORIES[a.category] || CATEGORIES.general
  const emoji    = a.emoji || cat.emoji
  const hasBigHero = (a.image_url && !imgError) || a.category === 'match' || a.category === 'urgent'
  const BODY_LIMIT = 300
  const bodyLong = a.body && a.body.length > BODY_LIMIT
  const bodyText = bodyLong && !expanded ? a.body.slice(0, BODY_LIMIT).trimEnd() + '…' : a.body

  return (
    <article className={`rounded-3xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md ${
      a.pinned ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-100 bg-white'
    } bg-white`}>

      {/* ── Hero section ── */}
      {a.image_url && !imgError ? (
        <div className="relative h-52 sm:h-64 overflow-hidden">
          <img
            src={a.image_url}
            alt={a.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Category + pin badge over image */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-sm bg-white/20 text-white border-white/30`}>
              {emoji} {cat.label}
            </span>
            {a.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-white text-xs font-bold px-2.5 py-1">
                <Pin className="h-3 w-3" /> Pinned
              </span>
            )}
          </div>
          {/* Admin actions over image */}
          {isAdmin && (
            <div className="absolute top-3 right-3 flex gap-1.5">
              <button onClick={() => onTogglePin(a)} title={a.pinned ? 'Unpin' : 'Pin'}
                className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white flex items-center justify-center transition-colors">
                {a.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
              <button onClick={() => onEdit(a)}
                className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white flex items-center justify-center transition-colors">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="h-9 w-9 rounded-xl bg-red-500/60 backdrop-blur-sm hover:bg-red-500 text-white flex items-center justify-center transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
          {/* Title over image */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <h2 className="text-xl font-black text-white leading-tight drop-shadow-sm">{a.title}</h2>
            <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
              {a.author_name && <span>{a.author_name} ·</span>}
              {fmtDate(a.posted_at || a.created_at)}
            </p>
          </div>
        </div>
      ) : (
        /* No image — coloured header block for featured categories */
        hasBigHero ? (
          <div className={`${cat.header} relative px-5 pt-5 pb-6`}>
            {/* Decorative circles */}
            <div className="absolute right-4 top-2 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-10 top-8 h-10 w-10 rounded-full bg-white/10" />
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 relative">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {emoji} {cat.label}
                </span>
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-white text-xs font-bold px-2.5 py-1">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-1.5">
                  <button onClick={() => onTogglePin(a)} title={a.pinned ? 'Unpin' : 'Pin'}
                    className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors">
                    {a.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => onEdit(a)}
                    className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setConfirmDelete(true)}
                    className="h-8 w-8 rounded-lg bg-red-400/60 hover:bg-red-400 text-white flex items-center justify-center transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {/* Big emoji + title */}
            <div className="mt-4">
              <span className="text-5xl leading-none">{emoji}</span>
              <h2 className="mt-2 text-2xl font-black text-white leading-tight">{a.title}</h2>
              <p className="text-xs text-white/60 mt-1 flex items-center gap-1.5">
                {a.author_name && <span>{a.author_name} ·</span>}
                {fmtDate(a.posted_at || a.created_at)}
              </p>
            </div>
          </div>
        ) : (
          /* Simple card header */
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-2xl leading-none shrink-0 mt-0.5">{emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cat.badge}`}>
                    {cat.label}
                  </span>
                  {a.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5">
                      <Pin className="h-2.5 w-2.5" /> Pinned
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 font-black text-slate-900 text-lg leading-tight">{a.title}</h2>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onTogglePin(a)} title={a.pinned ? 'Unpin' : 'Pin'}
                  className="h-9 w-9 rounded-xl text-slate-300 hover:text-amber-500 hover:bg-amber-50 flex items-center justify-center transition-colors">
                  {a.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </button>
                <button onClick={() => onEdit(a)}
                  className="h-9 w-9 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirmDelete(true)}
                  className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Body ── */}
      <div className="px-5 pb-5">
        {/* Author/date for image-less simple cards */}
        {!hasBigHero && !(a.image_url && !imgError) && (
          <p className="text-xs text-slate-400 mt-1 mb-3 flex items-center gap-1.5">
            {a.author_name && <><span className="font-medium text-slate-500">{a.author_name}</span> ·</>}
            {fmtDate(a.posted_at || a.created_at)}
          </p>
        )}
        {/* Body for hero cards needs top margin */}
        {(hasBigHero || (a.image_url && !imgError)) && <div className="mt-4" />}

        {a.body && (
          <>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{bodyText}</p>
            {bodyLong && (
              <button onClick={() => setExpanded(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Read more</>}
              </button>
            )}
          </>
        )}

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 rounded-2xl px-4 py-3 border border-red-100">
            <span className="text-xs font-semibold text-red-700 flex-1">Delete this post?</span>
            <button onClick={() => setConfirmDelete(false)}
              className="h-9 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={() => onDelete(a.id)}
              className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all">
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

// ─── Compose / Edit modal ─────────────────────────────────────────────────────
const BLANK = { title: '', body: '', category: 'general', emoji: '', image_url: '', pinned: false }

function ComposeModal({ initial, onClose, onSave }) {
  const [form, setForm]         = useState(initial ?? { ...BLANK })
  const [saving, setSaving]     = useState(false)
  const [showImage, setShowImage] = useState(!!(initial?.image_url))
  const [showEmoji, setShowEmoji] = useState(false)
  const titleRef = useRef(null)
  const isEditing = !!initial

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 80) }, [])

  const cat = CATEGORIES[form.category] || CATEGORIES.general
  const displayEmoji = form.emoji || cat.emoji

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        ...form,
        emoji:     form.emoji || null,
        image_url: form.image_url || null,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-h-[44px]'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full md:max-w-lg bg-white md:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[95vh]">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">{isEditing ? 'Edit post' : 'New announcement'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Share news with your club members</p>
          </div>
          <button onClick={onClose}
            className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── Category picker ── */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORIES).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, category: key }))}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left border-2 transition-all text-sm font-semibold ${
                    form.category === key
                      ? `border-emerald-400 bg-emerald-50 text-emerald-700`
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg leading-none">{meta.emoji}</span>
                  <span className="text-xs leading-tight">{meta.label}</span>
                  {form.category === key && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-emerald-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── Emoji override ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emoji</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{displayEmoji}</span>
                <button type="button" onClick={() => setShowEmoji(v => !v)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  {showEmoji ? 'Close' : 'Change'}
                </button>
                {form.emoji && (
                  <button type="button" onClick={() => setForm(p => ({ ...p, emoji: '' }))}
                    className="text-xs text-slate-400 hover:text-slate-600">
                    Reset
                  </button>
                )}
              </div>
            </div>
            {showEmoji && (
              <div className="grid grid-cols-8 gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {QUICK_EMOJIS.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => { setForm(p => ({ ...p, emoji: em })); setShowEmoji(false) }}
                    className={`h-10 w-10 flex items-center justify-center rounded-lg text-xl hover:bg-white hover:shadow-sm transition-all ${form.emoji === em ? 'bg-emerald-100 ring-2 ring-emerald-400' : ''}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Title ── */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Title</label>
            <input
              ref={titleRef}
              required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={inputCls}
              placeholder='e.g. "Match Day vs North Shore FC 🔥"'
            />
          </div>

          {/* ── Body ── */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Message</label>
            <textarea
              required
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white"
              placeholder="Write your announcement here… Share details, hype up the team, or give an update."
            />
          </div>

          {/* ── Image URL ── */}
          <div>
            <button
              type="button"
              onClick={() => setShowImage(v => !v)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
              <ImageIcon className="h-4 w-4" />
              {showImage ? 'Remove image' : 'Add hero image'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showImage ? 'rotate-180' : ''}`} />
            </button>
            {showImage && (
              <div className="mt-2">
                <ImageUpload
                  type="announcement"
                  value={form.image_url || null}
                  onChange={url => setForm(p => ({ ...p, image_url: url ?? '' }))}
                  previewClass="h-40 rounded-xl"
                />
              </div>
            )}
          </div>

          {/* ── Pin toggle ── */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setForm(p => ({ ...p, pinned: !p.pinned }))}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.pinned ? 'bg-amber-400' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.pinned ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-amber-500" /> Pin to top
              </p>
              <p className="text-xs text-slate-400">Pinned posts always appear first</p>
            </div>
          </label>

          {/* ── Live preview card ── */}
          {(form.title || form.body) && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preview</p>
              <div className={`rounded-2xl overflow-hidden border ${form.pinned ? 'border-amber-300' : 'border-slate-100'}`}>
                {/* Mini hero */}
                <div className={`${cat.header} px-4 py-4 relative overflow-hidden`}>
                  <div className="absolute right-2 top-1 h-12 w-12 rounded-full bg-white/10" />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider border border-white/30 rounded-full px-2 py-0.5">{cat.label}</span>
                    {form.pinned && <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5"><Pin className="h-2.5 w-2.5" /> Pinned</span>}
                  </div>
                  <span className="text-3xl">{displayEmoji}</span>
                  <p className="font-black text-white text-sm mt-1 leading-tight line-clamp-2">{form.title || 'Your title…'}</p>
                </div>
                {form.body && (
                  <div className="px-4 py-3 bg-white">
                    <p className="text-xs text-slate-500 line-clamp-2">{form.body}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 flex gap-3"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim() || !form.body.trim()}
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all min-h-[44px] shadow-lg shadow-emerald-500/20">
            {saving ? 'Posting…' : isEditing ? 'Save changes' : '📣 Post announcement'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Announcements() {
  const { isAdmin } = useAuth()
  const toast = useToast()

  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [filter, setFilter]       = useState('all')

  async function load() {
    try {
      const { data } = await api.get('/announcements')
      setItems(data ?? [])
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(form) {
    try {
      if (editItem) {
        await api.put(`/announcements/${editItem.id}`, form)
        toast.success('Post updated')
      } else {
        await api.post('/announcements', form)
        toast.success('Announcement posted! 📣')
      }
      await load()
      setShowModal(false)
      setEditItem(null)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save')
      throw err
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/announcements/${id}`)
      setItems(p => p.filter(a => a.id !== id))
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function handleTogglePin(a) {
    try {
      await api.put(`/announcements/${a.id}`, {
        title: a.title, body: a.body,
        category: a.category, emoji: a.emoji,
        image_url: a.image_url, pinned: !a.pinned,
      })
      setItems(p => p.map(x => x.id === a.id ? { ...x, pinned: !x.pinned } : x)
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)))
      toast.success(a.pinned ? 'Unpinned' : 'Pinned to top 📌')
    } catch {
      toast.error('Failed to update pin')
    }
  }

  function openEdit(a) {
    setEditItem(a)
    setShowModal(true)
  }

  // Filter tabs
  const FILTERS = [
    { key: 'all',      label: 'All' },
    { key: 'match',    label: '⚽ Match Day' },
    { key: 'training', label: '💪 Training' },
    { key: 'news',     label: '📰 Club News' },
    { key: 'camp',     label: '🏕️ Camp' },
    { key: 'urgent',   label: '🚨 Urgent' },
    { key: 'general',  label: '📢 General' },
  ]

  const visible = filter === 'all' ? items : items.filter(a => a.category === filter)

  return (
    <div className="pb-24 md:pb-12">
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-2 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-400 mt-0.5">{items.length} post{items.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> New post
          </button>
        )}
      </div>

      {/* ── Filter chips ── */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 md:px-8 pb-2 pt-1 scrollbar-none -mx-0">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border ${
                filter === f.key
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-4 md:px-8 mt-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-3xl bg-slate-100 animate-pulse h-52" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-white">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-500 text-base">
              {filter !== 'all' ? `No ${CATEGORIES[filter]?.label ?? filter} posts yet` : 'No announcements yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {isAdmin
                ? 'Post your first announcement to keep the club in the loop.'
                : 'Your club hasn\'t posted anything yet — check back soon!'}
            </p>
            {isAdmin && filter === 'all' && (
              <button
                onClick={() => { setEditItem(null); setShowModal(true) }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-5 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20">
                <Plus className="h-4 w-4" /> Write first post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map(a => (
              <AnnouncementCard
                key={a.id}
                a={a}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onEdit={openEdit}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile FAB ── */}
      {isAdmin && (
        <button
          onClick={() => { setEditItem(null); setShowModal(true) }}
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
          className="sm:hidden fixed right-4 z-20 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all text-white">
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* ── Compose / Edit modal ── */}
      {showModal && (
        <ComposeModal
          initial={editItem ? {
            title:     editItem.title,
            body:      editItem.body,
            category:  editItem.category || 'general',
            emoji:     editItem.emoji    || '',
            image_url: editItem.image_url || '',
            pinned:    editItem.pinned   || false,
          } : null}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
