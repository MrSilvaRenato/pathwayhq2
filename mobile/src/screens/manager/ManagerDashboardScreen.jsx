import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Card from '../../components/Card'

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function sportLabel(value) {
  return SPORTS.find((s) => s.value === value)?.label ?? value ?? '—'
}

function ftemColor(phase) {
  if (!phase) return 'slate'
  if (phase.startsWith('F')) return 'slate'
  if (phase.startsWith('T')) return 'blue'
  if (phase.startsWith('E')) return 'green'
  if (phase === 'M') return 'amber'
  return 'slate'
}

function StatPill({ iconName, value, label }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={iconName} size={16} color={colors.primary} />
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function FtemBar({ phase, count, total }) {
  const pct = total > 0 ? count / total : 0
  const label = FTEM_PHASES[phase]?.label ?? phase
  return (
    <View style={styles.ftemRow}>
      <Text style={styles.ftemLabel}>{label}</Text>
      <View style={styles.ftemTrack}>
        <View style={[styles.ftemFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={styles.ftemCount}>{count}</Text>
    </View>
  )
}

export default function ManagerDashboardScreen() {
  const { user } = useAuth()
  const [club, setClub] = useState(null)
  const [athletes, setAthletes] = useState([])
  const [events, setEvents] = useState([])
  const [milestones, setMilestones] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [volunteering, setVolunteering] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchAll() {
    try {
      const [cl, at, ev, mi, an, vo] = await Promise.allSettled([
        api.get('/club'),
        api.get('/athletes'),
        api.get('/events'),
        api.get('/milestones'),
        api.get('/announcements'),
        api.get('/volunteering'),
      ])
      if (cl.status === 'fulfilled') setClub(cl.value.data ?? null)
      if (at.status === 'fulfilled') {
        const list = Array.isArray(at.value.data) ? at.value.data : at.value.data?.data ?? []
        setAthletes(list)
      }
      if (ev.status === 'fulfilled') {
        const list = Array.isArray(ev.value.data) ? ev.value.data : ev.value.data?.data ?? []
        const now = new Date()
        setEvents(list.filter(e => new Date(e.start_time) >= now).slice(0, 5))
      }
      if (mi.status === 'fulfilled') {
        const list = Array.isArray(mi.value.data) ? mi.value.data : mi.value.data?.data ?? []
        setMilestones(list.slice(0, 4))
      }
      if (an.status === 'fulfilled') {
        const list = Array.isArray(an.value.data) ? an.value.data : an.value.data?.data ?? []
        setAnnouncements(list.slice(0, 4))
      }
      if (vo.status === 'fulfilled') {
        const list = Array.isArray(vo.value.data) ? vo.value.data : vo.value.data?.data ?? []
        const now = new Date()
        setVolunteering(list.filter(v => new Date(v.date) >= now).slice(0, 3))
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAll()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const activeAthletes = athletes.filter(a => a.is_active !== false && a.invite_status === 'accepted')
  const pendingInvites = athletes.filter(a => a.invite_status === 'pending')

  const ftemCounts = {}
  activeAthletes.forEach(a => {
    if (a.ftem_phase) ftemCounts[a.ftem_phase] = (ftemCounts[a.ftem_phase] ?? 0) + 1
  })
  const ftemPhases = Object.keys(FTEM_PHASES)
  const ftemTotal = Object.values(ftemCounts).reduce((s, n) => s + n, 0)

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Club banner */}
        {club ? (
          <View style={styles.clubBanner}>
            <Avatar name={club.name} size="md" />
            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubSub}>
                {[sportLabel(club.sport), club.city, club.state].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Stats row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsRow}>
          <StatPill iconName="people-outline"     value={activeAthletes.length} label="Athletes" />
          <StatPill iconName="person-add-outline" value={pendingInvites.length} label="Pending Invites" />
          <StatPill iconName="calendar-outline"   value={events.length}         label="Upcoming Sessions" />
          <StatPill iconName="trophy-outline"     value={milestones.length}     label="Milestones" />
          <StatPill iconName="heart-outline"      value={volunteering.length}   label="Volunteer Spots" />
        </ScrollView>

        {/* Upcoming sessions */}
        {events.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            </View>
            {events.map((ev, i) => {
              const d = new Date(ev.start_time)
              return (
                <Card key={ev.id} style={[styles.eventCard, i === 0 && styles.eventCardFirst]}>
                  <View style={styles.eventRow}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateDay}>{d.getDate()}</Text>
                      <Text style={styles.dateMon}>{d.toLocaleString('en-AU', { month: 'short' })}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      <Text style={styles.eventTime}>{formatTime(ev.start_time)}</Text>
                      {ev.location ? <Text style={styles.eventMeta}>{ev.location}</Text> : null}
                      {ev.squad_name ? <Text style={styles.eventMeta}>{ev.squad_name}</Text> : null}
                    </View>
                    {ev.rsvp_counts ? (
                      <View style={styles.rsvpBadge}>
                        <Text style={styles.rsvpCount}>{ev.rsvp_counts.yes ?? 0}</Text>
                        <Text style={styles.rsvpLabel}>going</Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              )
            })}
          </View>
        ) : null}

        {/* FTEM spread */}
        {ftemTotal > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bar-chart-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>FTEM Spread</Text>
              <Text style={styles.sectionSub}>{ftemTotal} athletes</Text>
            </View>
            <Card>
              {ftemPhases.filter(p => ftemCounts[p] > 0).map(phase => (
                <FtemBar key={phase} phase={phase} count={ftemCounts[phase] ?? 0} total={ftemTotal} />
              ))}
            </Card>
          </View>
        ) : null}

        {/* Recent announcements */}
        {announcements.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Announcements</Text>
            </View>
            {announcements.map(a => (
              <Card key={a.id} style={styles.itemCard}>
                <View style={styles.annoRow}>
                  {a.pinned ? <Ionicons name="pin" size={13} color={colors.primary} style={{ marginRight: 4 }} /> : null}
                  <Text style={styles.itemTitle} numberOfLines={1}>{a.title}</Text>
                </View>
                {a.body ? <Text style={styles.itemBody} numberOfLines={2}>{a.body}</Text> : null}
                <Text style={styles.itemMeta}>{formatDate(a.posted_at ?? a.created_at)}</Text>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Recent milestones */}
        {milestones.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recent Milestones</Text>
            </View>
            {milestones.map(m => (
              <Card key={m.id} style={styles.itemCard}>
                <View style={styles.milestoneRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{m.title}</Text>
                    {m.athlete_name ? <Text style={styles.itemMeta}>{m.athlete_name}</Text> : null}
                    <Text style={styles.itemMeta}>{formatDate(m.achieved_at ?? m.date)}</Text>
                  </View>
                  {m.ftem_phase ? <Badge label={FTEM_PHASES[m.ftem_phase]?.label ?? m.ftem_phase} color={ftemColor(m.ftem_phase)} /> : null}
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Volunteering */}
        {volunteering.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Volunteer Spots</Text>
            </View>
            {volunteering.map(v => {
              const remaining = v.spots - (v.signed_up ?? 0)
              return (
                <Card key={v.id} style={styles.itemCard}>
                  <View style={styles.volRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{v.title}</Text>
                      <Text style={styles.itemMeta}>{formatDate(v.date)}</Text>
                    </View>
                    <Badge
                      label={remaining <= 0 ? 'Full' : `${remaining} spots`}
                      color={remaining <= 0 ? 'slate' : 'green'}
                    />
                  </View>
                </Card>
              )
            })}
          </View>
        ) : null}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md, paddingTop: spacing.sm },

  clubBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  clubInfo: { flex: 1 },
  clubName: { fontSize: font.md, fontWeight: '700', color: '#fff' },
  clubSub: { fontSize: font.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  statsScroll: { marginBottom: spacing.md, marginHorizontal: -spacing.md },
  statsRow: { paddingHorizontal: spacing.md, gap: 10 },
  statPill: {
    alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    paddingVertical: 12, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    minWidth: 88,
  },
  statValue: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },

  section: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, flex: 1 },
  sectionSub: { fontSize: font.xs, color: colors.textMuted },

  eventCard: { marginBottom: spacing.sm },
  eventCardFirst: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  dateDay: { fontSize: font.md, fontWeight: '800', color: colors.primary, lineHeight: 20 },
  dateMon: { fontSize: 10, fontWeight: '600', color: colors.primary, textTransform: 'uppercase' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  eventTime: { fontSize: font.sm, color: colors.primary, marginTop: 1 },
  eventMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },
  rsvpBadge: { alignItems: 'center' },
  rsvpCount: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  rsvpLabel: { fontSize: 10, color: colors.textMuted },

  ftemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  ftemLabel: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary, width: 32 },
  ftemTrack: { flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
  ftemFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  ftemCount: { fontSize: font.xs, color: colors.textMuted, width: 24, textAlign: 'right' },

  itemCard: { marginBottom: spacing.sm },
  itemTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: 2 },
  itemBody: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 19 },
  itemMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 4 },

  annoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
