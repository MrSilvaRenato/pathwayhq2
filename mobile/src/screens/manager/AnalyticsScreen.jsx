import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  TextInput, Alert, ScrollView, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import Avatar from '../../components/Avatar'

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

function HorizBar({ label, count, total, color = colors.primary }) {
  const pct = total > 0 ? count / total : 0
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
      <Text style={styles.barPct}>{Math.round(pct * 100)}%</Text>
    </View>
  )
}

export default function AnalyticsScreen() {
  const [athletes, setAthletes] = useState([])
  const [events, setEvents] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/athletes'),
      api.get('/events'),
      api.get('/milestones'),
    ]).then(([a, e, m]) => {
      if (a.status === 'fulfilled') setAthletes(Array.isArray(a.value.data) ? a.value.data : [])
      if (e.status === 'fulfilled') setEvents(Array.isArray(e.value.data) ? e.value.data : [])
      if (m.status === 'fulfilled') setMilestones(Array.isArray(m.value.data) ? m.value.data : [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>

  const active = athletes.filter(a => a.is_active !== false && a.invite_status === 'accepted')
  const total = active.length

  // FTEM distribution
  const ftemCounts = {}
  active.forEach(a => { if (a.ftem_phase) ftemCounts[a.ftem_phase] = (ftemCounts[a.ftem_phase] ?? 0) + 1 })

  // Age distribution
  const ageCounts = {}
  active.forEach(a => {
    const g = ageGroup(calcAge(a.dob))
    ageCounts[g] = (ageCounts[g] ?? 0) + 1
  })
  const AGE_ORDER = ['U10','U12','U14','U16','U18','U21','Senior','Unknown']

  // Gender distribution
  const genderCounts = {}
  active.forEach(a => {
    const g = a.gender ?? 'Unknown'
    genderCounts[g] = (genderCounts[g] ?? 0) + 1
  })

  // Sport distribution
  const sportCounts = {}
  active.forEach(a => { if (a.sport) sportCounts[a.sport] = (sportCounts[a.sport] ?? 0) + 1 })

  // Sessions this month
  const now = new Date()
  const sessionsThisMonth = events.filter(ev => {
    const d = new Date(ev.start_time)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Summary stats */}
        <View style={styles.statRow}>
          {[
            { label: 'Athletes', value: total, icon: 'people-outline' },
            { label: 'Sessions this month', value: sessionsThisMonth, icon: 'calendar-outline' },
            { label: 'Milestones', value: milestones.length, icon: 'trophy-outline' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={18} color={colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* FTEM spread */}
        {Object.keys(ftemCounts).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FTEM Spread</Text>
            <View style={styles.card}>
              {Object.keys(FTEM_PHASES)
                .filter(p => ftemCounts[p] > 0)
                .map(p => (
                  <HorizBar key={p} label={p} count={ftemCounts[p]} total={total} />
                ))}
              <Text style={styles.cardFooter}>{total} total · {total} active</Text>
            </View>
          </View>
        )}

        {/* Age groups */}
        {Object.keys(ageCounts).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Age Groups</Text>
            <View style={styles.card}>
              {AGE_ORDER.filter(g => ageCounts[g] > 0).map(g => (
                <HorizBar key={g} label={g} count={ageCounts[g]} total={total} color="#3b82f6" />
              ))}
            </View>
          </View>
        )}

        {/* Gender */}
        {Object.keys(genderCounts).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gender</Text>
            <View style={styles.card}>
              {Object.entries(genderCounts).map(([g, c]) => (
                <HorizBar key={g} label={g[0].toUpperCase() + g.slice(1)} count={c} total={total} color={g === 'male' ? '#3b82f6' : g === 'female' ? colors.primary : '#a855f7'} />
              ))}
            </View>
          </View>
        )}

        {/* Sport breakdown */}
        {Object.keys(sportCounts).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sports</Text>
            <View style={styles.card}>
              {Object.entries(sportCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([sport, count]) => (
                  <HorizBar key={sport} label={SPORTS.find(s => s.value === sport)?.label ?? sport} count={count} total={total} />
                ))}
            </View>
          </View>
        )}

        {total === 0 && (
          <Text style={styles.emptyText}>No active athlete data to display yet.</Text>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  barLabel: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary, width: 48 },
  barTrack: { flex: 1, height: 10, backgroundColor: colors.background, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barCount: { fontSize: font.xs, color: colors.text, fontWeight: '700', width: 24, textAlign: 'right' },
  barPct: { fontSize: font.xs, color: colors.textMuted, width: 36, textAlign: 'right' },
  cardFooter: { fontSize: font.xs, color: colors.textMuted, marginTop: 4 },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
})
