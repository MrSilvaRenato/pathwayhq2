import { useState, useEffect, useMemo } from 'react'
import { Users, Trophy, Calendar, TrendingUp, UserMinus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import UpgradePrompt from '../../components/UpgradePrompt'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function ageGroup(age) {
  if (age === null) return 'Unknown'
  if (age < 10)  return 'U10'
  if (age < 12)  return 'U12'
  if (age < 14)  return 'U14'
  if (age < 16)  return 'U16'
  if (age < 18)  return 'U18'
  if (age < 21)  return 'U21'
  return 'Senior'
}

const AGE_GROUP_ORDER  = ['U10', 'U12', 'U14', 'U16', 'U18', 'U21', 'Senior', 'Unknown']
const AGE_GROUP_COLORS = {
  U10:     'bg-blue-100',
  U12:     'bg-blue-200',
  U14:     'bg-blue-300',
  U16:     'bg-blue-400',
  U18:     'bg-blue-500',
  U21:     'bg-blue-600',
  Senior:  'bg-blue-700',
  Unknown: 'bg-slate-200',
}

const GENDER_COLORS = {
  male:   { bar: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  female: { bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  other:  { bar: 'bg-purple-500',  pill: 'bg-purple-50 text-purple-700 border-purple-200' },
}
function genderColor(g) {
  return GENDER_COLORS[g?.toLowerCase()] || { bar: 'bg-slate-400', pill: 'bg-slate-50 text-slate-600 border-slate-200' }
}

function sessionsThisMonth(events) {
  const now = new Date()
  return events.filter(ev => {
    const d = new Date(ev.start_time)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
}

function milestoneTrend(milestones) {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase(),
      count: 0,
    })
  }
  milestones.forEach(m => {
    const d = new Date(m.created_at || m.date || m.achieved_at)
    if (isNaN(d)) return
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const slot = months.find(mo => mo.key === key)
    if (slot) slot.count++
  })
  return months
}

function lastUpdatedLabel() {
  return new Date().toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-5 space-y-4">
      <Skeleton className="h-7 w-48" />
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-36 shrink-0" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Skeleton className="md:col-span-7 h-52" />
        <Skeleton className="md:col-span-5 h-52" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Skeleton className="md:col-span-3 h-44" />
        <Skeleton className="md:col-span-5 h-44" />
        <Skeleton className="md:col-span-4 h-44" />
      </div>
      <Skeleton className="h-36" />
    </div>
  )
}

function Empty({ msg = 'No data yet' }) {
  return <p className="text-xs text-slate-400 text-center py-6">{msg}</p>
}

function Card({ className = '', children }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-4 ${className}`}>
      {children}
    </div>
  )
}

function CardTitle({ children }) {
  return <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{children}</h2>
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'club_admin' || user?.role === 'site_admin'

  const [athletes,   setAthletes]   = useState([])
  const [milestones, setMilestones] = useState([])
  const [events,     setEvents]     = useState([])
  const [squads,     setSquads]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [lastUpdated]               = useState(lastUpdatedLabel())
  const [upgrade,    setUpgrade]    = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/club/plan').catch(() => null),
      api.get('/athletes').catch(() => ({ data: [] })),
      api.get('/milestones').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
      api.get('/squads').catch(() => ({ data: [] })),
    ]).then(([plan, a, m, e, s]) => {
      if ((plan?.data?.effective_tier ?? plan?.data?.tier) === 'free') {
        setUpgrade({ message: 'Analytics dashboard is available on the Pro plan and above.', requiredPlan: 'pro' })
      }
      setAthletes(a.data ?? [])
      setMilestones(m.data ?? [])
      setEvents(e.data ?? [])
      setSquads(s.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const computed = useMemo(() => {
    // Only count athletes who have accepted their invite (exclude pending/left)
    const accepted = athletes.filter(a => a.invite_status === 'accepted')
    const total    = accepted.length
    const active   = accepted.filter(a => a.is_active).length
    const inactive = total - active

    const ftemDist = accepted.reduce((acc, a) => {
      if (a.ftem_phase) acc[a.ftem_phase] = (acc[a.ftem_phase] || 0) + 1
      return acc
    }, {})
    const ftemRows = Object.keys(FTEM_PHASES)
      .filter(k => ftemDist[k] > 0)
      .map(k => ({ phase: k, count: ftemDist[k], pct: total ? Math.round((ftemDist[k] / total) * 100) : 0 }))
    const maxFtemCount = Math.max(...ftemRows.map(r => r.count), 1)

    const ageDist = accepted.reduce((acc, a) => {
      const g = ageGroup(calcAge(a.dob))
      acc[g] = (acc[g] || 0) + 1
      return acc
    }, {})
    const ageRows = AGE_GROUP_ORDER
      .filter(g => ageDist[g] > 0)
      .map(g => ({ group: g, count: ageDist[g] }))
    const maxAge = Math.max(...ageRows.map(r => r.count), 1)

    const genderDist = accepted.reduce((acc, a) => {
      const k = (a.gender || 'unknown').toLowerCase()
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
    const genderRows = Object.entries(genderDist)
      .sort((a, b) => b[1] - a[1])
      .map(([g, count]) => ({ g, count, pct: total ? Math.round((count / total) * 100) : 0 }))

    const sportDist = accepted.reduce((acc, a) => {
      if (a.sport) acc[a.sport] = (acc[a.sport] || 0) + 1
      return acc
    }, {})
    const sportRows = Object.entries(sportDist)
      .sort((a, b) => b[1] - a[1])
      .map(([sport, count]) => ({
        sport, count,
        pct:  total ? Math.round((count / total) * 100) : 0,
        meta: SPORTS.find(s => s.value === sport),
      }))
    const maxSport = Math.max(...sportRows.map(r => r.count), 1)

    const trend    = milestoneTrend(milestones)
    const maxTrend = Math.max(...trend.map(t => t.count), 1)

    const squadRows = [...squads]
      .map(sq => {
        const count = accepted.filter(a =>
          Array.isArray(a.squad_ids) ? a.squad_ids.includes(sq.id) : a.squad_id === sq.id
        ).length
        return { name: sq.name, count, pct: total ? Math.round((count / total) * 100) : 0 }
      })
      .sort((a, b) => b.count - a.count)

    return {
      total, active, inactive,
      ftemRows, maxFtemCount,
      ageRows, maxAge,
      genderRows,
      sportRows, maxSport,
      trend, maxTrend,
      squadRows,
      sessionsThisMonth: sessionsThisMonth(events),
    }
  }, [athletes, milestones, events, squads])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <p className="text-slate-500 text-sm">Analytics is available to coaches and club admins only.</p>
      </div>
    )
  }

  if (loading) return <LoadingSkeleton />

  const {
    total, active, inactive,
    ftemRows, maxFtemCount,
    ageRows, maxAge,
    genderRows,
    sportRows, maxSport,
    trend, maxTrend,
    squadRows,
  } = computed

  return (
    <>
    <div className="p-4 md:p-5 max-w-7xl mx-auto space-y-4 pb-8">

      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-none">Club Intelligence</h1>
          <p className="text-xs text-slate-400 mt-0.5">Live snapshot of your club</p>
        </div>
        <p className="text-[10px] text-slate-400 text-right leading-tight shrink-0 ml-4">
          Last updated<br />
          <span className="font-semibold text-slate-500">{lastUpdated}</span>
        </p>
      </div>

      {/* ── Row 1 — stat pills (horizontal scroll on mobile) ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-5 scrollbar-none">
        {[
          { label: 'Total athletes',      value: total,                      icon: Users,      color: 'text-blue-600 bg-blue-50' },
          { label: 'Active athletes',     value: active,                     icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Inactive athletes',   value: inactive,                   icon: UserMinus,  color: 'text-rose-600 bg-rose-50' },
          { label: 'Total milestones',    value: milestones.length,          icon: Trophy,     color: 'text-amber-600 bg-amber-50' },
          { label: 'Sessions this month', value: computed.sessionsThisMonth, icon: Calendar,   color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 hover:shadow-sm transition-shadow shrink-0 min-w-[160px] md:min-w-0"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-black text-slate-900 leading-none">{s.value}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2 — FTEM Funnel + Age Groups ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* FTEM Funnel */}
        <Card className="col-span-1 md:col-span-7">
          <CardTitle>Development Pathway</CardTitle>
          {ftemRows.length === 0
            ? <Empty msg="No FTEM data — assign phases to athletes" />
            : (
              <div className="space-y-2">
                {ftemRows.map(({ phase, count, pct }) => {
                  const barWidth  = Math.round((count / maxFtemCount) * 100)
                  const phaseInfo = FTEM_PHASES[phase]
                  return (
                    <div key={phase} className="flex items-center gap-2 md:gap-3">
                      <span className={`shrink-0 w-12 md:w-16 text-center rounded-full py-0.5 text-[10px] font-bold ${phaseInfo.color}`}>
                        {phase}
                      </span>
                      <div className="flex-1 rounded-full bg-slate-100 h-2.5 min-w-0">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            background: phase.startsWith('F') ? '#94a3b8'
                              : phase.startsWith('T') ? '#3b82f6'
                              : phase.startsWith('E') ? '#10b981'
                              : '#f59e0b',
                          }}
                        />
                      </div>
                      <div className="shrink-0 flex items-center gap-1 w-14 md:w-20 justify-end">
                        <span className="text-sm font-bold text-slate-800">{count}</span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>

        {/* Age Groups */}
        <Card className="col-span-1 md:col-span-5">
          <CardTitle>Age Groups</CardTitle>
          {ageRows.length === 0
            ? <Empty msg="Add date of birth to athletes" />
            : (
              <div className="flex items-end gap-1.5 md:gap-2 h-32">
                {ageRows.map(({ group, count }) => {
                  const heightPct = Math.max(Math.round((count / maxAge) * 100), 8)
                  return (
                    <div key={group} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <span className="text-[9px] font-bold text-slate-500">{count}</span>
                      <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${AGE_GROUP_COLORS[group]}`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-[8px] md:text-[9px] font-bold leading-none text-slate-600 truncate w-full text-center">
                        {group}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>
      </div>

      {/* ── Row 3 — Gender + Sport + Milestone trend ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">

        {/* Gender */}
        <Card className="col-span-1 md:col-span-3">
          <CardTitle>Gender Split</CardTitle>
          {genderRows.length === 0
            ? <Empty />
            : (
              <div className="space-y-2">
                {genderRows.map(({ g, count, pct }) => {
                  const colors = genderColor(g)
                  return (
                    <div key={g}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${colors.pill}`}>{g}</span>
                        <span className="text-xs font-bold text-slate-700">{count} <span className="font-normal text-slate-400">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${colors.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>

        {/* Sport breakdown */}
        <Card className="col-span-1 md:col-span-5">
          <CardTitle>Sport Breakdown</CardTitle>
          {sportRows.length === 0
            ? <Empty />
            : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {sportRows.map(({ sport, count, pct, meta }) => (
                  <div key={sport} className="flex items-center gap-2">
                    <span className="text-base shrink-0">{meta?.emoji ?? '🏅'}</span>
                    <span className="text-xs text-slate-600 w-20 md:w-28 truncate shrink-0">{meta?.label ?? sport}</span>
                    <div className="flex-1 rounded-full bg-slate-100 h-1.5 min-w-0">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.round((count / sportRows[0].count) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-5 text-right shrink-0">{count}</span>
                    <span className="text-[10px] text-slate-400 w-7 text-right shrink-0 hidden sm:inline">{pct}%</span>
                  </div>
                ))}
              </div>
            )
          }
        </Card>

        {/* Milestone trend */}
        <Card className="col-span-1 sm:col-span-2 md:col-span-4">
          <CardTitle>Milestone Activity</CardTitle>
          {milestones.length === 0
            ? <Empty msg="No milestones recorded yet" />
            : (
              <div className="flex items-end gap-1.5 h-32">
                {trend.map(({ label, count }) => {
                  const heightPct = Math.max(Math.round((count / maxTrend) * 100), count > 0 ? 6 : 0)
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      {count > 0 && <span className="text-[9px] font-bold text-slate-500">{count}</span>}
                      <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                        {count > 0
                          ? <div
                              className="w-full rounded-t-md bg-amber-400 transition-all duration-500"
                              style={{ height: `${heightPct}%` }}
                            />
                          : <div className="w-full rounded-t-md bg-slate-100" style={{ height: '4px' }} />
                        }
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{label}</span>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>
      </div>

      {/* ── Row 4 — Squad overview ── */}
      <Card>
        <CardTitle>Squad Overview</CardTitle>
        {squadRows.length === 0
          ? <Empty msg="No squads created yet" />
          : (
            /* Horizontal scroll on mobile */
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[360px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Squad</th>
                    <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4 w-20">Athletes</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 w-32 md:w-40">Share</th>
                    <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 w-12">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {squadRows.map(({ name, count, pct }) => (
                    <tr key={name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 pr-4 font-semibold text-slate-800 max-w-[120px] truncate">{name}</td>
                      <td className="py-2 pr-4 text-right font-bold text-slate-900">{count}</td>
                      <td className="py-2 pr-4">
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div
                            className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 text-right text-slate-500">{pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>

    </div>

    {upgrade && (
      <UpgradePrompt
        message={upgrade.message}
        requiredPlan={upgrade.requiredPlan}
      />
    )}
    </>
  )
}
