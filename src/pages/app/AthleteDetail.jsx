import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Save, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'

export default function AthleteDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [athlete,    setAthlete]    = useState(null)
  const [milestones, setMilestones] = useState([])
  const [editing,    setEditing]    = useState(false)
  const [form,       setForm]       = useState({})
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    api.get(`/athletes/${id}`).then(r => { setAthlete(r.data); setForm(r.data) })
    api.get(`/milestones/athlete/${id}`).then(r => setMilestones(r.data))
  }, [id])

  async function handleSave() {
    setSaving(true)
    await api.put(`/athletes/${id}`, form)
    setAthlete(form)
    setEditing(false)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this athlete? This cannot be undone.')) return
    await api.delete(`/athletes/${id}`)
    navigate('/athletes')
  }

  if (!athlete) return <div className="p-8 text-slate-400">Loading…</div>

  const sportMeta = SPORTS.find(s => s.value === athlete.sport)
  const inputCls  = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link to="/athletes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> All athletes
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                {sportMeta?.emoji ?? '🏅'}
              </div>
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <input value={form.first_name} onChange={e=>setForm(p=>({...p,first_name:e.target.value}))} className={inputCls} placeholder="First name" />
                    <input value={form.last_name}  onChange={e=>setForm(p=>({...p,last_name:e.target.value}))}  className={inputCls} placeholder="Last name" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-black text-slate-900">{athlete.first_name} {athlete.last_name}</h1>
                    <span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[athlete.ftem_phase]?.color ?? ''}`}>{athlete.ftem_phase}</span>
                  </>
                )}
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">FTEM Phase</label>
                  <select value={form.ftem_phase} onChange={e=>setForm(p=>({...p,ftem_phase:e.target.value}))} className={inputCls}>
                    {Object.keys(FTEM_PHASES).map(k => <option key={k} value={k}>{k} — {FTEM_PHASES[k].label}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
                  <select value={form.is_active ? '1' : '0'} onChange={e=>setForm(p=>({...p,is_active:e.target.value==='1'}))} className={inputCls}>
                    <option value="1">Active</option><option value="0">Inactive</option>
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Notes</label>
                  <textarea value={form.notes ?? ''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={3} className={inputCls} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2 text-sm font-bold text-white disabled:opacity-50">
                    <Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Sport</span><span className="font-medium">{sportMeta?.label}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Gender</span><span className="font-medium capitalize">{athlete.gender}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">DOB</span><span className="font-medium">{athlete.dob ? new Date(athlete.dob).toLocaleDateString('en-AU') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${athlete.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {athlete.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {athlete.notes && <div className="pt-2 border-t border-slate-100"><p className="text-slate-500 text-xs leading-relaxed">{athlete.notes}</p></div>}
                {isAdmin && (
                  <div className="flex gap-2 pt-3">
                    <button onClick={() => setEditing(true)} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2 text-sm font-bold text-white transition-colors">Edit</button>
                    <button onClick={handleDelete} className="rounded-xl border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Milestones</h2>
            {milestones.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No milestones recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {milestones.map(m => (
                  <div key={m.id} className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm">{m.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[m.ftem_phase]?.color ?? ''}`}>{m.ftem_phase}</span>
                    </div>
                    {m.description && <p className="text-xs text-slate-500 mt-1">{m.description}</p>}
                    <p className="text-xs text-slate-400 mt-2">{new Date(m.achieved_at).toLocaleDateString('en-AU', { day:'numeric',month:'short',year:'numeric' })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
