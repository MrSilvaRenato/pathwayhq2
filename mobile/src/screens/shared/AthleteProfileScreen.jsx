import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'

const PHASE_ORDER = ['F1', 'F2', 'T1', 'T2', 'E1', 'E2', 'M']

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

function fmtDate(dt) {
  return new Date(dt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(a) {
  return `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}

export default function AthleteProfileScreen({ route }) {
  const { isOwnProfile, athleteId } = route?.params ?? {}

  const [athlete, setAthlete] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const athleteRes = isOwnProfile
          ? await api.get('/athletes/me')
          : await api.get(`/athletes/${athleteId}`)

        const a = athleteRes.data
        setAthlete(a)

        const msRes = isOwnProfile
          ? await api.get('/milestones')
          : await api.get(`/milestones/athlete/${athleteId ?? a.id}`)

        setMilestones(Array.isArray(msRes.data) ? msRes.data : [])
      } catch {
        // silently fail — loading state will stay with null athlete
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOwnProfile, athleteId])

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <View style={s.loadWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!athlete) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <View style={s.loadWrap}>
          <Text style={s.errorText}>Could not load profile.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const name = `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim() || athlete.name || '—'
  const phaseMeta = FTEM_PHASES[athlete.ftem_phase]
  const sportMeta = SPORTS.find(s => s.value === athlete.sport)
  const age = calcAge(athlete.dob)
  const currentPhaseIdx = PHASE_ORDER.indexOf(athlete.ftem_phase)

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Dark hero ── */}
        <View style={s.hero}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            {athlete.avatar_url ? (
              <Image source={{ uri: athlete.avatar_url }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>{initials(athlete)}</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={s.heroName}>{name}</Text>

          {/* Chips row */}
          <View style={s.heroChips}>
            {athlete.club_name ? (
              <View style={s.heroChip}>
                <Ionicons name="shield-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={s.heroChipText}>{athlete.club_name}</Text>
              </View>
            ) : null}
            {sportMeta ? (
              <View style={s.heroChip}>
                <Text style={s.heroChipText}>{sportMeta.emoji} {sportMeta.label}</Text>
              </View>
            ) : null}
            {athlete.position ? (
              <View style={[s.heroChip, s.heroChipIndigo]}>
                <Text style={[s.heroChipText, s.heroChipTextIndigo]}>{athlete.position}</Text>
              </View>
            ) : null}
          </View>

          {/* FTEM badge */}
          {phaseMeta ? (
            <View style={[s.phaseBadge, { backgroundColor: phaseMeta.bgColor }]}>
              <Text style={[s.phaseBadgeText, { color: phaseMeta.textColor }]}>
                {athlete.ftem_phase} · {phaseMeta.label}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Stats tiles ── */}
        <View style={s.statsRow}>
          <View style={[s.statTile, s.statBorder]}>
            <Text style={s.statNum}>{milestones.length}</Text>
            <Text style={s.statLabel}>Achievements</Text>
          </View>
          <View style={[s.statTile, s.statBorder]}>
            <Text style={s.statNum}>{athlete.ftem_phase ?? '—'}</Text>
            <Text style={s.statLabel}>FTEM Phase</Text>
          </View>
          <View style={s.statTile}>
            <Text style={[s.statNum, { fontSize: 22 }]}>{sportMeta?.emoji ?? '🏅'}</Text>
            <Text style={s.statLabel}>{sportMeta?.label ?? 'Sport'}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── About chips ── */}
          {(age !== null || athlete.gender || athlete.is_active !== undefined) ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About</Text>
              <View style={s.chipWrap}>
                {age !== null ? (
                  <View style={s.chip}>
                    <Text style={s.chipText}>Age {age}</Text>
                  </View>
                ) : null}
                {athlete.gender ? (
                  <View style={s.chip}>
                    <Text style={s.chipText}>{athlete.gender.charAt(0).toUpperCase() + athlete.gender.slice(1)}</Text>
                  </View>
                ) : null}
                <View style={[s.chip, athlete.is_active !== false ? s.chipActive : s.chipInactive]}>
                  <Text style={[s.chipText, athlete.is_active !== false ? s.chipTextActive : null]}>
                    {athlete.is_active !== false ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* ── Development Pathway ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Development Pathway</Text>
            <View style={s.pathwayCard}>
              {PHASE_ORDER.map((phase, idx) => {
                const meta = FTEM_PHASES[phase]
                const isCurrent = phase === athlete.ftem_phase
                const isPast = currentPhaseIdx > -1 && idx < currentPhaseIdx
                const isLast = idx === PHASE_ORDER.length - 1
                return (
                  <View key={phase} style={[s.pathwayRow, !isLast && s.pathwayRowBorder]}>
                    <View style={[
                      s.pathwayDot,
                      isCurrent && s.pathwayDotCurrent,
                      isPast && s.pathwayDotPast,
                    ]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.pathwayPhase, isCurrent && s.pathwayPhaseCurrent]}>
                        {phase}
                      </Text>
                      <Text style={[s.pathwayLabel, isCurrent && s.pathwayLabelCurrent]}>
                        {meta.label}
                      </Text>
                    </View>
                    {isCurrent ? (
                      <View style={s.currentBadge}>
                        <Text style={s.currentBadgeText}>Current</Text>
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </View>
          </View>

          {/* ── Trophy Cabinet ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Trophy Cabinet{milestones.length > 0 ? ` (${milestones.length})` : ''}
            </Text>

            {milestones.length === 0 ? (
              <View style={s.emptyCard}>
                <Ionicons name="trophy-outline" size={28} color={colors.textMuted} />
                <Text style={s.emptyText}>No achievements yet.</Text>
              </View>
            ) : (
              <View style={s.timeline}>
                <View style={s.timelineLine} />
                {milestones.map((m, i) => {
                  const meta = FTEM_PHASES[m.ftem_phase]
                  return (
                    <View key={m.id ?? i} style={s.timelineItem}>
                      <View style={s.timelineDot} />
                      <View style={s.msCard}>
                        <View style={s.msHeader}>
                          <Text style={s.msEmoji}>🏅</Text>
                          <Text style={s.msTitle} numberOfLines={2}>{m.title}</Text>
                          {m.ftem_phase ? (
                            <View style={[s.msPhaseBadge, { backgroundColor: meta?.bgColor ?? '#f1f5f9' }]}>
                              <Text style={[s.msPhaseText, { color: meta?.textColor ?? '#334155' }]}>{m.ftem_phase}</Text>
                            </View>
                          ) : null}
                        </View>
                        {m.description ? <Text style={s.msDesc}>{m.description}</Text> : null}
                        {m.club_name ? (
                          <View style={s.msClub}>
                            <Ionicons name="shield-outline" size={10} color="#92400e" />
                            <Text style={s.msClubText}>{m.club_name}</Text>
                          </View>
                        ) : null}
                        <Text style={s.msDate}>{fmtDate(m.achieved_at ?? m.date)}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* ── Club card ── */}
          {athlete.club_name ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Club</Text>
              <View style={s.clubCard}>
                <View style={s.clubIcon}>
                  <Ionicons name="shield" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.clubName}>{athlete.club_name}</Text>
                  {(athlete.club_city || athlete.club_state) ? (
                    <Text style={s.clubLocation}>
                      {[athlete.club_city, athlete.club_state].filter(Boolean).join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  loadWrap:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: font.base, color: colors.textMuted },

  // Hero
  hero: {
    backgroundColor: '#052e16',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  avatarWrap: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14, overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    flex: 1, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: '#fff' },
  heroName: { fontSize: font.xxl, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 12 },

  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5,
  },
  heroChipText: { fontSize: font.xs, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroChipIndigo: { backgroundColor: 'rgba(99,102,241,0.25)', borderColor: 'rgba(99,102,241,0.4)' },
  heroChipTextIndigo: { color: '#a5b4fc' },

  phaseBadge: { borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  phaseBadgeText: { fontSize: font.sm, fontWeight: '700' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 0,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.borderLight },
  statNum:   { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Body
  body: { padding: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: font.sm, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },

  // About chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: radius.md, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#d1fae5' },
  chipInactive: { backgroundColor: '#f1f5f9' },
  chipText: { fontSize: font.sm, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#065f46' },

  // Pathway
  pathwayCard: {
    backgroundColor: '#fff', borderRadius: radius.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    overflow: 'hidden',
  },
  pathwayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: spacing.md,
  },
  pathwayRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pathwayDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#e2e8f0',
  },
  pathwayDotCurrent: { backgroundColor: colors.primary, width: 14, height: 14, borderRadius: 7 },
  pathwayDotPast: { backgroundColor: '#a7f3d0' },
  pathwayPhase: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary },
  pathwayPhaseCurrent: { color: colors.primary },
  pathwayLabel: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },
  pathwayLabelCurrent: { color: colors.primaryDark },
  currentBadge: {
    backgroundColor: '#d1fae5', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: '#065f46' },

  // Milestones
  emptyCard: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  emptyText: { fontSize: font.sm, color: colors.textMuted },

  timeline: { paddingLeft: 24, position: 'relative' },
  timelineLine: {
    position: 'absolute', left: 28, top: 16, bottom: 16,
    width: 2, backgroundColor: '#fde68a',
  },
  timelineItem: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#f59e0b', borderWidth: 2, borderColor: '#fff',
    marginLeft: -36, marginRight: 12, marginTop: 14,
    shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 2,
  },
  msCard: {
    flex: 1, backgroundColor: '#fffbeb',
    borderWidth: 1, borderColor: '#fde68a',
    borderRadius: radius.md, padding: 12,
  },
  msHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  msEmoji:  { fontSize: 14, marginTop: 1 },
  msTitle:  { flex: 1, fontSize: font.sm, fontWeight: '700', color: '#1e293b', lineHeight: 19 },
  msPhaseBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  msPhaseText:  { fontSize: 10, fontWeight: '700' },
  msDesc:   { fontSize: font.xs, color: '#64748b', lineHeight: 18, marginBottom: 4 },
  msClub:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  msClubText: { fontSize: 10, color: '#92400e', fontWeight: '600' },
  msDate:   { fontSize: 10, color: colors.textMuted },

  // Club card
  clubCard: {
    backgroundColor: '#fff', borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  clubIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  clubName:     { fontSize: font.base, fontWeight: '700', color: colors.text },
  clubLocation: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
})
