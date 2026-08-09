import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Save, Trash2, Phone, Mail, Globe, Copy, Check, User } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

function initials(a) {
  return `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase()
}

export default function AthleteDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [athlete,    setAthlete]    = useState(null)
  const [milestones, setMilestones] = useState([])
  const [editing,    setEditing]    = useState(false)
  const [form,       setForm]       = useState({})
  const [saving,     setSaving]     = useState(false)
  const [copied,     setCopied]     = useState(false)

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

  function copyLink() {
    const url = `${window.location.origin}/athlete/${athlete.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!athlete) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    )
  }

  const sportMeta = SPORTS.find(s => s.value === athlete.sport)
  const age       = calcAge(athlete.dob)
  const inputCls  = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="max-w-4xl mx-auto pb-10">

      {/* ── Back link ── */}
      <div className="px-4 pt-4 md:px-8 md:pt-8 mb-4">
        <Link to="/athletes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All athletes
        </Link>
      </div>

      {/* ── Hero / profile header ── */}
      <div className="px-4 md:px-8 mb-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6">
          {editing ? (
            /* Edit mode */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">First name</label>
                  <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className={inputCls} placeholder="First name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Last name</label>
                  <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className={inputCls} placeholder="Last name" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">FTEM Phase</label>
                  <select value={form.ftem_phase} onChange={e => setForm(p => ({ ...p, ftem_phase: e.target.value }))} className={inputCls}>
                    {Object.keys(FTEM_PHASES).map(k => <option key={k} value={k}>{k} — {FTEM_PHASES[k].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
                  <select value={form.is_active ? '1' : '0'} onChange={e => setForm(p => ({ ...p, is_active: e.target.value === '1' }))} className={inputCls}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Contact phone</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input type="tel" value={form.phone ?? ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls + ' pl-8'} placeholder="+61 4xx xxx xxx" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Primary position <span className="font-normal text-slate-400">(optional)</span></label>
                <input value={form.position ?? ''} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className={inputCls} placeholder="e.g. Striker, Goalkeeper, Centre-back…" maxLength={100} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className={inputCls} />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors">
                  <Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            /* View mode */
            <>
              {/* Avatar + name — centered mobile, left on desktop */}
              <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-4 mb-5">
                <div className="h-20 w-20 md:h-16 md:w-16 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-emerald-500 text-white text-2xl md:text-xl font-black">
                  {athlete.avatar_url
                    ? <img src={athlete.avatar_url} alt={athlete.first_name} className="h-full w-full object-cover" />
                    : initials(athlete)}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{athlete.first_name} {athlete.last_name}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${FTEM_PHASES[athlete.ftem_phase]?.color ?? ''}`}>
                      {athlete.ftem_phase} · {FTEM_PHASES[athlete.ftem_phase]?.label}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${athlete.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {athlete.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats chips — horizontal scroll on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-5">
                {sportMeta && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 font-medium">
                    {sportMeta.emoji} {sportMeta.label}
                  </span>
                )}
                {athlete.position && (
                  <span className="inline-flex shrink-0 items-center rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-700 font-medium">
                    {athlete.position}
                  </span>
                )}
                {age !== null && (
                  <span className="inline-flex shrink-0 items-center rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 font-medium">
                    Age {age}
                  </span>
                )}
                {athlete.gender && (
                  <span className="inline-flex shrink-0 items-center rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 font-medium capitalize">
                    {athlete.gender}
                  </span>
                )}
                {athlete.squad_names && athlete.squad_names.split(',').map((sq, i) => (
                  <span key={i} className="inline-flex shrink-0 items-center rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm font-medium">
                    {sq.trim()}
                  </span>
                ))}
                {athlete.dob && (
                  <span className="inline-flex shrink-0 items-center rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                    {new Date(athlete.dob).toLocaleDateString('en-AU')}
                  </span>
                )}
              </div>

              {/* Contact buttons — tap-friendly, 48px height */}
              {(athlete.contact_phone || athlete.contact_email) && (
                <div className="flex gap-3 mb-5 flex-wrap">
                  {athlete.contact_phone && (
                    <a href={`tel:${athlete.contact_phone}`}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors shadow-sm shadow-emerald-500/20">
                      <Phone className="h-4 w-4" /> {athlete.contact_phone}
                    </a>
                  )}
                  {athlete.contact_email && (
                    <a href={`mailto:${athlete.contact_email}`}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-colors shadow-sm shadow-blue-500/20 truncate px-4">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{athlete.contact_email}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Notes */}
              {athlete.notes && (
                <div className="rounded-xl bg-slate-50 p-4 mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Notes</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{athlete.notes}</p>
                </div>
              )}

              {/* Public profile link — view only for managers, athlete controls visibility */}
              {isAdmin && athlete.slug && athlete.is_public && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-emerald-700">Public profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 font-mono">
                      {window.location.origin}/athlete/{athlete.slug}
                    </span>
                    <button onClick={copyLink}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                      {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-600 mt-2">Visibility is controlled by the athlete in their settings.</p>
                </div>
              )}

              {/* In-app profile view (shows only this club's milestones) */}
              <Link to={`/athletes/${id}/profile`}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 text-sm font-bold transition-colors mb-3">
                <User className="h-4 w-4" /> View Athlete Profile
              </Link>

              {/* Admin actions */}
              {isAdmin && (
                <div className="flex gap-3">
                  <button onClick={() => setEditing(true)}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white transition-colors">
                    Edit athlete
                  </button>
                  <button onClick={handleDelete}
                    className="flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 px-4 py-3 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Milestones ── */}
      <div className="px-4 md:px-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" /> Milestones
          </h2>

          {milestones.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No milestones recorded yet.</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-amber-100" />

              <div className="space-y-3">
                {milestones.map(m => (
                  <div key={m.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 top-4 h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />

                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-slate-800 text-sm leading-snug">{m.title}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[m.ftem_phase]?.color ?? ''}`}>
                          {m.ftem_phase}
                        </span>
                      </div>
                      {m.description && <p className="text-xs text-slate-500 leading-relaxed">{m.description}</p>}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(m.achieved_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
