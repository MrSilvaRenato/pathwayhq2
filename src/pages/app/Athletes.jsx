import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X, Plus, Users, CheckCircle2, Loader2, UserCheck, Mail, Phone, Pencil, Trash2, ExternalLink } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const EMPTY_FORM = { first_name:'', last_name:'', dob:'', sport:'soccer', gender:'male', ftem_phase:'F1', notes:'', invite_email:'', phone:'' }

function initials(a) {
  return `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase()
}

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

export default function Athletes() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [athletes, setAthletes] = useState([])
  const [squads,   setSquads]   = useState([])
  const [q, setQ]               = useState('')
  const [phase, setPhase]       = useState('')
  const [squadF, setSquadF]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)

  // Email lookup state
  const [emailLookup, setEmailLookup]     = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    api.get('/athletes').then(r => setAthletes(r.data))
    api.get('/squads').then(r => setSquads(r.data))
  }, [])

  const handleEmailChange = useCallback((email) => {
    setForm(p => ({ ...p, invite_email: email }))
    setEmailLookup(null)
    clearTimeout(debounceRef.current)
    const trimmed = email.trim()
    const valid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    if (!valid) return
    setLookupLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/lookup?email=${encodeURIComponent(trimmed)}`)
        setEmailLookup(data)
        if (data.found) {
          setForm(p => ({
            ...p,
            first_name: data.first_name || p.first_name,
            last_name:  data.last_name  || p.last_name,
          }))
        }
      } catch {
        setEmailLookup(null)
      } finally {
        setLookupLoading(false)
      }
    }, 500)
  }, [])

  function openModal() {
    setForm(EMPTY_FORM)
    setEmailLookup(null)
    setShowModal(true)
  }

  const filtersActive = q || phase || squadF

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
      const fresh = await api.get('/athletes')
      setAthletes(fresh.data)
      setShowModal(false)
      setForm(EMPTY_FORM)
      setEmailLookup(null)
      if (data.status === 'pending')       toast.success(`Invite sent to ${form.invite_email} — waiting for their acceptance`)
      else if (data.status === 'invited')  toast.success(`${form.first_name} ${form.last_name} added — invite email sent`)
      else                                 toast.success(`${form.first_name} ${form.last_name} added successfully`)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to add athlete')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(e, athleteId) {
    e.stopPropagation()
    if (!confirm('Delete this athlete? This cannot be undone.')) return
    try {
      await api.delete(`/athletes/${athleteId}`)
      setAthletes(prev => prev.filter(a => a.id !== athleteId))
      toast.success('Athlete deleted')
    } catch {
      toast.error('Failed to delete athlete')
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 md:px-8 md:pt-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Athletes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{athletes.length} total · {athletes.filter(a => a.is_active).length} active</p>
        </div>
        {/* Desktop add button */}
        {isAdmin && (
          <button onClick={openModal}
            className="hidden md:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> Add athlete
          </button>
        )}
      </div>

      {/* ── Filter bar — horizontal scroll on mobile ── */}
      <div className="px-4 md:px-8 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap md:overflow-visible">
          {/* Search */}
          <div className="relative shrink-0 w-48 md:flex-1 md:min-w-[200px] md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search athletes…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Phase filter */}
          <select value={phase} onChange={e => setPhase(e.target.value)}
            className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All phases</option>
            {Object.entries(FTEM_PHASES).map(([k, v]) => <option key={k} value={k}>{k} — {v.label}</option>)}
          </select>

          {/* Squad filter */}
          {squads.length > 0 && (
            <select value={squadF} onChange={e => setSquadF(e.target.value)}
              className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">All squads</option>
              {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}

          {/* Clear button */}
          {filtersActive && (
            <button onClick={() => { setQ(''); setPhase(''); setSquadF('') }}
              className="h-10 shrink-0 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          <span className="h-10 shrink-0 flex items-center ml-auto text-sm text-slate-400 whitespace-nowrap pl-2 md:pl-0">
            {filtered.length} of {athletes.length}
          </span>
        </div>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="mx-4 md:mx-8 text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No athletes found</p>
          {isAdmin && (
            <button onClick={openModal} className="mt-4 text-sm text-emerald-600 underline">
              Add your first athlete
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Mobile card list (hidden md+) ── */}
          <div className="md:hidden px-4 pb-24 space-y-3">
            {filtered.map(a => {
              const sport = SPORTS.find(s => s.value === a.sport)
              const age   = calcAge(a.dob)
              return (
                <div key={a.id}
                  onClick={() => navigate(`/athletes/${a.id}`)}
                  className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 active:bg-slate-50 cursor-pointer transition-colors">

                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-11 w-11 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-emerald-500 text-white text-sm font-black">
                      {a.avatar_url
                        ? <img src={a.avatar_url} alt={a.first_name} className="h-full w-full object-cover" />
                        : initials(a)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base leading-tight">{a.first_name} {a.last_name}</span>
                        {a.invite_status === 'pending' && (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700">
                            Pending invite
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[a.ftem_phase]?.color ?? ''}`}>
                        {a.ftem_phase} · {FTEM_PHASES[a.ftem_phase]?.label}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sport && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {sport.emoji} {sport.label}
                      </span>
                    )}
                    {a.squad_names && (
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {a.squad_names}
                      </span>
                    )}
                    {age !== null && (
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {age} yrs
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ${a.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    {isAdmin && (
                      <div className="flex-1 min-w-0 space-y-1">
                        {a.contact_phone && (
                          <a href={`tel:${a.contact_phone}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-600 transition-colors">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {a.contact_phone}
                          </a>
                        )}
                        {a.contact_email && (
                          <a href={`mailto:${a.contact_email}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors truncate">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {a.contact_email}
                          </a>
                        )}
                      </div>
                    )}
                    <div className={`flex items-center gap-2 shrink-0 ${isAdmin ? '' : 'ml-auto'}`}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/athletes/${a.id}`) }}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 text-xs font-bold transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" /> View profile
                      </button>
                      {isAdmin && (
                        <button
                          onClick={e => handleDelete(e, a.id)}
                          className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop table (hidden below md) ── */}
          <div className="hidden md:block mx-8 mb-8 rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Phase</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Sport</th>
                  {isAdmin && <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Contact</th>}
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(a => {
                  const sport = SPORTS.find(s => s.value === a.sport)
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-emerald-500 text-white text-xs font-black">
                            {a.avatar_url
                              ? <img src={a.avatar_url} alt={a.first_name} className="h-full w-full object-cover" />
                              : initials(a)}
                          </div>
                          <Link to={`/athletes/${a.id}`} className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors">
                            {a.first_name} {a.last_name}
                          </Link>
                        </div>
                        {a.invite_status === 'pending' && (
                          <span className="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700">
                            Pending invite
                          </span>
                        )}
                        {a.squad_names && <div className="text-xs text-slate-400 mt-0.5">{a.squad_names}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[a.ftem_phase]?.color ?? ''}`}>
                          {a.ftem_phase}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{sport?.emoji} {sport?.label}</td>
                      {isAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            {a.contact_phone && (
                              <a href={`tel:${a.contact_phone}`}
                                className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-600 transition-colors">
                                <Phone className="h-3 w-3 text-slate-400" /> {a.contact_phone}
                              </a>
                            )}
                            {a.contact_email && (
                              <a href={`mailto:${a.contact_email}`}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition-colors truncate max-w-[160px]">
                                <Mail className="h-3 w-3 shrink-0" /> {a.contact_email}
                              </a>
                            )}
                            {!a.contact_phone && !a.contact_email && <span className="text-xs text-slate-300">—</span>}
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-right">
                        {a.invite_status === 'pending' ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700">
                            Pending
                          </span>
                        ) : (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${a.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {a.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/athletes/${a.id}`}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-bold transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" /> View profile
                          </Link>
                          {isAdmin && (
                            <button onClick={e => handleDelete(e, a.id)}
                              className="rounded-lg border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Mobile FAB (hidden md+) ── */}
      {isAdmin && (
        <button onClick={openModal}
          className="md:hidden fixed bottom-20 right-4 z-20 flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/30 transition-colors">
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* ── Add athlete modal / bottom sheet ── */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Bottom sheet on mobile, centered modal on desktop */}
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto
                          md:inset-0 md:m-auto md:rounded-2xl md:h-fit md:max-w-md md:max-h-[90vh]">

            {/* Drag handle (mobile only) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="px-6 pb-8 pt-4 md:pt-6">
              <h2 className="text-lg font-black text-slate-900 mb-5">Add athlete</h2>
              <form onSubmit={handleAdd} className="space-y-4">

                {/* Email first */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">
                    Athlete email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={form.invite_email}
                      onChange={e => handleEmailChange(e.target.value)}
                      className={`${inputCls} pr-9`}
                      placeholder="athlete@example.com"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {lookupLoading && <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />}
                      {!lookupLoading && emailLookup?.found && <UserCheck className="h-4 w-4 text-emerald-500" />}
                      {!lookupLoading && emailLookup && !emailLookup.found && <Mail className="h-4 w-4 text-slate-300" />}
                    </div>
                  </div>

                  {emailLookup?.found && (
                    <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-3 flex gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-blue-800">
                          {emailLookup.full_name} already has a PathwayHQ account
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          An invitation will be sent to them. They must accept before being added to your roster.
                        </p>
                      </div>
                    </div>
                  )}

                  {emailLookup && !emailLookup.found && (
                    <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> No account found — an invite email will be sent to create one.
                    </p>
                  )}
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">First name</label>
                    <input
                      required
                      value={form.first_name}
                      onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Last name</label>
                    <input
                      required
                      value={form.last_name}
                      onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* DOB + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Date of birth</label>
                    <input type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Contact phone</label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        className={inputCls + ' pl-8'}
                        placeholder="+61 4xx xxx xxx"
                      />
                    </div>
                  </div>
                </div>

                {/* Gender + FTEM */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Gender</label>
                    <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className={inputCls}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">FTEM phase</label>
                    <select value={form.ftem_phase} onChange={e => setForm(p => ({ ...p, ftem_phase: e.target.value }))} className={inputCls}>
                      {Object.keys(FTEM_PHASES).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50">
                    {saving ? 'Saving…' : emailLookup?.found ? 'Send invite' : 'Add athlete'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
