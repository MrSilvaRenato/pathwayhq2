import { useState, useEffect } from 'react'
import { Users, Trophy, Calendar, TrendingUp } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'

export default function Analytics() {
  const [athletes,   setAthletes]   = useState([])
  const [milestones, setMilestones] = useState([])
  const [events,     setEvents]     = useState([])

  useEffect(() => {
    api.get('/athletes').then(r => setAthletes(r.data))
    api.get('/milestones').then(r => setMilestones(r.data))
    api.get('/events').then(r => setEvents(r.data))
  }, [])

  const active   = athletes.filter(a => a.is_active).length
  const inactive = athletes.length - active
  const ftemDist = athletes.reduce((acc, a) => { acc[a.ftem_phase] = (acc[a.ftem_phase] || 0) + 1; return acc }, {})
  const sportDist = athletes.reduce((acc, a) => { acc[a.sport] = (acc[a.sport] || 0) + 1; return acc }, {})
  const genderDist = athletes.reduce((acc, a) => { acc[a.gender] = (acc[a.gender] || 0) + 1; return acc }, {})

  const maxFtem = Math.max(...Object.values(ftemDist), 1)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Analytics</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total athletes', value: athletes.length, icon: Users,    color: 'text-blue-600 bg-blue-50' },
          { label: 'Active',         value: active,          icon: TrendingUp,color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Milestones',     value: milestones.length,icon: Trophy,  color: 'text-amber-600 bg-amber-50' },
          { label: 'Events',         value: events.length,   icon: Calendar, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color} mb-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-black text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* FTEM */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="font-bold text-slate-900 mb-5">FTEM Distribution</h2>
          {athletes.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No data yet</p> : (
            <div className="space-y-3">
              {Object.keys(FTEM_PHASES).map(phase => {
                const count = ftemDist[phase] ?? 0
                const pct   = Math.round((count / maxFtem) * 100)
                return (
                  <div key={phase} className="flex items-center gap-3">
                    <span className={`w-8 text-center rounded-full py-0.5 text-xs font-bold ${FTEM_PHASES[phase].color}`}>{phase}</span>
                    <div className="flex-1 rounded-full bg-slate-100 h-3">
                      <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Gender */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="font-bold text-slate-900 mb-5">Gender split</h2>
          {athletes.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No data yet</p> : (
            <div className="space-y-3">
              {Object.entries(genderDist).map(([g, count]) => {
                const pct = Math.round((count / athletes.length) * 100)
                return (
                  <div key={g} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-slate-500 capitalize">{g}</span>
                    <div className="flex-1 rounded-full bg-slate-100 h-3">
                      <div className="h-3 rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-10 text-right">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sport breakdown */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-2">
          <h2 className="font-bold text-slate-900 mb-5">Sport breakdown</h2>
          {athletes.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No data yet</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(sportDist).sort((a,b) => b[1]-a[1]).map(([sport, count]) => {
                const meta = SPORTS.find(s => s.value === sport)
                return (
                  <div key={sport} className="rounded-xl border border-slate-100 p-4 text-center">
                    <div className="text-2xl mb-1">{meta?.emoji ?? '🏅'}</div>
                    <p className="text-xs text-slate-500 leading-tight">{meta?.label ?? sport}</p>
                    <p className="text-lg font-black text-slate-900 mt-1">{count}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
