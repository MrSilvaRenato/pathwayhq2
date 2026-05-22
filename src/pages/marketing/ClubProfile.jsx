import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Zap, MapPin, Users, Trophy, ArrowLeft, ArrowRight,
  Globe, Mail, Phone, Calendar, Clock, Megaphone,
  Instagram, Facebook, Twitter, ChevronDown, ChevronUp,
  ShieldCheck, X, Loader2,
} from 'lucide-react'
import api from '../../lib/api'
import { SPORTS, FTEM_PHASES } from '../../lib/constants'

function ClaimModal({ club, onClose }) {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', role_at_club: '', message: '' })
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post(`/clubs/public/${club.slug}/claim`, form)
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-black text-white text-base">Claim {club.name}</h2>
              <p className="text-xs text-slate-400">Pending admin verification</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-black text-white mb-2">Request submitted!</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We'll review your claim and be in touch at <span className="text-emerald-400 font-semibold">{form.email}</span> shortly.
            </p>
            <button onClick={onClose} className="mt-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-sm font-bold text-white transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Full name *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                  placeholder="Your name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                  placeholder="you@club.com.au" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                  placeholder="04xx xxx xxx" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Your role at the club</label>
                <input value={form.role_at_club} onChange={e => setForm(p => ({ ...p, role_at_club: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                  placeholder="e.g. Club Secretary, Head Coach, President" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Why are you claiming this profile?</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={3} placeholder="Tell us a bit about yourself and your club…"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-none" />
              </div>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 py-3 text-sm font-bold text-white transition-colors">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : 'Submit claim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function trophyTier(phase) {
  if (phase === 'M')                   return { icon: '🥇', border: 'border-amber-500/40',  bg: 'bg-amber-500/10',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'   }
  if (phase === 'E1' || phase === 'E2') return { icon: '🥈', border: 'border-slate-400/30',  bg: 'bg-slate-400/10',   badge: 'bg-slate-400/20 text-slate-200 border-slate-400/30'   }
  if (phase?.startsWith('T'))          return { icon: '🥉', border: 'border-orange-500/30', bg: 'bg-orange-500/8',   badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' }
  return                                      { icon: '🏅', border: 'border-emerald-500/20',bg: 'bg-emerald-500/8',  badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
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

function AnnouncePeek({ a }) {
  const [open, setOpen] = useState(false)
  const cat   = ANNOUNCE_CAT[a.category] || ANNOUNCE_CAT.general
  const emoji = a.emoji || cat.emoji
  const long  = a.body && a.body.length > 200

  return (
    <div className={`rounded-2xl border overflow-hidden ${cat.color} bg-white/5`}>
      {/* Hero image */}
      {a.image_url && (
        <img src={a.image_url} alt="" className="w-full object-contain" />
      )}
      <div className="p-5">
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
    </div>
  )
}

export default function ClubProfile() {
  const { slug } = useParams()
  const [data,       setData]      = useState(null)
  const [loading,    setLoading]   = useState(true)
  const [showClaim,  setShowClaim] = useState(false)

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

  const { club, athletes, ftemDist, milestones, events, announcements, clubTrophies } = data
  const sportMeta   = SPORTS.find(s => s.value === club.sport)
  const athleteList = athletes ?? []
  const ftem        = ftemDist ?? {}
  const phases      = Object.keys(ftem).length
  const hasCover    = !!club.cover_image_url
  const hasLogo     = !!club.logo_url
  const hasEvents   = events && events.length > 0
  const hasMile     = milestones && milestones.length > 0
  const hasAnnounce = announcements && announcements.length > 0
  const hasTrophies = clubTrophies && clubTrophies.length > 0

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Nav */}
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
              <ArrowLeft className="h-4 w-4" /> All clubs
            </Link>
            <Link to="/?modal=login"  className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/?modal=signup" className="rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-4 py-2 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
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
            {/* Logo / sport emoji */}
            <div className={`flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl border-2 border-white/20 shadow-2xl text-4xl sm:text-5xl overflow-hidden ${hasCover ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-white/5'}`}>
              {hasLogo && (
                <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover rounded-3xl"
                  onError={e => { e.target.style.display = 'none' }} />
              )}
              {!hasLogo && <span>{sportMeta?.emoji ?? '🏆'}</span>}
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

              {/* Contact & social */}
              <div className="mt-4 flex flex-wrap gap-4">
                {club.website && (
                  <a href={club.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
                {club.contact_email && (
                  <a href={`mailto:${club.contact_email}`}
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
                  </a>
                )}
              </div>

              {club.description && (
                <p className="mt-4 text-slate-400 leading-relaxed max-w-2xl text-sm sm:text-base">{club.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sidebar */}
          <div className="space-y-5 order-2 lg:order-1">

            {athleteList.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Club stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Total athletes</span>
                    <span className="font-black text-white text-2xl">{athleteList.length}</span>
                  </div>
                  {phases > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Dev. phases</span>
                      <span className="font-black text-white text-2xl">{phases}</span>
                    </div>
                  )}
                  {hasTrophies && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Club trophies</span>
                      <span className="font-black text-white text-2xl">{clubTrophies.length}</span>
                    </div>
                  )}
                  {hasMile && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Milestones</span>
                      <span className="font-black text-white text-2xl">{milestones.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {phases > 0 && (
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

            <div className="hidden lg:block rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <div className="text-3xl mb-3">🏟️</div>
              <h3 className="text-base font-black text-white mb-2">Join {club.name}</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Ask your coach to set up your athlete profile and start tracking your development.
              </p>
              <Link to="/?modal=signup"
                className="block w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 py-3 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 text-center">
                Create athlete account
              </Link>
            </div>

            {!club.is_claimed && (
              <div className="hidden lg:block rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center">
                <ShieldCheck className="h-7 w-7 text-slate-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-300 mb-1">Are you from this club?</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Claim this profile to manage your club's presence on PathwayHQ.
                </p>
                <button onClick={() => setShowClaim(true)}
                  className="w-full rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 py-2.5 text-sm font-bold text-slate-300 hover:text-emerald-400 transition-all">
                  Claim this club →
                </button>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">

            {hasEvents && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar className="h-4 w-4 text-purple-400" /> Upcoming sessions
                </h2>
                <div className="space-y-3">
                  {events.map((ev, i) => (
                    <div key={ev.id} className={`flex items-center gap-4 rounded-xl p-3.5 border border-white/5 ${i === 0 ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/[0.02]'}`}>
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
                          {ev.squad_name && (
                            <span className="text-[10px] font-semibold bg-white/10 text-slate-300 rounded-full px-2 py-0.5 shrink-0">{ev.squad_name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {fmtTime(ev.start_time)}
                            {ev.end_time && <> – {fmtTime(ev.end_time)}</>}
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

            {hasTrophies && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Trophy className="h-4 w-4 text-amber-400" /> Club trophy cabinet
                </h2>
                {(() => {
                  const CAT_META = {
                    competition: { emoji: '🏆', label: 'Competition' },
                    award:       { emoji: '⭐', label: 'Award' },
                    sponsorship: { emoji: '🤝', label: 'Sponsorship' },
                    facility:    { emoji: '🏗️', label: 'Facility' },
                    milestone:   { emoji: '🎯', label: 'Milestone' },
                    other:       { emoji: '📌', label: 'Other' },
                  }
                  return (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {clubTrophies.map(t => {
                        const meta = CAT_META[t.category] || CAT_META.other
                        return (
                          <div key={t.id} className="rounded-xl border border-white/8 bg-white/[0.04] overflow-hidden flex flex-col">
                            {t.image_url ? (
                              <div className="relative h-48 bg-slate-900 flex items-center justify-center">
                                <img src={t.image_url} alt={t.title}
                                  className="max-h-48 w-full object-contain"
                                  onError={e => { e.target.parentElement.style.display = 'none' }} />
                                <span className="absolute top-2 left-2 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
                                  {meta.emoji} {meta.label}
                                </span>
                              </div>
                            ) : (
                              <div className="h-20 flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-emerald-500/5 border-b border-white/5">
                                <span className="text-4xl">{meta.emoji}</span>
                              </div>
                            )}
                            <div className="p-4 flex flex-col gap-1 flex-1">
                              {!t.image_url && (
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{meta.label}</span>
                              )}
                              <p className="text-sm font-bold text-white leading-snug">{t.title}</p>
                              {t.description && (
                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{t.description}</p>
                              )}
                              {t.achieved_at && (
                                <p className="text-[11px] text-slate-500 mt-auto pt-2">
                                  {new Date(t.achieved_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            {hasMile && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Trophy className="h-4 w-4 text-emerald-400" /> Athlete milestones
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {milestones.map(m => {
                    const t = trophyTier(m.ftem_phase)
                    return (
                      <div key={m.id} className={`rounded-xl border ${t.border} ${t.bg} p-4 flex items-start gap-3`}>
                        <span className="text-2xl shrink-0 mt-0.5">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white leading-snug line-clamp-2">{m.title}</p>
                          {m.athlete_name && (
                            <p className="text-xs text-slate-400 mt-0.5">{m.athlete_name}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${t.badge}`}>
                              {m.ftem_phase}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {new Date(m.achieved_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4 text-xs text-slate-600 text-right">
                  {athleteList.length} active athlete{athleteList.length !== 1 ? 's' : ''} across {phases} development phase{phases !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {!hasEvents && !hasAnnounce && !hasMile && !hasTrophies && athleteList.length === 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-10 text-center">
                <div className="text-4xl mb-4">🏟️</div>
                <p className="font-bold text-slate-400 text-base">Profile coming soon</p>
                <p className="text-sm text-slate-600 mt-1">This club is setting up their page.</p>
              </div>
            )}

            <div className="lg:hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
              <h3 className="text-xl font-black text-white mb-2">Join {club.name}</h3>
              <p className="text-sm text-slate-400 mb-6">
                Ask your coach to set up your athlete profile and start tracking your development.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/?modal=signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-6 py-3.5 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
                  Create athlete account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/clubs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 px-6 py-3.5 text-sm font-bold transition-all">
                  Browse all clubs
                </Link>
              </div>
              {!club.is_claimed && (
                <button onClick={() => setShowClaim(true)}
                  className="mt-4 w-full rounded-xl border border-white/10 hover:border-emerald-500/30 py-3 text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-all">
                  <ShieldCheck className="h-4 w-4 inline mr-1.5" />Are you from this club? Claim it →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showClaim && <ClaimModal club={club} onClose={() => setShowClaim(false)} />}

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-400">PathwayHQ</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Link to="/clubs"  className="hover:text-slate-300 transition-colors">← All clubs</Link>
            <Link to="/signup" className="hover:text-slate-300 transition-colors">Create your club</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
