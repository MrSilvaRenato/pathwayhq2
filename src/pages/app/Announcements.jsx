import { useState, useEffect } from 'react'
import { Plus, X, Megaphone, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

function fmtDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Announcement card ─────────────────────────────────────────────────────────
function AnnouncementCard({ a, isAdmin, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const bodyTrimmed = a.body && a.body.length > 180 && !expanded ? a.body.slice(0, 180).trimEnd() + '…' : a.body

  function handleDeleteClick() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete(a.id)
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
      {/* Colored left border accent */}
      <div className="flex">
        <div className="w-1 shrink-0 bg-emerald-500 rounded-l-2xl" />
        <div className="flex-1 p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 leading-snug">{a.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {a.author_name && <span className="font-medium text-slate-500">{a.author_name} · </span>}
                {fmtDate(a.created_at)}
              </p>
            </div>
            {isAdmin && (
              <div className="shrink-0 flex items-center gap-1">
                {confirmDelete ? (
                  <>
                    <button
                      onClick={handleDeleteClick}
                      className="rounded-lg bg-red-500 hover:bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors min-h-[36px]">
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors min-h-[36px]">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleDeleteClick}
                    title="Delete announcement"
                    className="rounded-lg p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {a.body && (
            <div className="mt-3">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{bodyTrimmed}</p>
              {a.body.length > 180 && (
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  {expanded ? (
                    <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                  ) : (
                    <><ChevronDown className="h-3.5 w-3.5" /> Read more</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── New post modal / bottom sheet ─────────────────────────────────────────────
function PostModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', body: '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Bottom sheet on mobile, centered modal on sm+ */}
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl p-6 pb-8 sm:pb-6 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        {/* Handle bar (mobile only) */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900">New announcement</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Title</label>
            <input
              required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g. Season kick-off information"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Message</label>
            <textarea
              required
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Write your message here…"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50 min-h-[44px]">
              {saving ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Announcements() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [items, setItems]         = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    api.get('/announcements')
      .then(r => setItems(r.data ?? []))
      .catch(() => {
        setLoadError(true)
        toast.error('Failed to load announcements')
      })
  }, [])

  async function handleAdd(form) {
    try {
      await api.post('/announcements', form)
      const { data } = await api.get('/announcements')
      setItems(data ?? [])
      setShowModal(false)
      toast.success('Announcement posted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to post announcement')
      throw err
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/announcements/${id}`)
      setItems(p => p.filter(a => a.id !== id))
      toast.success('Announcement deleted')
    } catch {
      toast.error('Failed to delete announcement')
    }
  }

  return (
    <div className="px-4 py-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">Announcements</h1>
        {/* Desktop "New post" button — hidden on mobile (FAB used instead) */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> New post
          </button>
        )}
      </div>

      {/* Content */}
      {loadError ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-sm">Could not load announcements. Please try again.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-4">
            <Megaphone className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-bold text-slate-500 text-base">No announcements yet</p>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin ? 'Post your first announcement to notify your club.' : 'Your club hasn\'t posted any announcements yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors">
              <Plus className="h-4 w-4" /> Write first post
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <AnnouncementCard
              key={a.id}
              a={a}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* FAB — admin, mobile only */}
      {isAdmin && (
        <button
          onClick={() => setShowModal(true)}
          className="sm:hidden fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/30 transition-all text-white">
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Modal / bottom sheet */}
      {showModal && (
        <PostModal
          onClose={() => setShowModal(false)}
          onSave={handleAdd}
        />
      )}
    </div>
  )
}
