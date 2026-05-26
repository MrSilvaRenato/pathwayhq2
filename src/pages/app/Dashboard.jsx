import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Trophy, Calendar, ArrowRight, Zap, Dumbbell,
  MapPin, Megaphone, CheckCircle2, XCircle, HandHeart,
  TrendingUp, Clock, X, HelpCircle, Loader2, Building2, Mail, UserCircle, Trash2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import api from '../../lib/api'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'

// ─── Attendance modal ─────────────────────────────────────────────────────────
// Compact threshold: if a section has more than this many people, show avatar chips
// instead of full rows (saves vertical space, handles 23+ gracefully)
const COMPACT_THRESHOLD = 7

function AttendanceModal({ event, onClose }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/events/${event.id}/attendees`)
      .then(r => setData(r.data))
      .catch(() => setData({ yes: [], maybe: [], no: [], total: 0 }))
      .finally(() => setLoading(false))
  }, [event.id])

  function initials(name = '') {
    return (name || '?').split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
  }

  // Full-row view for small groups — shows name + email
  function FullList({ people, iconColor, bg }) {
    return (
      <div className="space-y-1.5">
        {people.map((p, i) => (
          <div key={i} className="flex items-center gap-2.5 min-h-[40px]">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${bg} ${iconColor} overflow-hidden`}>
              {p.avatar_url
                ? <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
                : initials(p.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{p.name}</p>
              {p.email && <p className="text-[11px] text-slate-400 truncate leading-tight">{p.email}</p>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Chip grid view for large groups (23+ etc) — compact avatar + name
  function ChipGrid({ people, iconColor, bg }) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {people.map((p, i) => (
          <div key={i} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${bg} min-w-0`}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-white/60 ${iconColor} overflow-hidden`}>
              {p.avatar_url
                ? <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
                : initials(p.name)}
            </div>
            <span className={`text-xs font-semibold truncate ${iconColor.replace('text-', 'text-').replace('-600','-800').replace('-500','-700').replace('-500','-700')}`}>
              {p.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const Section = ({ label, people, icon: Icon, iconColor, bg }) => {
    if (!people || people.length === 0) return null
    const compact = people.length >= COMPACT_THRESHOLD
    return (
      <div>
        {/* Section header */}
        <div className="flex items-center gap-2 mb-2.5">
          <Icon className={`h-4 w-4 ${iconColor} shrink-0`} />
          <span className={`text-xs font-bold ${iconColor}`}>{label}</span>
          <span className={`ml-auto text-[10px] font-black ${bg} ${iconColor} rounded-full px-2.5 py-0.5`}>{people.length}</span>
        </div>
        {compact
          ? <ChipGrid people={people} iconColor={iconColor} bg={bg} />
          : <FullList  people={people} iconColor={iconColor} bg={bg} />
        }
      </div>
    )
  }

  // Summary stat pill
  const Stat = ({ value, label }) => (
    <div className="flex-1 text-center">
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="text-[10px] text-purple-200 mt-0.5 leading-none">{label}</p>
    </div>
  )

  return (
    // Backdrop — bottom-sheet on mobile, centered on md+
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(90vh - env(safe-area-inset-top, 0px))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Purple header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-4 text-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">Session attendance</p>
              <h3 className="font-black text-base leading-tight truncate">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                <span className="text-xs text-purple-200 flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  {fmtFull(event.start_time)} · {fmtTime(event.start_time)}
                </span>
                {event.squad_name && (
                  <span className="text-xs text-purple-200 flex items-center gap-1">
                    <Users className="h-3 w-3 shrink-0" /> {event.squad_name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stat row — always shown, skeleton while loading */}
          <div className="flex gap-1 mt-4 pt-3 border-t border-white/20">
            {loading ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-purple-300 text-xs py-1">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : data ? (
              <>
                <Stat value={data.yes.length}   label="Going" />
                <div className="w-px bg-white/20 self-stretch" />
                <Stat value={data.maybe.length} label="Maybe" />
                <div className="w-px bg-white/20 self-stretch" />
                <Stat value={data.no.length}    label="Can't go" />
                <div className="w-px bg-white/20 self-stretch" />
                <Stat value={data.total}        label="Replied" />
              </>
            ) : null}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Fetching responses…
            </div>
          ) : !data || data.total === 0 ? (
            <div className="text-center py-12">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-semibold">No responses yet</p>
              <p className="text-slate-400 text-xs mt-1">Athletes haven't replied to this session</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Section label="Going"        people={data.yes}   icon={CheckCircle2} iconColor="text-emerald-600" bg="bg-emerald-50" />
              <Section label="Maybe"        people={data.maybe} icon={HelpCircle}   iconColor="text-amber-500"   bg="bg-amber-50" />
              <Section label="Can't make it" people={data.no}  icon={XCircle}      iconColor="text-red-500"     bg="bg-red-50" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDay(dt)  { return new Date(dt).toLocaleDateString('en-AU', { day: 'numeric' }) }
function fmtMon(dt)  { return new Date(dt).toLocaleDateString('en-AU', { month: 'short' }).toUpperCase() }
function fmtTime(dt) { return new Date(dt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }) }
function fmtFull(dt) { return new Date(dt).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) }

// Shared empty state
function Empty({ msg }) {
  return <p className="text-xs text-slate-400 text-center py-4">{msg}</p>
}

// ─── CLUB ADMIN / COACH DASHBOARD ────────────────────────────────────────────
function ClubDashboard({ user }) {
  const [club,            setClub]            = useState(null)
  const [athletes,        setAthletes]        = useState([])
  const [milestones,      setMilestones]      = useState([])
  const [events,          setEvents]          = useState([])
  const [announcements,   setAnnouncements]   = useState([])
  const [volunteering,    setVolunteering]    = useState([])
  const [loading,         setLoading]         = useState(true)
  const [attendanceModal, setAttendanceModal] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/club').catch(() => ({ data: null })),
      api.get('/athletes').catch(() => ({ data: [] })),
      api.get('/milestones').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
      api.get('/announcements').catch(() => ({ data: [] })),
      api.get('/volunteering').catch(() => ({ data: [] })),
    ]).then(([cl, a, m, e, ann, v]) => {
      setClub(cl.data ?? null)
      setAthletes(a.data ?? [])
      setMilestones((m.data ?? []).slice(0, 4))
      const now = new Date()
      setEvents((e.data ?? []).filter(ev => new Date(ev.start_time) >= now).slice(0, 5))
      setAnnouncements((ann.data ?? []).slice(0, 3))
      setVolunteering((v.data ?? []).filter(v => !v.date || new Date(v.date) >= now).slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  const active    = athletes.filter(a => a.is_active).length
  const pending   = athletes.filter(a => a.invite_status === 'pending').length
  const ftemDist  = athletes.reduce((acc, a) => { acc[a.ftem_phase] = (acc[a.ftem_phase] || 0) + 1; return acc }, {})
  const volNeeded = volunteering.filter(v => !v.spots || v.signed_up < v.spots).length

  if (loading) return <DashSkeleton />

  const stats = [
    { label: 'Athletes',   value: athletes.length, sub: `${active} active`,    icon: Users,     color: 'text-blue-600 bg-blue-50',      href: '/athletes' },
    { label: 'Pending',    value: pending,          sub: 'awaiting invite',     icon: Clock,     color: 'text-amber-600 bg-amber-50',    href: '/athletes' },
    { label: 'Sessions',   value: events.length,    sub: 'coming up',           icon: Calendar,  color: 'text-purple-600 bg-purple-50',  href: '/calendar' },
    { label: 'Milestones', value: milestones.length,sub: 'recent',              icon: Trophy,    color: 'text-amber-600 bg-amber-50',    href: '/milestones' },
    { label: 'Volunteer',  value: volNeeded,        sub: 'spots open',          icon: HandHeart, color: 'text-emerald-600 bg-emerald-50', href: '/volunteering' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

      {/* ── Club identity banner ─────────────────────────────────── */}
      {club && (
        <div className="col-span-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 md:p-5 flex items-center gap-4 shadow-sm">
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name} className="h-14 w-14 rounded-xl object-cover shrink-0 border-2 border-white/30 shadow" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/20">
              <Building2 className="h-7 w-7 text-white/80" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-0.5">Your club</p>
            <h2 className="text-xl font-black text-white truncate leading-tight">{club.name}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              {club.sport && <span className="text-xs text-emerald-100">{club.sport}</span>}
              {club.city && (
                <span className="text-xs text-emerald-200 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {club.city}{club.state ? `, ${club.state}` : ''}
                </span>
              )}
            </div>
          </div>
          <Link to="/settings" className="shrink-0 hidden sm:flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-xs font-semibold text-white transition-colors">
            Club settings <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ── Row 1: stat pills — horizontal scroll on mobile ─────── */}
      <div className="col-span-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:contents">
        <div className="flex gap-3 pb-2 md:pb-0 md:contents" style={{ minWidth: 'max-content' }}>
          {stats.map(s => (
            <Link key={s.label} to={s.href}
              className="flex shrink-0 w-40 md:w-auto md:col-span-2 items-center gap-3 rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-slate-200 transition-all px-4 py-3.5 group">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-slate-900 leading-none">{s.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{s.label} · {s.sub}</div>
              </div>
            </Link>
          ))}
          {/* extra col filler on xl so 5 pills span correctly */}
          <div className="hidden xl:block xl:col-span-2" />
        </div>
      </div>

      {/* ── Row 2: Upcoming sessions (big) + FTEM dist ───────── */}

      {/* Upcoming sessions — hero */}
      <div className="col-span-full md:col-span-7 rounded-2xl border border-slate-100 bg-white p-4 md:p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500" /> Upcoming Sessions
            <span className="text-[10px] font-normal text-slate-400 hidden sm:block">· tap to see attendance</span>
          </h2>
          <Link to="/calendar" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            Full calendar <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-slate-300">
            <Calendar className="h-10 w-10 mb-2" />
            <p className="text-sm text-slate-400">No upcoming sessions</p>
            <Link to="/calendar" className="mt-2 text-xs text-emerald-600 underline">Schedule one</Link>
          </div>
        ) : (
          <div className="space-y-2 flex-1">
            {events.map((e, i) => (
              <button key={e.id} onClick={() => setAttendanceModal(e)}
                className={`w-full text-left flex items-center gap-3 rounded-xl p-3 transition-colors cursor-pointer ${i === 0 ? 'bg-purple-50 border border-purple-100 hover:bg-purple-100' : 'border border-slate-50 hover:bg-slate-50'}`}>
                <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl ${i === 0 ? 'bg-purple-500' : 'bg-slate-100'}`}>
                  <span className={`text-sm font-black leading-none ${i === 0 ? 'text-white' : 'text-slate-700'}`}>{fmtDay(e.start_time)}</span>
                  <span className={`text-[10px] font-semibold ${i === 0 ? 'text-purple-200' : 'text-slate-400'}`}>{fmtMon(e.start_time)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${i === 0 ? 'text-slate-900' : 'text-slate-700'}`}>{e.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {fmtTime(e.start_time)}
                    </span>
                    {e.location && (
                      <span className="text-xs text-slate-400 flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </span>
                    )}
                    {e.squad_name && (
                      <span className="text-xs text-slate-400 flex items-center gap-0.5">
                        <Users className="h-3 w-3" /> {e.squad_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {i === 0 && <span className="text-[10px] font-bold text-purple-600 bg-purple-100 rounded-full px-2 py-0.5">Next</span>}
                  {e.rsvp_counts && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" /> {e.rsvp_counts.yes} going
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FTEM distribution */}
      <div className="col-span-full md:col-span-5 rounded-2xl border border-slate-100 bg-white p-4 md:p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> FTEM Spread
          </h2>
          <Link to="/analytics" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            Analytics <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {athletes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <Users className="h-10 w-10 mb-2" />
            <p className="text-sm text-slate-400">No athletes yet</p>
            <Link to="/athletes" className="mt-2 text-xs text-emerald-600 underline">Add your first</Link>
          </div>
        ) : (
          <div className="space-y-2.5 flex-1">
            {Object.entries(FTEM_PHASES).map(([phase, meta]) => {
              const count = ftemDist[phase] ?? 0
              if (!count) return null
              const pct = Math.round((count / athletes.length) * 100)
              return (
                <div key={phase} className="flex items-center gap-2.5">
                  <span className={`inline-flex w-9 shrink-0 justify-center rounded-lg px-1 py-0.5 text-xs font-black ${meta.color}`}>{phase}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-5 text-right">{count}</span>
                  <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
                </div>
              )
            })}
            <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>{athletes.length} total athletes</span>
              <span>{active} active</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Row 3: Announcements + Milestones + Volunteering ─── */}

      {/* Announcements */}
      <div className="col-span-full md:col-span-5 rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-blue-500" /> Announcements
          </h2>
          <Link to="/announcements" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {announcements.length === 0 ? (
          <Empty msg="No announcements yet" />
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{a.title}</p>
                {a.body && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent milestones */}
      <div className="col-span-full md:col-span-4 rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Recent Milestones
          </h2>
          <Link to="/milestones" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {milestones.length === 0 ? (
          <Empty msg="No milestones recorded yet" />
        ) : (
          <div className="space-y-2">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{m.title}</p>
                  <p className="text-[10px] text-slate-400">{fmtFull(m.achieved_at)}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${FTEM_PHASES[m.ftem_phase]?.color ?? ''}`}>
                  {m.ftem_phase}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volunteering */}
      <div className="col-span-full md:col-span-3 rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <HandHeart className="h-4 w-4 text-emerald-500" /> Volunteering
          </h2>
          <Link to="/volunteering" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {volunteering.length === 0 ? (
          <Empty msg="No open opportunities" />
        ) : (
          <div className="space-y-2">
            {volunteering.map(v => {
              const spotsLeft = v.spots ? v.spots - (v.signed_up ?? 0) : null
              return (
                <div key={v.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-800 truncate">{v.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    {v.date && <span className="text-[10px] text-slate-400">{fmtFull(v.date)}</span>}
                    {spotsLeft !== null && (
                      <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${spotsLeft === 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {spotsLeft === 0 ? 'Full' : `${spotsLeft} left`}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Attendance modal */}
      {attendanceModal && (
        <AttendanceModal event={attendanceModal} onClose={() => setAttendanceModal(null)} />
      )}

    </div>
  )
}

// ─── ATHLETE DASHBOARD ────────────────────────────────────────────────────────
function SquadRequestModal({ onClose }) {
  const toast = useToast()
  const [squads,   setSquads]   = useState([])
  const [selected, setSelected] = useState('')
  const [reason,   setReason]   = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    api.get('/squads').then(r => setSquads(r.data)).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      await api.post(`/squads/${selected}/request`, { reason })
      toast.success('Request sent to your coach!')
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message
      toast.error(msg || 'Failed to send request')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full md:max-w-sm md:rounded-2xl bg-white md:shadow-2xl rounded-t-3xl shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">Request squad change</h2>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Which squad do you want to join?</label>
            <select
              required
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">Select squad…</option>
              {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. I moved age groups…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3 pb-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]">Cancel</button>
            <button type="submit" disabled={saving || !selected} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 min-h-[44px]">
              {saving ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AthleteDashboard({ user }) {
  const [profile,       setProfile]      = useState(null)
  const [milestones,    setMilestones]   = useState([])
  const [events,        setEvents]       = useState([])
  const [announcements, setAnnouncements]= useState([])
  const [invites,       setInvites]      = useState([])
  const [joinRequests,  setJoinRequests] = useState([])
  const [volunteering,  setVolunteering] = useState([])
  const [loading,       setLoading]      = useState(true)
  const [inviteAction,  setInviteAction] = useState({})
  const [revoking,      setRevoking]     = useState(null)
  const [showSquadRequest, setShowSquadRequest] = useState(false)
  const toast = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/athletes/me').catch(() => null),
      api.get('/milestones').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
      api.get('/announcements').catch(() => ({ data: [] })),
      api.get('/athletes/invites').catch(() => ({ data: [] })),
      api.get('/volunteering').catch(() => ({ data: [] })),
      api.get('/my/join-requests').catch(() => ({ data: [] })),
    ]).then(([p, m, e, a, inv, v, jr]) => {
      setProfile(p?.data ?? null)
      setMilestones((m.data ?? []).slice(0, 4))
      const now = new Date()
      setEvents((e.data ?? []).filter(ev => new Date(ev.start_time) >= now).slice(0, 4))
      setAnnouncements((a.data ?? []).slice(0, 4))
      setInvites(inv.data ?? [])
      setVolunteering((v.data ?? []).filter(v => !v.date || new Date(v.date) >= now).slice(0, 3))
      setJoinRequests((jr.data ?? []).filter(r => r.status === 'pending' || r.status === 'rejected'))
    }).finally(() => setLoading(false))
  }, [])

  async function revokeRequest(slug) {
    setRevoking(slug)
    try {
      await api.delete(`/clubs/public/${slug}/join-request`)
      setJoinRequests(p => p.filter(r => r.slug !== slug))
      toast.success('Request withdrawn — you can now apply again')
    } catch {
      toast.error('Failed to revoke request')
    } finally {
      setRevoking(null)
    }
  }

  async function handleAccept(id) {
    setInviteAction(p => ({ ...p, [id]: 'accepting' }))
    try {
      await api.post(`/athletes/${id}/accept-invite`)
      setInvites(p => p.filter(i => i.id !== id))
      const [p, m, e, a] = await Promise.all([
        api.get('/athletes/me').catch(() => null),
        api.get('/milestones').catch(() => ({ data: [] })),
        api.get('/events').catch(() => ({ data: [] })),
        api.get('/announcements').catch(() => ({ data: [] })),
      ])
      setProfile(p?.data ?? null)
      setMilestones((m.data ?? []).slice(0, 4))
      const now = new Date()
      setEvents((e.data ?? []).filter(ev => new Date(ev.start_time) >= now).slice(0, 4))
      setAnnouncements((a.data ?? []).slice(0, 4))
    } finally {
      setInviteAction(p => { const n = { ...p }; delete n[id]; return n })
    }
  }

  async function handleReject(id) {
    setInviteAction(p => ({ ...p, [id]: 'rejecting' }))
    try {
      await api.delete(`/athletes/${id}/reject-invite`)
      setInvites(p => p.filter(i => i.id !== id))
    } finally {
      setInviteAction(p => { const n = { ...p }; delete n[id]; return n })
    }
  }

  if (loading) return <DashSkeleton />

  const sport     = profile ? SPORTS.find(s => s.value === profile.sport) : null
  const phase     = profile ? FTEM_PHASES[profile.ftem_phase] : null
  const nextEvent = events[0] ?? null

  return (
    <>
    {showSquadRequest && <SquadRequestModal onClose={() => setShowSquadRequest(false)} />}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

      {/* ── Club banner ──────────────────────────────────────────────────── */}
      {profile?.club_name && (
        <div className="col-span-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 md:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Logo + club info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {profile.club_logo ? (
                <img src={profile.club_logo} alt={profile.club_name}
                  className="h-14 w-14 rounded-xl object-cover shrink-0 border-2 border-white/30 shadow" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/20">
                  <Building2 className="h-7 w-7 text-white/80" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-0.5">Your club</p>
                <h2 className="text-xl font-black text-white truncate leading-tight">{profile.club_name}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  {profile.club_sport && <span className="text-xs text-emerald-100 capitalize">{profile.club_sport}</span>}
                  {profile.club_city && (
                    <span className="text-xs text-emerald-200 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {profile.club_city}{profile.club_state ? `, ${profile.club_state}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch bg-white/20" />

            {/* Manager info */}
            {profile.manager_name && (
              <div className="flex items-center gap-3 sm:shrink-0">
                <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                  <UserCircle className="h-5 w-5 text-white/80" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Club manager</p>
                  <p className="text-sm font-bold text-white truncate">{profile.manager_name}</p>
                  {profile.manager_email && (
                    <a href={`mailto:${profile.manager_email}`}
                      className="flex items-center gap-1 text-xs text-emerald-200 hover:text-white transition-colors mt-0.5">
                      <Mail className="h-3 w-3" />{profile.manager_email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* View club link */}
            {profile.club_slug && (
              <Link to={`/club/${profile.club_slug}`} target="_blank" rel="noopener noreferrer"
                className="shrink-0 sm:ml-2 flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-xs font-semibold text-white transition-colors self-start sm:self-center">
                View club <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Pending invites (full-width alert — very prominent on mobile) ── */}
      {invites.map(inv => (
        <div key={inv.id} className="col-span-full rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm shadow-amber-100">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 border border-amber-200 text-lg mt-0.5">🏟️</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm leading-snug">{inv.club_name} wants to add you as an athlete</p>
              <p className="text-xs text-slate-500 mt-0.5">{inv.first_name} {inv.last_name} · FTEM {inv.ftem_phase}{inv.club_city ? ` · ${inv.club_city}` : ''}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleAccept(inv.id)} disabled={!!inviteAction[inv.id]}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 min-h-[44px] flex-1 sm:flex-none sm:px-5">
                  <CheckCircle2 className="h-4 w-4" />
                  {inviteAction[inv.id] === 'accepting' ? 'Accepting…' : 'Accept invite'}
                </button>
                <button onClick={() => handleReject(inv.id)} disabled={!!inviteAction[inv.id]}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all disabled:opacity-50 min-h-[44px] flex-1 sm:flex-none">
                  <XCircle className="h-4 w-4" />
                  {inviteAction[inv.id] === 'rejecting' ? 'Declining…' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── Pending / rejected join requests ────────────────── */}
      {joinRequests.map(jr => (
        <div key={jr.id} className={`col-span-full rounded-2xl border-2 p-4 shadow-sm ${jr.status === 'pending' ? 'border-blue-200 bg-blue-50 shadow-blue-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg mt-0.5 ${jr.status === 'pending' ? 'bg-blue-100 border border-blue-200' : 'bg-slate-100 border border-slate-200'}`}>
              {jr.status === 'pending' ? '⏳' : '❌'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm leading-snug">
                {jr.status === 'pending'
                  ? `Your request to join ${jr.club_name} is pending`
                  : `Your request to join ${jr.club_name} was not approved`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {jr.club_sport ? `${jr.club_sport}` : ''}{jr.club_city ? ` · ${jr.club_city}` : ''}
                {' · '}Submitted {new Date(jr.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                {jr.status === 'pending'
                  ? 'Withdraw your request to apply elsewhere or re-send a new request to this club.'
                  : 'Withdraw this request to apply again.'}
              </p>
              <button
                onClick={() => revokeRequest(jr.slug)}
                disabled={revoking === jr.slug}
                className="mt-3 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 active:scale-95 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {revoking === jr.slug
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
                {revoking === jr.slug ? 'Withdrawing…' : 'Withdraw request'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* ── Profile card ─────────────────────────────────────── */}
      <div className="col-span-full md:col-span-4 rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
        {profile ? (
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden border border-emerald-100 flex items-center justify-center bg-emerald-50 text-2xl">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.first_name} className="h-full w-full object-cover" />
                : (sport?.emoji ?? '🏅')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 text-base truncate">{profile.first_name} {profile.last_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{sport?.label ?? '—'}{profile.squad_names ? ` · ${profile.squad_names}` : ''}</p>
              {phase && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black border ${phase.color}`}>{profile.ftem_phase}</span>
                  <span className="text-xs text-slate-400">{phase.label}</span>
                </div>
              )}
              {profile.squad_names && (
                <button
                  onClick={() => setShowSquadRequest(true)}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Request squad change →
                </button>
              )}
              {profile.slug && (
                <Link to={`/athlete/${profile.slug}`} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-bold transition-colors border border-emerald-100">
                  <UserCircle className="h-3.5 w-3.5" /> View my profile
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <Dumbbell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">No profile linked</p>
            <p className="text-xs text-slate-400 mt-1">Ask your coach to add you</p>
          </div>
        )}
      </div>

      {/* ── Next session hero — stacked on mobile, split on desktop ── */}
      <div className="col-span-full md:col-span-8">
        {nextEvent ? (
          <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-4 md:p-5 h-full text-white relative overflow-hidden">
            {/* bg decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white" />
              <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-white" />
            </div>
            <div className="relative">
              {/* Mobile: stacked layout; md: side by side */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-purple-200 uppercase tracking-wider mb-1">Next session</p>
                  <h3 className="text-xl font-black leading-tight">{nextEvent.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="flex items-center gap-1.5 text-sm text-purple-100">
                      <Calendar className="h-4 w-4" />
                      {fmtFull(nextEvent.start_time)} at {fmtTime(nextEvent.start_time)}
                    </span>
                    {nextEvent.location && (
                      <span className="flex items-center gap-1.5 text-sm text-purple-100">
                        <MapPin className="h-4 w-4" /> {nextEvent.location}
                      </span>
                    )}
                  </div>
                  {nextEvent.squad_name && (
                    <span className="inline-flex items-center gap-1 mt-3 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                      <Users className="h-3 w-3" /> {nextEvent.squad_name}
                    </span>
                  )}
                </div>
                {/* Date badge — inline on mobile below title, right side on sm+ */}
                <div className="shrink-0 self-start sm:self-center text-center bg-white/20 rounded-2xl px-4 py-3">
                  <p className="text-3xl font-black leading-none">{fmtDay(nextEvent.start_time)}</p>
                  <p className="text-sm font-bold text-purple-200 mt-0.5">{fmtMon(nextEvent.start_time)}</p>
                </div>
              </div>
              {events.length > 1 && (
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                  <p className="text-xs text-purple-200">{events.length - 1} more upcoming</p>
                  <Link to="/calendar" className="text-xs font-bold text-white flex items-center gap-1 hover:text-purple-200 transition-colors">
                    View calendar <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white h-full min-h-[120px] flex flex-col items-center justify-center p-6 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-400 text-sm">No upcoming sessions</p>
          </div>
        )}
      </div>

      {/* ── Announcements ────────────────────────────────────── */}
      <div className="col-span-full md:col-span-4 rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Megaphone className="h-3.5 w-3.5 text-blue-500" /> Announcements
          </h2>
          <Link to="/announcements" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {announcements.length === 0 ? (
          <Empty msg="No announcements" />
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-800 leading-snug">{a.title}</p>
                {a.body && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{a.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── My milestones ────────────────────────────────────── */}
      <div className="col-span-full md:col-span-4 rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> My Milestones
          </h2>
          <Link to="/milestones" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {milestones.length === 0 ? (
          <Empty msg="No milestones yet — keep training!" />
        ) : (
          <div className="space-y-2">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{m.title}</p>
                  <p className="text-[10px] text-slate-400">{fmtFull(m.achieved_at)}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${FTEM_PHASES[m.ftem_phase]?.color ?? ''}`}>
                  {m.ftem_phase}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Volunteering ─────────────────────────────────────── */}
      <div className="col-span-full md:col-span-4 rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <HandHeart className="h-3.5 w-3.5 text-emerald-500" /> Volunteer Spots
          </h2>
          <Link to="/volunteering" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {volunteering.length === 0 ? (
          <Empty msg="No open volunteer spots" />
        ) : (
          <div className="space-y-2">
            {volunteering.map(v => {
              const spotsLeft = v.spots ? v.spots - (v.signed_up ?? 0) : null
              return (
                <div key={v.id} className={`rounded-xl border px-3 py-2.5 ${v.i_signed_up ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{v.title}</p>
                    {v.i_signed_up
                      ? <span className="shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 bg-emerald-100 text-emerald-700">You're in</span>
                      : spotsLeft !== null && <span className={`shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${spotsLeft === 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{spotsLeft === 0 ? 'Full' : `${spotsLeft} left`}</span>
                    }
                  </div>
                  {v.date && <p className="text-[10px] text-slate-400 mt-0.5">{fmtFull(v.date)}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
    </>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function DashSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="col-span-full sm:col-span-6 md:col-span-2 h-16 rounded-2xl bg-slate-100" />
      ))}
      <div className="col-span-full md:col-span-7 h-56 rounded-2xl bg-slate-100" />
      <div className="col-span-full md:col-span-5 h-56 rounded-2xl bg-slate-100" />
      <div className="col-span-full md:col-span-5 h-40 rounded-2xl bg-slate-100" />
      <div className="col-span-full md:col-span-4 h-40 rounded-2xl bg-slate-100" />
      <div className="col-span-full md:col-span-3 h-40 rounded-2xl bg-slate-100" />
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const isAthlete = user?.role === 'athlete'
  const isParent  = user?.role === 'parent'

  return (
    <div className="px-4 py-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            {greeting}, {user?.full_name} 👋
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-400">PathwayHQ</span>
        </div>
      </div>

      {(isAthlete || isParent)
        ? <AthleteDashboard user={user} />
        : <ClubDashboard user={user} />
      }
    </div>
  )
}
