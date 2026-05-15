import { useState, useEffect } from 'react'
import { Plus, X, Megaphone } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export default function Announcements() {
  const { isAdmin } = useAuth()
  const [items, setItems]         = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/announcements').then(r => setItems(r.data)) }, [])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    await api.post('/announcements', form)
    const { data } = await api.get('/announcements')
    setItems(data); setShowModal(false); setSaving(false)
    setForm({ title: '', body: '' })
  }

  async function handleDelete(id) {
    await api.delete(`/announcements/${id}`)
    setItems(p => p.filter(a => a.id !== id))
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">Announcements</h1>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors">
            <Plus className="h-4 w-4" /> New post
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(a => (
            <div key={a.id} className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900">{a.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{a.author_name} · {new Date(a.created_at).toLocaleDateString('en-AU', { day:'numeric',month:'short',year:'numeric' })}</p>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed whitespace-pre-line">{a.body}</p>
                </div>
                {isAdmin && <button onClick={() => handleDelete(a.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0"><X className="h-4 w-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">New announcement</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
                <input required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Message</label>
                <textarea required value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))} rows={5}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Posting…' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
