import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Trophy, Calendar, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { FTEM_PHASES } from '../../lib/constants'

export default function Dashboard() {
  const { user } = useAuth()
  const [athletes,   setAthletes]   = useState([])
  const [milestones, setMilestones] = useState([])
  const [events,     setEvents]     = useState([])

  useEffect(() => {
    api.get('/athletes').then(r => setAthletes(r.data))
    api.get('/milestones').then(r => setMilestones(r.data.slice(0, 5)))
    api.get('/events').then(r => setEvents(r.data.slice(0, 5)))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const ftemDist = athletes.reduce((acc, a) => { acc[a.ftem_phase] = (acc[a.ftem_phase] || 0) + 1; return acc }, {})
  const active   = athletes.filter(a => a.is_active).length

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">{greeting}, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-1 text-sm">Here's what's happening with your club today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total athletes', value: athletes.length, icon: Users,    color: 'bg-blue-50 text-blue-600',    href: '/athletes' },
          { label: 'Active',         value: active,          icon: Zap,      color: 'bg-emerald-50 text-emerald-600', href: '/athletes' },
          { label: 'Milestones',     value: milestones.length,icon: Trophy,  color: 'bg-amber-50 text-amber-600',  href: '/milestones' },
          { label: 'Events',         value: events.length,   icon: Calendar, color: 'bg-purple-50 text-purple-600', href: '/calendar' },
        ].map(s => (
          <Link key={s.label} to={s.href} className="rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-all p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color} mb-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-black text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* FTEM breakdown */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">FTEM Distribution</h2>
            <Link to="/analytics" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
              Analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {athletes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No athletes yet. <Link to="/athletes" className="text-emerald-600 underline">Add your first athlete</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.keys(FTEM_PHASES).map(phase => {
                const count = ftemDist[phase] ?? 0
                if (!count) return null
                const pct = Math.round((count / athletes.length) * 100)
                return (
                  <div key={phase} className="flex items-center gap-3">
                    <span className={`inline-flex w-10 justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${FTEM_PHASES[phase].color}`}>{phase}</span>
                    <div className="flex-1 rounded-full bg-slate-100 h-2">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent milestones */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">Recent Milestones</h2>
            <Link to="/milestones" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No milestones recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {milestones.map(m => (
                <div key={m.id} className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <Trophy className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{m.title}</p>
                    <p className="text-xs text-slate-500">{m.first_name} {m.last_name} · {new Date(m.achieved_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[m.ftem_phase]?.color ?? ''}`}>{m.ftem_phase}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
