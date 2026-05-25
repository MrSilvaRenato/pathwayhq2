import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Zap, ArrowLeft, ArrowRight, Trophy, MapPin, Star, TrendingUp, Globe } from 'lucide-react'
import api from '../../lib/api'
import { SPORTS, FTEM_PHASES } from '../../lib/constants'

function trophyTier(phase) {
  if (phase === 'M')                   return { icon: '🥇', glow: 'shadow-amber-500/30',  border: 'border-amber-500/40',  bg: 'bg-gradient-to-br from-amber-500/15 to-yellow-500/10',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',  label: 'Mastery'    }
  if (phase === 'E1' || phase === 'E2') return { icon: '🥈', glow: 'shadow-slate-300/20',  border: 'border-slate-400/30',  bg: 'bg-gradient-to-br from-slate-400/10 to-slate-500/5',   badge: 'bg-slate-400/20 text-slate-200 border-slate-400/30',  label: 'Elite'      }
  if (phase?.startsWith('T'))          return { icon: '🥉', glow: 'shadow-orange-500/20',  border: 'border-orange-500/30', bg: 'bg-gradient-to-br from-orange-500/10 to-amber-700/5',   badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Talent'    }
  return                                      { icon: '🏅', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/20',bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5',    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Foundation' }
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
}

const FTEM_ORDER = ['F1', 'F2', 'T1', 'T2', 'E1', 'E2', 'M']

export default function AthleteProfile() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.get(`/athletes/public/${slug}`)
      .then(r => setData(r.data))
      .catch(() => setNotFound(true))
  }, [slug])

  if (notFound) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-black text-white mb-2">Profile is private</h1>
      <p className="text-slate-400 mb-6">This athlete hasn't made their profile public yet.</p>
      <Link to="/clubs" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-bold text-white transition-all">
        Browse clubs <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  )

  const { athlete, club, milestones } = data
  const sportMeta   = SPORTS.find(s => s.value === athlete.sport)
  const phase       = FTEM_PHASES[athlete.ftem_phase]
  const tier        = trophyTier(athlete.ftem_phase)
  const phaseIndex  = FTEM_ORDER.indexOf(athlete.ftem_phase)
  const initials    = `${athlete.first_name?.[0] ?? ''}${athlete.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">PathwayHQ</span>
          </Link>
          <div className="flex items-center gap-3">
            {club?.slug && (
              <Link to={`/club/${club.slug}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> {club.name}
              </Link>
            )}
            <Link to="/login"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup"
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 active:scale-95">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        {/* Background glow based on tier */}
        <div className="pointer-events-none absolute inset-0">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full blur-[120px] opacity-30 ${
            athlete.ftem_phase === 'M' ? 'bg-amber-500' :
            athlete.ftem_phase?.startsWith('E') ? 'bg-slate-400' :
            athlete.ftem_phase?.startsWith('T') ? 'bg-orange-500' : 'bg-emerald-600'
          }`} />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`relative h-32 w-32 lg:h-40 lg:w-40 rounded-3xl overflow-hidden flex items-center justify-center text-5xl lg:text-6xl font-black text-white shadow-2xl ${tier.glow} ${
                athlete.ftem_phase === 'M' ? 'bg-gradient-to-br from-amber-400 to-yellow-600' :
                athlete.ftem_phase?.startsWith('E') ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                athlete.ftem_phase?.startsWith('T') ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                'bg-gradient-to-br from-emerald-400 to-emerald-700'
              }`}>
                {athlete.avatar_url
                  ? <img src={athlete.avatar_url} alt={`${athlete.first_name} ${athlete.last_name}`} className="h-full w-full object-cover" />
                  : initials}
              </div>
              {/* Tier icon badge */}
              <div className="absolute -bottom-2 -right-2 text-3xl">{tier.icon}</div>
            </div>

            {/* Info */}
            <div className="text-center lg:text-left flex-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-3">
                {athlete.first_name} {athlete.last_name}
              </h1>

              {/* Chips row */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-5">
                {sportMeta && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium">
                    {sportMeta.emoji} {sportMeta.label}
                  </span>
                )}
                {athlete.gender && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium capitalize">
                    {athlete.gender}
                  </span>
                )}
                {athlete.dob_year && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium">
                    Born {athlete.dob_year}
                  </span>
                )}
                {club && (
                  <Link to={`/club/${club.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                    <Star className="h-3.5 w-3.5" /> {club.name}
                  </Link>
                )}
              </div>

              {/* FTEM phase badge */}
              <div className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 ${tier.badge}`}>
                <TrendingUp className="h-4 w-4" />
                <span className="font-black text-sm">{athlete.ftem_phase}</span>
                <span className="text-sm font-medium opacity-80">·</span>
                <span className="text-sm font-medium">{phase?.label ?? tier.label}</span>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-6 text-center">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">{milestones.length}</div>
              <div className="text-xs text-slate-500 mt-1">Achievements</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">{athlete.ftem_phase}</div>
              <div className="text-xs text-slate-500 mt-1">FTEM Phase</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-2xl sm:text-3xl">{sportMeta?.emoji ?? '🏅'}</div>
              <div className="text-xs text-slate-500 mt-1">{sportMeta?.label ?? 'Sport'}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-12">

        {/* Trophy Cabinet */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Trophy Cabinet</h2>
              <p className="text-xs text-slate-500">{milestones.length} shared achievement{milestones.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {milestones.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-slate-400 text-sm">No achievements shared publicly yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map(m => {
                const t = trophyTier(m.ftem_phase)
                return (
                  <div key={m.id} className={`rounded-2xl border ${t.border} ${t.bg} p-5 shadow-lg ${t.glow} hover:-translate-y-0.5 transition-all`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{t.icon}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${t.badge}`}>
                        {m.ftem_phase}
                      </span>
                    </div>
                    <p className="font-bold text-white text-sm leading-snug mb-3">{m.title}</p>
                    {m.description && (
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{m.description}</p>
                    )}
                    <p className="text-xs text-slate-500">{fmtDate(m.achieved_at)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Development Pathway */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Development Pathway</h2>
              <p className="text-xs text-slate-500">FTEM — Foundation · Talent · Elite · Mastery</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="space-y-2">
              {FTEM_ORDER.map((p, i) => {
                const pMeta   = FTEM_PHASES[p]
                const active  = p === athlete.ftem_phase
                const reached = i <= phaseIndex
                const t       = trophyTier(p)
                return (
                  <div key={p} className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all ${
                    active  ? `${t.bg} border ${t.border}` :
                    reached ? 'bg-white/[0.04] border border-white/5' :
                              'border border-transparent opacity-30'
                  }`}>
                    <span className={`w-8 text-center font-black text-sm ${active ? 'text-white' : reached ? 'text-slate-400' : 'text-slate-600'}`}>{p}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{pMeta?.label ?? p}</p>
                    </div>
                    {active && (
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${t.badge}`}>Current</span>
                    )}
                    {reached && !active && (
                      <span className="text-emerald-500 text-xs font-bold">✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Club section */}
        {club && (
          <section>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-2xl">{SPORTS.find(s => s.value === club.sport)?.emoji ?? '🏅'}</span>
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Competing with</p>
                <h3 className="text-lg font-black text-white">{club.name}</h3>
                {(club.city || club.state) && (
                  <p className="flex items-center justify-center sm:justify-start gap-1 text-sm text-slate-400 mt-1">
                    <MapPin className="h-3.5 w-3.5" /> {[club.city, club.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <Link to={`/club/${club.slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap">
                View club <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-8 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-black text-white mb-2">Track your own pathway</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md mx-auto">
            Join PathwayHQ to log your milestones, connect with your club, and build a public profile
            you can share with pride.
          </p>
          <Link to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-6 py-3.5 font-bold transition-all shadow-xl shadow-emerald-500/25">
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-400 transition-colors">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          Proudly powered by PathwayHQ
        </Link>
      </footer>
    </div>
  )
}
