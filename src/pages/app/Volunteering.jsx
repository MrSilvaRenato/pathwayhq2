import { useState, useEffect } from 'react'
import { Plus, X, HandHeart, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export default function Volunteering() {
  const { isAdmin } = useAuth()
  const [items, setItems]         = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', date: '', spots: 1 })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/volunteering').then(r => setItems(r.data))
  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    await api.post('/volunteering', form); await load()
    setShowModal(false); setSaving(false)
    setForm({ title: '', description: '', date: '', spots: 1 })
  }

  async function toggleSignup(item) {
    if (item.i_signed_up) {
      await api.delete(`/volunteering/${item.id}/signup`)
    } else {
      await api.post(`/volunteering/${item.id}/signup`)
    }
    load()
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">Volunteering</h1>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors">
            <Plus className="h-4 w-4" /> Add opportunity
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <HandHeart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No volunteering opportunities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(v => (
            <div key={v.id} className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-bold text-slate-900">{v.title}</h2>
                  {v.description && <p className="text-sm text-slate-500 mt-1">{v.description}</p>}
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                    {v.date && <span>📅 {new Date(v.date).toLocaleDateString('en-AU', { dateStyle:'medium' })}</span>}
                    <span>{v.signed_up}/{v.spots} spots filled</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleSignup(v)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                      v.i_signed_up ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                    }`}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    {v.i_signed_up ? 'Signed up' : 'Sign up'}
                  </button>
                  {isAdmin && <button onClick={async () => { await api.delete(`/volunteering/${v.id}`); load() }} className="text-slate-300 hover:text-red-400 transition-colors"><X className="h-4 w-4" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">Add opportunity</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label><input required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Date</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Spots</label><input type="number" min="1" value={form.spots} onChange={e=>setForm(p=>({...p,spots:+e.target.value}))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
