import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Plus, Users } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function Athletes() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [athletes, setAthletes] = useState([])
  const [squads,   setSquads]   = useState([])
  const [q, setQ]               = useState('')
  const [phase, setPhase]       = useState('')
  const [squadF, setSquadF]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ first_name:'', last_name:'', dob:'', sport:'soccer', gender:'male', ftem_phase:'F1', notes:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/athletes').then(r => setAthletes(r.data))
    api.get('/squads').then(r => setSquads(r.data))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return athletes.filter(a => {
      if (q && !`${a.first_name} ${a.last_name}`.toLowerCase().includes(ql)) return false
      if (phase && a.ftem_phase !== phase) return false
      if (squadF && !(a.squad_ids ?? '').split(',').includes(squadF)) return false
      return true
    })
  }, [athletes, q, phase, squadF])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.post('/athletes', form)
      setAthletes(p => [...p, data])
      setShowModal(false)
      setForm({ first_name:'', last_name:'', dob:'', sport:'soccer', gender:'male', ftem_phase:'F1', notes:'' })
      toast.success(`${form.first_name} ${form.last_name} added successfully`)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to add athlete')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Athletes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{athletes.length} total · {athletes.filter(a=>a.is_active).length} active</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> Add athlete
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search athletes…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          {q && <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <select value={phase} onChange={e => setPhase(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">All phases</option>
          {Object.entries(FTEM_PHASES).map(([k,v]) => <option key={k} value={k}>{k} — {v.label}</option>)}
        </select>
        {squads.length > 0 && (
          <select value={squadF} onChange={e => setSquadF(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All squads</option>
            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <span className="ml-auto self-center text-sm text-slate-400">{filtered.length} of {athletes.length}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No athletes found</p>
          {isAdmin && <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-emerald-600 underline">Add your first athlete</button>}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Phase</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Sport</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Gender</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(a => {
                const sport = SPORTS.find(s => s.value === a.sport)
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link to={`/athletes/${a.id}`} className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors">
                        {a.first_name} {a.last_name}
                      </Link>
                      {a.squad_names && <div className="text-xs text-slate-400 mt-0.5">{a.squad_names}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[a.ftem_phase]?.color ?? ''}`}>{a.ftem_phase}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-500">{sport?.emoji} {sport?.label}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 capitalize">{a.gender}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${a.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <h2 className="text-lg font-black text-slate-900 mb-5">Add athlete</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">First name</label><input required value={form.first_name} onChange={e=>setForm(p=>({...p,first_name:e.target.value}))} className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Last name</label><input required value={form.last_name} onChange={e=>setForm(p=>({...p,last_name:e.target.value}))} className={inputCls} /></div>
              </div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Date of birth</label><input type="date" value={form.dob} onChange={e=>setForm(p=>({...p,dob:e.target.value}))} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Gender</label>
                  <select value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))} className={inputCls}>
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">FTEM phase</label>
                  <select value={form.ftem_phase} onChange={e=>setForm(p=>({...p,ftem_phase:e.target.value}))} className={inputCls}>
                    {Object.keys(FTEM_PHASES).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50">{saving ? 'Saving…' : 'Add athlete'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
