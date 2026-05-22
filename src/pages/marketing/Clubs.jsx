import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Search, X, MapPin } from 'lucide-react'
import api from '../../lib/api'
import { SPORTS, STATES } from '../../lib/constants'

const OLYMPIC_SPORTS = SPORTS.filter(s => s.in2032)

export default function Clubs() {
  const [clubs, setClubs] = useState([])
  const [q, setQ]         = useState('')
  const [sport, setSport] = useState('')
  const [state, setState] = useState('')

  useEffect(() => { api.get('/clubs/public').then(r => setClubs(r.data)) }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return clubs.filter(c => {
      if (q && !c.name.toLowerCase().includes(ql) && !(c.description ?? '').toLowerCase().includes(ql)) return false
      if (sport && c.sport !== sport) return false
      if (state && c.state !== state) return false
      return true
    })
  }, [clubs, q, sport, state])

  const hasFilters = q || sport || state

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">PathwayHQ</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features"    className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
            <Link to="/brisbane-2032" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Brisbane 2032</Link>
            <Link to="/clubs"         className="text-sm font-medium text-white">Clubs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/?modal=login"  className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/?modal=signup" className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/25">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 60px)' }} />
          <div className="absolute top-0 left-1/4 h-[300px] w-[500px] rounded-full bg-emerald-600/15 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-semibold tracking-wide">Brisbane 2032 Pathway</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-4">
            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">club.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Discover clubs across Australia developing the next generation of athletes for Brisbane 2032 and beyond.
          </p>
        </div>
      </section>

      {/* Search bar */}
      <div className="sticky top-16 z-10 border-b border-white/5 bg-slate-900/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-7xl flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search clubs..."
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            {q && <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <select value={sport} onChange={e => setSport(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All sports</option>
            {OLYMPIC_SPORTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          <select value={state} onChange={e => setState(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All states</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setQ(''); setSport(''); setState('') }}
              className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <span className="ml-auto text-sm text-slate-500 shrink-0">{filtered.length} club{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🏟️</div>
            <p className="text-lg font-bold text-slate-400">No clubs found</p>
            <p className="text-sm text-slate-500 mt-1">{hasFilters ? 'Try adjusting your filters' : 'No public clubs yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(club => {
              const sportMeta = SPORTS.find(s => s.value === club.sport)
              return (
                <Link key={club.id} to={`/club/${club.slug}`}>
                  <div className="group rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-emerald-500/30 transition-all p-5 h-full cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl border border-emerald-500/10">
                        {sportMeta?.emoji ?? '🏅'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{club.name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {sportMeta && <span className="text-slate-400">{sportMeta.label}</span>}
                          {club.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{club.city}{club.state ? `, ${club.state}` : ''}</span>}
                        </div>
                        {club.description && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{club.description}</p>}
                        {sportMeta?.in2032 && (
                          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                            <Zap className="h-3 w-3" /> 2032 sport
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600"><Zap className="h-4 w-4 text-white" /></div>
            <span className="text-sm font-bold">PathwayHQ</span>
          </Link>
          <p className="text-xs text-slate-600">Built in Brisbane · © 2026 PathwayHQ</p>
        </div>
      </footer>
    </div>
  )
}
