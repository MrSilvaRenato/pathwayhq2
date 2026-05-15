import { useState, useEffect } from 'react'
import { Plus, X, Calendar as CalIcon, MapPin, Clock } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const TYPE_COLORS = {
  training: 'bg-blue-100 text-blue-700',
  match:    'bg-emerald-100 text-emerald-700',
  camp:     'bg-purple-100 text-purple-700',
  other:    'bg-slate-100 text-slate-700',
}

export default function Calendar() {
  const { isAdmin } = useAuth()
  const [events, setEvents]       = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', location:'', start_time:'', end_time:'', event_type:'training' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/events').then(r => setEvents(r.data)) }, [])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    await api.post('/events', form)
    const { data } = await api.get('/events')
    setEvents(data)
    setShowModal(false); setSaving(false)
    setForm({ title:'', description:'', location:'', start_time:'', end_time:'', event_type:'training' })
  }

  async function handleDelete(id) {
    await api.delete(`/events/${id}`)
    setEvents(p => p.filter(e => e.id !== id))
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-slate-900">Calendar</h1><p className="text-sm text-slate-500 mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''}</p></div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> Add event
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <CalIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No events scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="rounded-2xl border border-slate-100 bg-white hover:shadow-sm transition-all p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${TYPE_COLORS[ev.event_type]}`}>{ev.event_type}</span>
                    {ev.squad_name && <span className="text-xs text-slate-400">{ev.squad_name}</span>}
                  </div>
                  <h2 className="font-bold text-slate-900">{ev.title}</h2>
                  {ev.description && <p className="text-sm text-slate-500 mt-1">{ev.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ev.start_time).toLocaleString('en-AU', { dateStyle:'medium', timeStyle:'short' })}</span>
                    {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                  </div>
                </div>
                {isAdmin && <button onClick={() => handleDelete(ev.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0"><X className="h-4 w-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">Add event</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label><input required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                  <select value={form.event_type} onChange={e=>setForm(p=>({...p,event_type:e.target.value}))} className={inputCls}>
                    <option value="training">Training</option><option value="match">Match</option><option value="camp">Camp</option><option value="other">Other</option>
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Location</label><input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Start</label><input type="datetime-local" required value={form.start_time} onChange={e=>setForm(p=>({...p,start_time:e.target.value}))} className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">End</label><input type="datetime-local" value={form.end_time} onChange={e=>setForm(p=>({...p,end_time:e.target.value}))} className={inputCls} /></div>
              </div>
              <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={2} className={inputCls} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Add event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
