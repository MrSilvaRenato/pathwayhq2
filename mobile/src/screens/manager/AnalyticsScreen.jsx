import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import UpgradeSheet from '../../components/UpgradeSheet'

const SCREEN_W = Dimensions.get('window').width

// ── helpers ───────────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function ageGroup(age) {
  if (age === null) return 'Unknown'
  if (age < 10) return 'U10'
  if (age < 12) return 'U12'
  if (age < 14) return 'U14'
  if (age < 16) return 'U16'
  if (age < 18) return 'U18'
  if (age < 21) return 'U21'
  return 'Senior'
}

const AGE_ORDER = ['U10', 'U12', 'U14', 'U16', 'U18', 'U21', 'Senior', 'Unknown']

function milestoneTrend(milestones) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase(),
      count: 0,
    }
  })
  milestones.forEach(m => {
    const d = new Date(m.achieved_at ?? m.created_at ?? m.date)
    if (isNaN(d)) return
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const slot = months.find(mo => mo.key === key)
    if (slot) slot.count++
  })
  return months
}

function sessionsThisMonth(events) {
  const now = new Date()
  return events.filter(ev => {
    const d = new Date(ev.start_time)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
}

function lastUpdatedLabel() {
  return new Date().toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const GENDER_COLORS = {
  male:    '#3b82f6',
  female:  '#10b981',
  other:   '#a855f7',
}

function ftemBarColor(phase) {
  if (phase.startsWith('F')) return '#94a3b8'
  if (phase.startsWith('T')) return '#3b82f6'
  if (phase.startsWith('E')) return '#10b981'
  return '#f59e0b'
}

// ── sub-components ────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>
}

function CardTitle({ children }) {
  return <Text style={s.cardTitle}>{children}</Text>
}

function Empty({ msg = 'No data yet' }) {
  return <Text style={s.emptyText}>{msg}</Text>
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const [athletes,   setAthletes]   = useState([])
  const [milestones, setMilestones] = useState([])
  const [events,     setEvents]     = useState([])
  const [squads,     setSquads]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [upgrade,    setUpgrade]    = useState(null)
  const [lastUpdated] = useState(lastUpdatedLabel())

  useEffect(() => {
    Promise.allSettled([
      api.get('/club/plan'),
      api.get('/athletes'),
      api.get('/milestones'),
      api.get('/events'),
      api.get('/squads'),
    ]).then(([plan, a, m, e, sq]) => {
      if (plan.status === 'fulfilled' && plan.value.data?.tier === 'free') {
        setUpgrade({ message: 'Analytics is available on the Pro plan and above. Upgrade to see detailed club insights.', requiredPlan: 'pro' })
      }
      if (a.status  === 'fulfilled') setAthletes(Array.isArray(a.value.data)  ? a.value.data  : [])
      if (m.status  === 'fulfilled') setMilestones(Array.isArray(m.value.data) ? m.value.data : [])
      if (e.status  === 'fulfilled') setEvents(Array.isArray(e.value.data)    ? e.value.data  : [])
      if (sq.status === 'fulfilled') setSquads(Array.isArray(sq.value.data)   ? sq.value.data : [])
    }).finally(() => setLoading(false))
  }, [])

  const computed = useMemo(() => {
    const total    = athletes.length
    const active   = athletes.filter(a => a.is_active !== false && a.invite_status === 'accepted').length
    const inactive = total - active

    // FTEM
    const ftemDist = {}
    athletes.forEach(a => { if (a.ftem_phase) ftemDist[a.ftem_phase] = (ftemDist[a.ftem_phase] ?? 0) + 1 })
    const ftemRows = Object.keys(FTEM_PHASES)
      .filter(k => ftemDist[k] > 0)
      .map(k => ({ phase: k, count: ftemDist[k], pct: total ? Math.round((ftemDist[k] / total) * 100) : 0 }))
    const maxFtem = Math.max(...ftemRows.map(r => r.count), 1)

    // Age groups
    const ageDist = {}
    athletes.forEach(a => {
      const g = ageGroup(calcAge(a.dob))
      ageDist[g] = (ageDist[g] ?? 0) + 1
    })
    const ageRows = AGE_ORDER.filter(g => ageDist[g] > 0).map(g => ({ group: g, count: ageDist[g] }))
    const maxAge  = Math.max(...ageRows.map(r => r.count), 1)

    // Gender
    const genderDist = {}
    athletes.forEach(a => {
      const k = (a.gender ?? 'unknown').toLowerCase()
      genderDist[k] = (genderDist[k] ?? 0) + 1
    })
    const genderRows = Object.entries(genderDist)
      .sort((a, b) => b[1] - a[1])
      .map(([g, count]) => ({ g, count, pct: total ? Math.round((count / total) * 100) : 0 }))

    // Sports
    const sportDist = {}
    athletes.forEach(a => { if (a.sport) sportDist[a.sport] = (sportDist[a.sport] ?? 0) + 1 })
    const sportRows = Object.entries(sportDist)
      .sort((a, b) => b[1] - a[1])
      .map(([sport, count]) => ({
        sport, count,
        pct:  total ? Math.round((count / total) * 100) : 0,
        meta: SPORTS.find(s => s.value === sport),
      }))
    const maxSport = Math.max(...sportRows.map(r => r.count), 1)

    // Milestone trend
    const trend    = milestoneTrend(milestones)
    const maxTrend = Math.max(...trend.map(t => t.count), 1)

    // Squads
    const squadRows = squads
      .map(sq => {
        const count = athletes.filter(a =>
          Array.isArray(a.squad_ids) ? a.squad_ids.includes(sq.id) : a.squad_id === sq.id
        ).length
        return { name: sq.name, count, pct: total ? Math.round((count / total) * 100) : 0 }
      })
      .sort((a, b) => b.count - a.count)

    return {
      total, active, inactive,
      ftemRows, maxFtem,
      ageRows, maxAge,
      genderRows,
      sportRows, maxSport,
      trend, maxTrend,
      squadRows,
      sessionsThisMonth: sessionsThisMonth(events),
    }
  }, [athletes, milestones, events, squads])

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const {
    total, active, inactive,
    ftemRows, maxFtem,
    ageRows, maxAge,
    genderRows,
    sportRows, maxSport,
    trend, maxTrend,
    squadRows,
  } = computed

  const statPills = [
    { label: 'Total athletes',      value: total,                       icon: 'people-outline',   color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Active athletes',     value: active,                      icon: 'trending-up-outline', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Inactive athletes',   value: inactive,                    icon: 'remove-circle-outline', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Total milestones',    value: milestones.length,           icon: 'trophy-outline',   color: '#d97706', bg: '#fffbeb' },
    { label: 'Sessions this month', value: computed.sessionsThisMonth,  icon: 'calendar-outline', color: '#7c3aed', bg: '#f5f3ff' },
  ]

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.heading}>Club Intelligence</Text>
            <Text style={s.headingSub}>Live snapshot of your club</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.lastUpdatedLabel}>Last updated</Text>
            <Text style={s.lastUpdatedVal}>{lastUpdated}</Text>
          </View>
        </View>

        {/* Stat pills — 2 per row wrapped grid */}
        <View style={s.pillGrid}>
          {statPills.map(p => (
            <View key={p.label} style={s.pillCard}>
              <View style={[s.pillIcon, { backgroundColor: p.bg }]}>
                <Ionicons name={p.icon} size={16} color={p.color} />
              </View>
              <Text style={s.pillValue}>{p.value}</Text>
              <Text style={s.pillLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* FTEM Development Pathway */}
        <Card>
          <CardTitle>Development Pathway</CardTitle>
          {ftemRows.length === 0 ? (
            <Empty msg="No FTEM data — assign phases to athletes" />
          ) : (
            <View style={{ gap: 10 }}>
              {ftemRows.map(({ phase, count, pct }) => {
                const barW  = Math.round((count / maxFtem) * 100)
                const meta  = FTEM_PHASES[phase]
                const color = ftemBarColor(phase)
                return (
                  <View key={phase} style={s.barRow}>
                    <View style={[s.phasePill, { backgroundColor: meta?.bgColor ?? '#f1f5f9' }]}>
                      <Text style={[s.phasePillText, { color: meta?.textColor ?? '#475569' }]}>{phase}</Text>
                    </View>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${barW}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={s.barCount}>{count}</Text>
                    <Text style={s.barPct}>{pct}%</Text>
                  </View>
                )
              })}
            </View>
          )}
        </Card>

        {/* Age groups — vertical bar chart */}
        <Card>
          <CardTitle>Age Groups</CardTitle>
          {ageRows.length === 0 ? (
            <Empty msg="Add date of birth to athletes" />
          ) : (
            <View style={s.barChart}>
              {ageRows.map(({ group, count }) => {
                const heightPct = Math.max(Math.round((count / maxAge) * 100), 8)
                return (
                  <View key={group} style={s.barChartCol}>
                    <Text style={s.barChartCount}>{count}</Text>
                    <View style={s.barChartTrack}>
                      <View style={[s.barChartFill, { height: `${heightPct}%`, backgroundColor: '#3b82f6' }]} />
                    </View>
                    <Text style={s.barChartLabel}>{group}</Text>
                  </View>
                )
              })}
            </View>
          )}
        </Card>

        {/* Gender split */}
        <Card>
          <CardTitle>Gender Split</CardTitle>
          {genderRows.length === 0 ? (
            <Empty />
          ) : (
            <View style={{ gap: 12 }}>
              {genderRows.map(({ g, count, pct }) => {
                const color = GENDER_COLORS[g] ?? '#94a3b8'
                return (
                  <View key={g}>
                    <View style={s.genderRow}>
                      <Text style={[s.genderLabel, { color }]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                      <Text style={s.genderCount}>{count} <Text style={s.genderPct}>({pct}%)</Text></Text>
                    </View>
                    <View style={s.thinTrack}>
                      <View style={[s.thinFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </Card>

        {/* Sport breakdown */}
        <Card>
          <CardTitle>Sport Breakdown</CardTitle>
          {sportRows.length === 0 ? (
            <Empty />
          ) : (
            <View style={{ gap: 10 }}>
              {sportRows.map(({ sport, count, pct, meta }) => (
                <View key={sport} style={s.barRow}>
                  <Text style={s.sportEmoji}>{meta?.emoji ?? '🏅'}</Text>
                  <Text style={s.sportName} numberOfLines={1}>{meta?.label ?? sport}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${Math.round((count / maxSport) * 100)}%`, backgroundColor: '#6366f1' }]} />
                  </View>
                  <Text style={s.barCount}>{count}</Text>
                  <Text style={s.barPct}>{pct}%</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Milestone activity — 6-month trend bar chart */}
        <Card>
          <CardTitle>Milestone Activity</CardTitle>
          {milestones.length === 0 ? (
            <Empty msg="No milestones recorded yet" />
          ) : (
            <View style={s.barChart}>
              {trend.map(({ label, count }) => {
                const heightPct = count > 0 ? Math.max(Math.round((count / maxTrend) * 100), 8) : 0
                return (
                  <View key={label} style={s.barChartCol}>
                    {count > 0 ? <Text style={s.barChartCount}>{count}</Text> : <Text style={s.barChartCount}> </Text>}
                    <View style={s.barChartTrack}>
                      {count > 0
                        ? <View style={[s.barChartFill, { height: `${heightPct}%`, backgroundColor: '#f59e0b' }]} />
                        : <View style={[s.barChartFill, { height: 4, backgroundColor: '#f1f5f9' }]} />
                      }
                    </View>
                    <Text style={s.barChartLabel}>{label}</Text>
                  </View>
                )
              })}
            </View>
          )}
        </Card>

        {/* Squad overview */}
        {squadRows.length > 0 && (
          <Card>
            <CardTitle>Squad Overview</CardTitle>
            <View style={s.squadTable}>
              <View style={[s.squadRow, s.squadHeader]}>
                <Text style={[s.squadCell, s.squadName, s.squadHeaderText]}>Squad</Text>
                <Text style={[s.squadCell, s.squadNum, s.squadHeaderText]}>Athletes</Text>
                <View style={[s.squadCell, s.squadBar]} />
                <Text style={[s.squadCell, s.squadPct, s.squadHeaderText]}>%</Text>
              </View>
              {squadRows.map(({ name, count, pct }) => (
                <View key={name} style={s.squadRow}>
                  <Text style={[s.squadCell, s.squadName]} numberOfLines={1}>{name}</Text>
                  <Text style={[s.squadCell, s.squadNum]}>{count}</Text>
                  <View style={[s.squadCell, s.squadBar]}>
                    <View style={s.squadBarTrack}>
                      <View style={[s.squadBarFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                  <Text style={[s.squadCell, s.squadPct]}>{pct}%</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
      <UpgradeSheet
        visible={!!upgrade}
        message={upgrade?.message}
        requiredPlan={upgrade?.requiredPlan ?? 'pro'}
        onClose={null}
      />
    </SafeAreaView>
  )
}

const PILL_W = (SCREEN_W - spacing.md * 2 - 10) / 2

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  heading: { fontSize: font.xl, fontWeight: '900', color: colors.text },
  headingSub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  lastUpdatedLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'right' },
  lastUpdatedVal: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary, textAlign: 'right' },

  // Stat pills grid
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.md },
  pillCard: {
    width: PILL_W, backgroundColor: '#fff',
    borderRadius: radius.lg, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 4,
  },
  pillIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  pillValue: { fontSize: font.xl, fontWeight: '900', color: colors.text, lineHeight: 26 },
  pillLabel: { fontSize: 10, color: colors.textMuted, lineHeight: 14 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
  },
  emptyText: { fontSize: font.xs, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },

  // Horizontal bar rows (FTEM, sport)
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phasePill: { width: 36, borderRadius: 6, alignItems: 'center', paddingVertical: 3 },
  phasePillText: { fontSize: 10, fontWeight: '800' },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 4 },
  barCount: { fontSize: font.xs, fontWeight: '700', color: '#475569', width: 20, textAlign: 'right' },
  barPct:   { fontSize: 10, color: colors.textMuted, width: 34, textAlign: 'right' },

  // Sport row additions
  sportEmoji: { fontSize: 16, width: 22, textAlign: 'center' },
  sportName:  { fontSize: font.xs, color: colors.textSecondary, width: 80 },

  // Vertical bar chart (age groups, milestone trend)
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 },
  barChartCol: { flex: 1, alignItems: 'center', gap: 4 },
  barChartCount: { fontSize: 9, fontWeight: '700', color: colors.textMuted },
  barChartTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  barChartFill: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barChartLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },

  // Gender
  genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  genderLabel: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  genderCount: { fontSize: 11, fontWeight: '700', color: colors.text },
  genderPct: { fontSize: 11, fontWeight: '400', color: colors.textMuted },
  thinTrack: { height: 6, borderRadius: 3, backgroundColor: colors.background, overflow: 'hidden' },
  thinFill:  { height: '100%', borderRadius: 3 },

  // Squad table
  squadTable: {},
  squadRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  squadHeader: { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  squadHeaderText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  squadCell: { },
  squadName: { flex: 2, fontSize: font.sm, fontWeight: '600', color: colors.text },
  squadNum:  { width: 50, fontSize: font.sm, fontWeight: '700', color: colors.text, textAlign: 'right', paddingRight: 10 },
  squadBar:  { flex: 3, paddingHorizontal: 8 },
  squadBarTrack: { height: 6, borderRadius: 3, backgroundColor: colors.background, overflow: 'hidden' },
  squadBarFill:  { height: '100%', borderRadius: 3, backgroundColor: '#3b82f6' },
  squadPct: { width: 36, fontSize: font.xs, color: colors.textMuted, textAlign: 'right' },
})
