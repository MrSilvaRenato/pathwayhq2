import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Search, X, MapPin, SortAsc, SortDesc, UserPlus, Loader2 } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { SPORTS, STATES } from '../../lib/constants'

const OLYMPIC_SPORTS = SPORTS.filter(s => s.in2032)

function JoinModal({ club, onClose }) {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post(`/clubs/public/${club.slug}/join-request`, { message })
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Something went wrong.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <UserPlus className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-black text-white text-base">Request to join</h2>
              <p className="text-xs text-slate-400">{club.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!user ? (
          <div className="px-6 py-8 text-center">
            <UserPlus className="h-10 w-10 text-blue-400 mx-auto mb-3" />
            <h3 className="font-black text-white text-lg mb-2">Sign in to request</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Create an account or sign in to request to join {club.name}.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <Link to="/?modal=signup"
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white text-center transition-colors">
                Create account
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/?modal=login" className="text-slate-400 hover:text-white underline transition-colors">Sign in</Link>
            </p>
          </div>
        ) : done ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">🙌</div>
            <h3 className="text-lg font-black text-white mb-2">Request sent!</h3>
            <p className="text-sm text-slate-400 leading-relaxed">The club manager will review your request and get back to you.</p>
            <button onClick={onClose}
              className="mt-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-sm font-bold text-white transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">
                {user.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <p className="text-sm text-slate-400 min-w-0 truncate">
                <span className="text-slate-300 font-semibold">Sending as:</span>{' '}
                {user.full_name} · {user.email}
              </p>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Introduce yourself — position, age group, experience…"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-none"
            />
            <p className="text-right text-xs text-slate-600">{message.length}/500</p>
            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-60 py-3 text-sm font-bold text-white transition-colors">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Send request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ClubCard({ club, onRequestJoin }) {
  const sportMeta = SPORTS.find(s => s.value === club.sport)
  return (
    <div className="flex flex-col">
      <Link to={`/club/${club.slug}`} className="flex-1">
        <div className="group rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-emerald-500/30 transition-all p-4 h-full cursor-pointer">
          <div className="flex items-start gap-3">
            {/* Logo / emoji */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-xl border border-emerald-500/10">
              {club.logo_url
                ? <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover rounded-xl" onError={e => { e.target.style.display = 'none' }} />
                : sportMeta?.emoji ?? '🏅'
              }
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white text-sm leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                {club.name}
              </h2>

              {/* Suburb prominent */}
              {club.city && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                  <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
                  {club.city}
                </p>
              )}

              {/* Founded year */}
              {club.founded_year && (
                <p className="text-[11px] text-slate-600 mt-0.5">Est. {club.founded_year}</p>
              )}

              {/* Badges */}
              <div className="mt-2 flex flex-wrap gap-1">
                {sportMeta?.in2032 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <Zap className="h-2.5 w-2.5" /> 2032
                  </span>
                )}
                {!club.is_claimed && (
                  <span className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    Unclaimed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {club.is_claimed && (
        <button
          onClick={() => onRequestJoin(club)}
          className="w-full mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 py-2 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 transition-all"
        >
          <UserPlus className="h-3 w-3" /> Request to Join
        </button>
      )}
    </div>
  )
}

export default function Clubs() {
  const [clubs,    setClubs]    = useState([])
  const [q,        setQ]        = useState('')
  const [sport,    setSport]    = useState('')
  const [suburb,   setSuburb]   = useState('')
  const [sort,     setSort]     = useState('az') // az | za | oldest | newest
  const [joinClub, setJoinClub] = useState(null)

  useEffect(() => { api.get('/clubs/public').then(r => setClubs(r.data)) }, [])

  // Derive available suburbs from the sport-filtered set (before suburb filter applied)
  const availableSuburbs = useMemo(() => {
    const base = clubs.filter(c => !sport || c.sport === sport)
    const cities = [...new Set(base.map(c => c.city).filter(Boolean))].sort()
    return cities
  }, [clubs, sport])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return clubs
      .filter(c => {
        if (q && !c.name.toLowerCase().includes(ql) && !(c.city ?? '').toLowerCase().includes(ql) && !(c.description ?? '').toLowerCase().includes(ql)) return false
        if (sport  && c.sport !== sport)  return false
        if (suburb && c.city  !== suburb) return false
        return true
      })
      .sort((a, b) => {
        if (sort === 'za')     return b.name.localeCompare(a.name)
        if (sort === 'oldest') return (a.founded_year ?? 9999) - (b.founded_year ?? 9999)
        if (sort === 'newest') return (b.founded_year ?? 0) - (a.founded_year ?? 0)
        return a.name.localeCompare(b.name) // az default
      })
  }, [clubs, q, sport, suburb, sort])

  // A-Z groups — only when not searching/filtering
  const useGroups = !q && !suburb
  const groups = useMemo(() => {
    if (!useGroups) return null
    return filtered.reduce((acc, c) => {
      const letter = c.name[0].toUpperCase()
      if (!acc[letter]) acc[letter] = []
      acc[letter].push(c)
      return acc
    }, {})
  }, [filtered, useGroups])

  const hasFilters = q || sport || suburb
  const letters = groups ? Object.keys(groups).sort() : []

  function clearAll() { setQ(''); setSport(''); setSuburb('') }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">PathwayHQ</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features"     className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
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

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 60px)' }} />
          <div className="absolute top-0 left-1/4 h-[300px] w-[500px] rounded-full bg-emerald-600/15 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-semibold tracking-wide">Brisbane 2032 Pathway</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">club.</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-sm sm:text-base">
            {clubs.length > 0
              ? `${clubs.length} clubs listed across Brisbane and Queensland.`
              : 'Discover clubs developing the next generation of athletes.'}
          </p>
        </div>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-10 border-b border-white/5 bg-slate-900/95 backdrop-blur-md">

        {/* Row 1: search + sport + sort */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-3 pb-2 flex gap-2 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by club name or suburb…"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sport */}
          <select
            value={sport}
            onChange={e => { setSport(e.target.value); setSuburb('') }}
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">All sports</option>
            {OLYMPIC_SPORTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>

          {hasFilters && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-colors shrink-0">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          <span className="ml-auto text-sm text-slate-500 shrink-0 tabular-nums">
            {filtered.length} club{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Row 2: suburb pills */}
        {availableSuburbs.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              <button
                onClick={() => setSuburb('')}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                  !suburb
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                All suburbs
              </button>
              {availableSuburbs.map(s => (
                <button
                  key={s}
                  onClick={() => setSuburb(prev => prev === s ? '' : s)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                    suburb === s
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🏟️</div>
            <p className="text-lg font-bold text-slate-400">No clubs found</p>
            <p className="text-sm text-slate-500 mt-1">
              {hasFilters ? 'Try adjusting your search or filters' : 'No public clubs yet.'}
            </p>
            {hasFilters && (
              <button onClick={clearAll} className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 underline">Clear filters</button>
            )}
          </div>
        ) : useGroups ? (
          // A-Z grouped view
          <div className="space-y-8">
            {letters.map(letter => (
              <div key={letter}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-black text-emerald-400">{letter}</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-xs text-slate-600">{groups[letter].length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {groups[letter].map(club => <ClubCard key={club.id} club={club} onRequestJoin={setJoinClub} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat grid when filtering/searching
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(club => <ClubCard key={club.id} club={club} onRequestJoin={setJoinClub} />)}
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

      {joinClub && <JoinModal club={joinClub} onClose={() => setJoinClub(null)} />}
    </div>
  )
}
