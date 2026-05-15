import { useState, useEffect } from 'react'
import { Plus, Users, Trash2, X } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export default function Squads() {
  const { isAdmin } = useAuth()
  const [squads, setSquads] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/squads').then(r => setSquads(r.data)) }, [])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    const { data } = await api.post('/squads', form)
    setSquads(p => [...p, { ...data, athlete_count: 0 }])
    setShowModal(false); setSaving(false)
    setForm({ name: '', description: '' })
  }

  async function handleDelete(id) {
    if (!confirm('Delete this squad?')) return
    await api.delete(`/squads/${id}`)
    setSquads(p => p.filter(s => s.id !== id))
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Squads</h1>
          <p className="text-sm text-slate-500 mt-0.5">{squads.length} squad{squads.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> New squad
          </button>
        )}
      </div>

      {squads.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No squads yet</p>
          {isAdmin && <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-emerald-600 underline">Create your first squad</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {squads.map(s => (
            <div key={s.id} className="rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-all p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 mb-3">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(s.id)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
              <h2 className="font-bold text-slate-900">{s.name}</h2>
              {s.description && <p className="text-sm text-slate-500 mt-1">{s.description}</p>}
              <p className="text-xs text-slate-400 mt-3">{s.athlete_count} athlete{s.athlete_count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">New squad</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Squad name</label>
                <input required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="U14 Boys" /></div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
