import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Trophy, Search } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'

export default function Milestones() {
  const { isAdmin } = useAuth()
  const [items,    setItems]    = useState([])
  const [athletes, setAthletes] = useState([])
  const [q, setQ]               = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ athlete_id:'', title:'', description:'', ftem_phase:'F1', achieved_at:'', is_shared_with_parent:false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/milestones').then(r => setItems(r.data))
    api.get('/athletes').then(r => setAthletes(r.data))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return q ? items.filter(m => `${m.first_name} ${m.last_name} ${m.title}`.toLowerCase().includes(ql)) : items
  }, [items, q])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    await api.post('/milestones', form)
    const { data } = await api.get('/milestones')
    setItems(data); setShowModal(false); setSaving(false)
    setForm({ athlete_id:'', title:'', description:'', ftem_phase:'F1', achieved_at:'', is_shared_with_parent:false })
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-slate-900">Milestones</h1><p className="text-sm text-slate-500 mt-0.5">{items.length} recorded</p></div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> Add milestone
          </button>
        )}
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search milestones…"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No milestones yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(m => (
            <div key={m.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[m.ftem_phase]?.color ?? ''}`}>{m.ftem_phase}</span>
                {isAdmin && <button onClick={async () => { await api.delete(`/milestones/${m.id}`); setItems(p => p.filter(x => x.id !== m.id)) }} className="text-slate-300 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>}
              </div>
              <h2 className="font-bold text-slate-900">{m.title}</h2>
              <p className="text-sm text-slate-600 mt-0.5">{m.first_name} {m.last_name}</p>
              {m.description && <p className="text-xs text-slate-500 mt-2">{m.description}</p>}
              <p className="text-xs text-slate-400 mt-3">{new Date(m.achieved_at).toLocaleDateString('en-AU', { day:'numeric',month:'short',year:'numeric' })}</p>
              {m.is_shared_with_parent ? <span className="mt-2 inline-block text-xs text-emerald-600 font-semibold">Shared with parent</span> : null}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">Add milestone</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Athlete</label>
                <select required value={form.athlete_id} onChange={e=>setForm(p=>({...p,athlete_id:e.target.value}))} className={inputCls}>
                  <option value="">Select athlete…</option>
                  {athletes.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label><input required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">FTEM Phase</label>
                  <select value={form.ftem_phase} onChange={e=>setForm(p=>({...p,ftem_phase:e.target.value}))} className={inputCls}>
                    {Object.keys(FTEM_PHASES).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Date achieved</label><input type="date" required value={form.achieved_at} onChange={e=>setForm(p=>({...p,achieved_at:e.target.value}))} className={inputCls} /></div>
              </div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={2} className={inputCls} /></div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.is_shared_with_parent} onChange={e=>setForm(p=>({...p,is_shared_with_parent:e.target.checked}))} className="rounded accent-emerald-500" />
                Share with parent
              </label>
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
