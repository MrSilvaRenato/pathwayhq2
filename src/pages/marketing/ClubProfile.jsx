import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Zap, MapPin, Users, Trophy, ArrowLeft, ArrowRight, Globe, Mail } from 'lucide-react'
import api from '../../lib/api'
import { SPORTS, FTEM_PHASES } from '../../lib/constants'

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
  const sportMeta = SPORTS.find(s => s.value === club.sport)
  const ftemDist  = (athletes ?? []).reduce((acc, a) => {
    acc[a.ftem_phase] = (acc[a.ftem_phase] || 0) + 1
    return acc
  }, {})

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
            <Link to="/clubs" className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">← All clubs</Link>
            <Link to="/login"  className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 60px)' }} />
          <div className="absolute top-0 left-0 h-[300px] w-[500px] rounded-full bg-emerald-600/15 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
          <Link to="/clubs" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> All clubs
          </Link>
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl sm:text-4xl shadow-xl">
              {sportMeta?.emoji ?? '🏆'}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">{club.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-slate-400 text-sm">
                {sportMeta && <span className="text-slate-300 font-semibold">{sportMeta.label}</span>}
                {club.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {club.city}{club.state ? `, ${club.state}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {athletes?.length ?? 0} athletes
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {club.website && (
                  <a href={club.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    <Globe className="h-3.5 w-3.5" /> Website
                  </a>
                )}
                {club.contact_email && (
                  <a href={`mailto:${club.contact_email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                    <Mail className="h-3.5 w-3.5" /> Contact
                  </a>
                )}
              </div>
            </div>
          </div>
          {club.description && (
            <p className="mt-6 text-slate-400 leading-relaxed max-w-2xl">{club.description}</p>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sidebar stats */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Club stats</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Total athletes</span>
                  <span className="font-bold text-white text-lg">{athletes?.length ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Development phases</span>
                  <span className="font-bold text-white text-lg">{Object.keys(ftemDist).length}</span>
                </div>
                {milestones?.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Recent milestones</span>
                    <span className="font-bold text-white text-lg">{milestones.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* FTEM distribution */}
            {Object.keys(ftemDist).length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Development pathway</h2>
                <div className="space-y-2.5">
                  {Object.keys(FTEM_PHASES).map(phase => {
                    const count = ftemDist[phase] ?? 0
                    if (!count) return null
                    const pct = Math.round((count / (athletes?.length ?? 1)) * 100)
                    return (
                      <div key={phase} className="flex items-center gap-2">
                        <span className={`inline-flex w-12 justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${FTEM_PHASES[phase].color}`}>{phase}</span>
                        <div className="flex-1 rounded-full bg-white/5 h-1.5">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-4 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Recent milestones */}
            {milestones?.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Trophy className="h-4 w-4 text-amber-400" /> Recent achievements
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {milestones.map(m => (
                    <div key={m.id} className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
                      <p className="text-sm font-semibold text-white leading-snug">{m.title}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[m.ftem_phase]?.color ?? ''}`}>{m.ftem_phase}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(m.achieved_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Join CTA */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
              <h2 className="text-xl font-black text-white mb-2">Join {club.name}</h2>
              <p className="text-sm text-slate-400 mb-6">
                Ask your coach to set up your athlete profile and start tracking your development.
              </p>
              <Link to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-6 py-3 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
                Create athlete account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 px-4 sm:px-6 py-8 mt-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">PathwayHQ</span>
          </Link>
          <Link to="/clubs" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">← Back to clubs</Link>
        </div>
      </footer>
    </div>
  )
}
