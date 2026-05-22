import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
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
}

export default function ClubProfile() {
  const { slug } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get(`/clubs/public/${slug}`).then(r => setData(r.data)).catch(() => {})
  }, [slug])

  if (!data) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  )

  const { club, athletes, milestones } = data
  const sportMeta  = SPORTS.find(s => s.value === club.sport)
  const ftemDist   = (athletes ?? []).reduce((acc, a) => { acc[a.ftem_phase] = (acc[a.ftem_phase] || 0) + 1; return acc }, {})
  const eliteCount = (athletes ?? []).filter(a => a.ftem_phase?.startsWith('E') || a.ftem_phase === 'M').length
  const phases     = Object.keys(ftemDist).length

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
            <Link to="/clubs" className="hidden sm:flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> All clubs
            </Link>
            <Link to="/login"  className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 active:scale-95">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

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
                  </a>
                )}
                {club.contact_email && (
                  <a href={`mailto:${club.contact_email}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-slate-400 hover:text-white transition-colors">
                    <Mail className="h-3.5 w-3.5" /> Contact
                  </a>
                )}
              </div>

              {club.description && (
                <p className="mt-4 text-slate-400 leading-relaxed max-w-2xl text-sm sm:text-base">{club.description}</p>
              )}
            </div>
          </div>

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
              </div>
            </div>

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
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-xs text-slate-600 text-right">{athletes?.length ?? 0} active athletes across {phases} development phase{phases !== 1 ? 's' : ''}</p>
            </div>
          </section>
        )}

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

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 sm:px-6 py-8 mt-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">PathwayHQ</span>
          </Link>
          <p className="text-xs text-slate-600">Proudly powered by PathwayHQ · The home of Australian sports development</p>
          <Link to="/clubs" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">← All clubs</Link>
        </div>
      </footer>
    </div>
  )
}
