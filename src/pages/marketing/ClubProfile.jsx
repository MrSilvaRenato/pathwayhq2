import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
<<<<<<< Updated upstream
import { Zap, MapPin, Users, Trophy, ArrowLeft, ArrowRight, Globe, Mail, Star, Award, Medal } from 'lucide-react'
import api from '../../lib/api'
import { SPORTS, FTEM_PHASES } from '../../lib/constants'

function trophyTier(phase) {
  if (phase === 'M')              return { icon: '🥇', glow: 'shadow-amber-500/30',  border: 'border-amber-500/40',  bg: 'bg-gradient-to-br from-amber-500/15 to-yellow-500/10',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Mastery' }
  if (phase === 'E1' || phase === 'E2') return { icon: '🥈', glow: 'shadow-slate-300/20',  border: 'border-slate-400/30',  bg: 'bg-gradient-to-br from-slate-400/10 to-slate-500/5',   badge: 'bg-slate-400/20 text-slate-200 border-slate-400/30', label: 'Elite'   }
  if (phase?.startsWith('T'))    return { icon: '🥉', glow: 'shadow-orange-500/20',  border: 'border-orange-500/30', bg: 'bg-gradient-to-br from-orange-500/10 to-amber-700/5',   badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Talent' }
  return                                { icon: '🏅', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/20',bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5',    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Foundation' }
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
=======
import {
  Zap, MapPin, Users, Trophy, ArrowLeft, ArrowRight,
  Globe, Mail, Phone, Calendar, Clock, Megaphone,
  Instagram, Facebook, Twitter, ChevronDown, ChevronUp,
} from 'lucide-react'
import api from '../../lib/api'
import { SPORTS, FTEM_PHASES } from '../../lib/constants'

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
}

const EVENT_COLORS = {
  training: 'bg-blue-500',
  match:    'bg-emerald-500',
  camp:     'bg-purple-500',
  other:    'bg-slate-400',
}
const ANNOUNCE_CAT = {
  match:    { emoji: '⚽', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
  training: { emoji: '💪', color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
  news:     { emoji: '📰', color: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
  camp:     { emoji: '🏕️', color: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
  urgent:   { emoji: '🚨', color: 'bg-red-500/10 border-red-500/20 text-red-300' },
  general:  { emoji: '📢', color: 'bg-slate-500/10 border-slate-500/20 text-slate-300' },
}

// Truncated body card for announcements
function AnnouncePeek({ a }) {
  const [open, setOpen] = useState(false)
  const cat = ANNOUNCE_CAT[a.category] || ANNOUNCE_CAT.general
  const emoji = a.emoji || cat.emoji
  const long = a.body && a.body.length > 200

  return (
    <div className={`rounded-2xl border p-5 ${cat.color} bg-white/5`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-0.5">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white leading-snug">{a.title}</p>
          {a.body && (
            <p className="text-sm text-slate-400 mt-2 leading-relaxed whitespace-pre-line">
              {long && !open ? a.body.slice(0, 200).trimEnd() + '…' : a.body}
            </p>
          )}
          {long && (
            <button onClick={() => setOpen(v => !v)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              {open ? <><ChevronUp className="h-3.5 w-3.5" />Show less</> : <><ChevronDown className="h-3.5 w-3.5" />Read more</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
>>>>>>> Stashed changes
}

export default function ClubProfile() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/clubs/public/${slug}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  )

<<<<<<< Updated upstream
  const { club, athletes, milestones } = data
  const sportMeta  = SPORTS.find(s => s.value === club.sport)
  const ftemDist   = (athletes ?? []).reduce((acc, a) => { acc[a.ftem_phase] = (acc[a.ftem_phase] || 0) + 1; return acc }, {})
  const eliteCount = (athletes ?? []).filter(a => a.ftem_phase?.startsWith('E') || a.ftem_phase === 'M').length
  const phases     = Object.keys(ftemDist).length
=======
  if (!data) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white px-4">
      <div className="text-4xl">🏟️</div>
      <h1 className="text-xl font-black">Club not found</h1>
      <p className="text-slate-400 text-sm text-center">This club profile doesn't exist or isn't public yet.</p>
      <Link to="/clubs" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> All clubs
      </Link>
    </div>
  )

  const { club, athletes, ftemDist, milestones, events, announcements } = data
  const sportMeta   = SPORTS.find(s => s.value === club.sport)
  const athleteList = athletes ?? []
  const ftem        = ftemDist ?? {}
  const hasCover    = !!club.cover_image_url
  const hasLogo     = !!club.logo_url
  const hasSocials  = club.social_instagram || club.social_facebook || club.social_twitter
  const hasEvents   = events && events.length > 0
  const hasMile     = milestones && milestones.length > 0
  const hasAnnounce = announcements && announcements.length > 0
>>>>>>> Stashed changes

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">PathwayHQ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/clubs" className="hidden sm:flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors">
<<<<<<< Updated upstream
              <ArrowLeft className="h-3.5 w-3.5" /> All clubs
            </Link>
            <Link to="/login"  className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 active:scale-95">
=======
              <ArrowLeft className="h-4 w-4" /> All clubs
            </Link>
            <Link to="/login"  className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-4 py-2 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
>>>>>>> Stashed changes
              Get started free
            </Link>
          </div>
        </div>
      </nav>

<<<<<<< Updated upstream
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 60px)' }} />
          <div className="absolute top-0 left-0 h-[400px] w-[600px] rounded-full bg-emerald-600/15 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
          <Link to="/clubs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> All clubs
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Club badge */}
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 text-4xl sm:text-5xl shadow-2xl">
              {sportMeta?.emoji ?? '🏆'}
            </div>

            <div className="flex-1 min-w-0">
              {/* Public profile badge */}
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                <Star className="h-3 w-3" /> Official Club Profile
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">{club.name}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                {sportMeta && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm font-semibold text-slate-200">
                    {sportMeta.emoji} {sportMeta.label}
                  </span>
                )}
                {club.city && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {club.city}{club.state ? `, ${club.state}` : ''}
                  </span>
                )}
                {club.website && (
                  <a href={club.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    <Globe className="h-3.5 w-3.5" /> Website
=======
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Cover image or gradient */}
        {hasCover ? (
          <div className="absolute inset-0 h-72 sm:h-80">
            <img src={club.cover_image_url} alt="Club cover" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950" />
          </div>
        ) : (
          <div className="absolute inset-0 h-72 sm:h-80 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0,white 1px,transparent 1px,transparent 60px)' }} />
            <div className="absolute top-0 left-0 h-[400px] w-[600px] rounded-full bg-emerald-600/15 blur-[120px]" />
            <div className="absolute top-0 right-0 h-[300px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-12 sm:pt-10">
          <Link to="/clubs" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> All clubs
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
            {/* Logo / emoji */}
            <div className={`flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl border-2 border-white/20 shadow-2xl text-4xl sm:text-5xl overflow-hidden ${hasCover ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-white/5'}`}>
              {hasLogo
                ? <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover rounded-3xl" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                : null}
              <span className={hasLogo ? 'hidden' : ''}>{sportMeta?.emoji ?? '🏆'}</span>
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {sportMeta && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-bold text-slate-300 backdrop-blur-sm">
                    {sportMeta.emoji} {sportMeta.label}
                  </span>
                )}
                {club.founded_year && (
                  <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-400">
                    Est. {club.founded_year}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">{club.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-slate-400 text-sm">
                {club.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {club.city}{club.state ? `, ${club.state}` : ''}
                  </span>
                )}
                {athleteList.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    {athleteList.length} athlete{athleteList.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Contact & social row */}
              <div className="mt-4 flex flex-wrap gap-3">
                {club.website && (
                  <a href={club.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                    <Globe className="h-4 w-4" /> Website
>>>>>>> Stashed changes
                  </a>
                )}
                {club.contact_email && (
                  <a href={`mailto:${club.contact_email}`}
<<<<<<< Updated upstream
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-slate-400 hover:text-white transition-colors">
                    <Mail className="h-3.5 w-3.5" /> Contact
=======
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                    <Mail className="h-4 w-4" /> Email
                  </a>
                )}
                {club.phone && (
                  <a href={`tel:${club.phone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                    <Phone className="h-4 w-4" /> {club.phone}
                  </a>
                )}
                {club.social_instagram && (
                  <a href={club.social_instagram} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 transition-colors">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                )}
                {club.social_facebook && (
                  <a href={club.social_facebook} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                )}
                {club.social_twitter && (
                  <a href={club.social_twitter} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors">
                    <Twitter className="h-4 w-4" /> Twitter/X
>>>>>>> Stashed changes
                  </a>
                )}
              </div>

              {club.description && (
                <p className="mt-4 text-slate-400 leading-relaxed max-w-2xl text-sm sm:text-base">{club.description}</p>
              )}
            </div>
          </div>

<<<<<<< Updated upstream
          {/* Key stats row */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: athletes?.length ?? 0, label: 'Athletes', icon: Users,  color: 'text-emerald-400' },
              { value: milestones?.length ?? 0, label: 'Achievements', icon: Trophy, color: 'text-amber-400' },
              { value: phases,                  label: 'Dev. phases',  icon: Award,  color: 'text-blue-400'    },
              { value: eliteCount,              label: 'Elite athletes', icon: Medal, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 text-center">
                <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">

        {/* ── Trophy Cabinet ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Trophy Cabinet</h2>
              <p className="text-xs text-slate-500">Celebrated athlete achievements</p>
            </div>
          </div>

          {milestones?.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map(m => {
                const tier = trophyTier(m.ftem_phase)
                return (
                  <div key={m.id}
                    className={`rounded-2xl border ${tier.border} ${tier.bg} p-5 shadow-lg ${tier.glow} transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{tier.icon}</span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${tier.badge}`}>
                        {m.ftem_phase}
                      </span>
                    </div>
                    <p className="font-bold text-white leading-snug text-sm">{m.title}</p>
                    <div className="mt-3 flex items-center justify-between">
                      {m.athlete_name && (
                        <span className="text-xs text-slate-400 font-medium">{m.athlete_name}</span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto">{fmtDate(m.achieved_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-semibold text-slate-400">No achievements shared yet</p>
              <p className="text-sm text-slate-600 mt-1">Club admins can share milestones from their dashboard</p>
            </div>
          )}
        </section>

        {/* ── Athlete Development Pathway ── */}
        {Object.keys(ftemDist).length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Award className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Development Pathway</h2>
                <p className="text-xs text-slate-500">How our athletes are tracking on the FTEM framework</p>
=======
          {/* Description */}
          {club.description && (
            <p className="mt-6 text-slate-400 leading-relaxed max-w-2xl text-[15px]">{club.description}</p>
          )}
        </div>
      </section>

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left sidebar ── */}
          <div className="space-y-5 order-2 lg:order-1">

            {/* Club stats */}
            {athleteList.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Club stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Total athletes</span>
                    <span className="font-black text-white text-2xl">{athleteList.length}</span>
                  </div>
                  {Object.keys(ftem).length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Dev. phases</span>
                      <span className="font-black text-white text-2xl">{Object.keys(ftem).length}</span>
                    </div>
                  )}
                  {hasMile && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Achievements</span>
                      <span className="font-black text-white text-2xl">{milestones.length}</span>
                    </div>
                  )}
                </div>
>>>>>>> Stashed changes
              </div>
            )}

<<<<<<< Updated upstream
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.keys(FTEM_PHASES).map(phase => {
                  const count = ftemDist[phase] ?? 0
                  if (!count) return null
                  const pct  = Math.round((count / (athletes?.length ?? 1)) * 100)
                  const meta = FTEM_PHASES[phase]
                  return (
                    <div key={phase} className="flex items-center gap-3">
                      <span className={`inline-flex w-10 shrink-0 justify-center rounded-lg px-1 py-1 text-xs font-black border ${meta.color}`}>{phase}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400 font-medium">{meta.label}</span>
                          <span className="text-xs font-bold text-white">{count} <span className="text-slate-500 font-normal">athlete{count !== 1 ? 's' : ''}</span></span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-2 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
=======
            {/* FTEM distribution */}
            {Object.keys(ftem).length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Development pathway</h2>
                <div className="space-y-2.5">
                  {Object.keys(FTEM_PHASES).map(phase => {
                    const count = ftem[phase] ?? 0
                    if (!count) return null
                    const pct = Math.round((count / athleteList.length) * 100)
                    return (
                      <div key={phase} className="flex items-center gap-2.5">
                        <span className={`inline-flex w-10 shrink-0 justify-center rounded-full px-1.5 py-0.5 text-xs font-black ${FTEM_PHASES[phase].color}`}>{phase}</span>
                        <div className="flex-1 rounded-full bg-white/5 h-2 overflow-hidden">
                          <div className="h-2 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 w-4 text-right">{count}</span>
                      </div>
                    )
                  })}
                  <p className="text-[11px] text-slate-600 pt-1">FTEM = Foundation → Talent → Elite → Mastery</p>
                </div>
              </div>
            )}

            {/* Join CTA — sidebar on desktop */}
            <div className="hidden lg:block rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <div className="text-3xl mb-3">🏟️</div>
              <h3 className="text-base font-black text-white mb-2">Join {club.name}</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Ask your coach to set up your athlete profile and start tracking your development.
              </p>
              <Link to="/signup"
                className="block w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 py-3 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 text-center">
                Create athlete account
              </Link>
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">

            {/* Upcoming events */}
            {hasEvents && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar className="h-4 w-4 text-purple-400" /> Upcoming sessions
                </h2>
                <div className="space-y-3">
                  {events.map((ev, i) => (
                    <div key={ev.id} className={`flex items-center gap-4 rounded-xl p-3.5 border border-white/5 ${i === 0 ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/[0.02]'}`}>
                      {/* Date block */}
                      <div className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl shrink-0 ${i === 0 ? 'bg-purple-500' : 'bg-white/10'}`}>
                        <span className={`text-sm font-black leading-none ${i === 0 ? 'text-white' : 'text-slate-300'}`}>
                          {new Date(ev.start_time).getDate()}
                        </span>
                        <span className={`text-[10px] font-semibold ${i === 0 ? 'text-purple-200' : 'text-slate-500'}`}>
                          {new Date(ev.start_time).toLocaleDateString('en-AU', { month: 'short' }).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white truncate">{ev.title}</p>
                          <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${EVENT_COLORS[ev.event_type] ?? 'bg-slate-400'}`} />
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {fmtTime(ev.start_time)}
                          </span>
                          {ev.location && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {ev.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {i === 0 && <span className="shrink-0 text-[10px] font-bold bg-purple-500/30 text-purple-300 rounded-full px-2.5 py-0.5">Next</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements */}
            {hasAnnounce && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Megaphone className="h-4 w-4 text-emerald-400" /> Club news
                </h2>
                <div className="space-y-3">
                  {announcements.map(a => <AnnouncePeek key={a.id} a={a} />)}
                </div>
              </div>
            )}

            {/* Recent milestones */}
            {hasMile && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Trophy className="h-4 w-4 text-amber-400" /> Recent achievements
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {milestones.map(m => (
                    <div key={m.id} className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                        <Trophy className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white leading-snug line-clamp-2">{m.title}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${FTEM_PHASES[m.ftem_phase]?.color ?? 'bg-slate-700 text-slate-300'}`}>
                            {m.ftem_phase}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(m.achieved_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
>>>>>>> Stashed changes
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-xs text-slate-600 text-right">{athletes?.length ?? 0} active athletes across {phases} development phase{phases !== 1 ? 's' : ''}</p>
            </div>
          </section>
        )}

<<<<<<< Updated upstream
        {/* ── Join CTA ── */}
        <section>
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-[60px]" />
            </div>
            <div className="relative">
              <div className="text-3xl mb-4">🏆</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Join {club.name}</h2>
              <p className="text-slate-400 text-sm sm:text-base mb-6 max-w-md mx-auto">
                Ask your coach to add you to the squad and start building your pathway — every milestone, every achievement, all in one place.
=======
            {/* Empty state when nothing public */}
            {!hasEvents && !hasAnnounce && !hasMile && athleteList.length === 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-10 text-center">
                <div className="text-4xl mb-4">🏟️</div>
                <p className="font-bold text-slate-400 text-base">Profile coming soon</p>
                <p className="text-sm text-slate-600 mt-1">This club is setting up their page.</p>
              </div>
            )}

            {/* Mobile Join CTA */}
            <div className="lg:hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
              <h3 className="text-xl font-black text-white mb-2">Join {club.name}</h3>
              <p className="text-sm text-slate-400 mb-6">
                Ask your coach to set up your athlete profile and start tracking your development.
>>>>>>> Stashed changes
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-6 py-3.5 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
                  Create athlete account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/clubs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 px-6 py-3.5 text-sm font-bold transition-all">
                  Browse all clubs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

<<<<<<< Updated upstream
      {/* Footer */}
      <footer className="border-t border-white/5 px-4 sm:px-6 py-8 mt-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
=======
      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
>>>>>>> Stashed changes
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-400">PathwayHQ</span>
          </Link>
<<<<<<< Updated upstream
          <p className="text-xs text-slate-600">Proudly powered by PathwayHQ · The home of Australian sports development</p>
          <Link to="/clubs" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">← All clubs</Link>
=======
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Link to="/clubs" className="hover:text-slate-300 transition-colors">← All clubs</Link>
            <Link to="/signup" className="hover:text-slate-300 transition-colors">Create your club</Link>
          </div>
>>>>>>> Stashed changes
        </div>
      </footer>
    </div>
  )
}
