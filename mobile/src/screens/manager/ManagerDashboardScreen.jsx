import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, Modal, Pressable, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, StyleSheet, Dimensions, Linking,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'

const SCREEN_W = Dimensions.get('window').width
const STAT_W = (SCREEN_W - spacing.md * 2 - 8) / 3

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDay(dt) { return new Date(dt).getDate() }
function fmtMon(dt) { return new Date(dt).toLocaleDateString('en-AU', { month: 'short' }).toUpperCase() }
function fmtTime(dt) { return new Date(dt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }) }
function fmtFull(dt) { return new Date(dt).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) }

function sportLabel(value) {
  return SPORTS.find(s => s.value === value)?.label ?? value ?? '—'
}

function initials(name) {
  if (!name) return '?'
  return (name).split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

const COMPACT_THRESHOLD = 7

function SkeletonBlock({ width, height, style }) {
  return (
    <View style={[{ width: width ?? '100%', height: height ?? 16, backgroundColor: '#e5e7eb', borderRadius: radius.md }, style]} />
  )
}

function SkeletonLoader() {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm }} showsVerticalScrollIndicator={false}>
      <SkeletonBlock height={28} width="60%" style={{ marginBottom: 6 }} />
      <SkeletonBlock height={12} width="40%" style={{ marginBottom: spacing.md }} />
      <SkeletonBlock height={80} style={{ borderRadius: radius.lg, marginBottom: spacing.md }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: spacing.md }}>
        {[0, 1, 2, 3, 4].map(i => (
          <SkeletonBlock key={i} width={STAT_W} height={76} style={{ borderRadius: radius.lg }} />
        ))}
      </View>
      <SkeletonBlock height={14} width="45%" style={{ marginBottom: spacing.sm }} />
      {[0, 1, 2].map(i => <SkeletonBlock key={i} height={68} style={{ borderRadius: radius.lg, marginBottom: spacing.sm }} />)}
      <SkeletonBlock height={14} width="40%" style={{ marginBottom: spacing.sm, marginTop: spacing.sm }} />
      {[0, 1].map(i => <SkeletonBlock key={i} height={48} style={{ borderRadius: radius.lg, marginBottom: spacing.sm }} />)}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

function AttendanceModal({ event, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    api.get(`/events/${event.id}/attendees`)
      .then(r => setData(r.data))
      .catch(() => setData({ yes: [], maybe: [], no: [], total: 0 }))
      .finally(() => setLoading(false))
  }, [event.id])

  function StatPill({ value, label }) {
    return (
      <View style={aStyles.statPill}>
        <Text style={aStyles.statValue}>{value}</Text>
        <Text style={aStyles.statLabel}>{label}</Text>
      </View>
    )
  }

  function AvatarCircle({ person, bg, textColor }) {
    if (person.avatar_url) {
      return <Image source={{ uri: person.avatar_url }} style={[aStyles.avatarImg, { backgroundColor: bg }]} />
    }
    return (
      <View style={[aStyles.avatarCircle, { backgroundColor: bg }]}>
        <Text style={[aStyles.avatarInitials, { color: textColor }]}>{initials(person.name)}</Text>
      </View>
    )
  }

  function FullList({ people, bg, textColor }) {
    return (
      <View style={{ gap: 6 }}>
        {people.map((p, i) => (
          <View key={i} style={aStyles.fullRow}>
            <AvatarCircle person={p} bg={bg} textColor={textColor} />
            <View style={{ flex: 1 }}>
              <Text style={aStyles.fullName} numberOfLines={1}>{p.name}</Text>
              {p.email ? <Text style={aStyles.fullEmail} numberOfLines={1}>{p.email}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    )
  }

  function ChipGrid({ people, bg, textColor }) {
    const rows = []
    for (let i = 0; i < people.length; i += 2) {
      rows.push(people.slice(i, i + 2))
    }
    return (
      <View style={{ gap: 6 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 6 }}>
            {row.map((p, pi) => (
              <View key={pi} style={[aStyles.chip, { backgroundColor: bg, flex: 1 }]}>
                <AvatarCircle person={p} bg="rgba(255,255,255,0.6)" textColor={textColor} />
                <Text style={[aStyles.chipName, { color: textColor }]} numberOfLines={1}>
                  {p.name.split(' ')[0]}
                </Text>
              </View>
            ))}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </View>
    )
  }

  function Section({ label, people, iconName, iconColor, bg, textColor }) {
    if (!people || people.length === 0) return null
    const compact = people.length >= COMPACT_THRESHOLD
    return (
      <View style={{ marginBottom: spacing.md }}>
        <View style={aStyles.sectionHeader}>
          <Ionicons name={iconName} size={14} color={iconColor} />
          <Text style={[aStyles.sectionLabel, { color: iconColor }]}>{label}</Text>
          <View style={[aStyles.countBadge, { backgroundColor: bg }]}>
            <Text style={[aStyles.countText, { color: iconColor }]}>{people.length}</Text>
          </View>
        </View>
        {compact
          ? <ChipGrid people={people} bg={bg} textColor={textColor} />
          : <FullList people={people} bg={bg} textColor={textColor} />
        }
      </View>
    )
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={aStyles.backdrop} onPress={onClose}>
        <Pressable style={[aStyles.sheet, { paddingBottom: insets.bottom }]} onPress={e => e.stopPropagation()}>
          <View style={aStyles.handle} />
          <View style={aStyles.header}>
            <View style={aStyles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={aStyles.sessionLabel}>SESSION ATTENDANCE</Text>
                <Text style={aStyles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time-outline" size={12} color="rgba(196,181,253,1)" />
                    <Text style={aStyles.eventMeta}>{fmtFull(event.start_time)} · {fmtTime(event.start_time)}</Text>
                  </View>
                  {event.squad_name ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="people-outline" size={12} color="rgba(196,181,253,1)" />
                      <Text style={aStyles.eventMeta}>{event.squad_name}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity style={aStyles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={aStyles.statRow}>
              {loading ? (
                <ActivityIndicator color="rgba(196,181,253,1)" size="small" style={{ flex: 1 }} />
              ) : data ? (
                <>
                  <StatPill value={data.yes?.length ?? 0} label="Going" />
                  <View style={aStyles.statDivider} />
                  <StatPill value={data.maybe?.length ?? 0} label="Maybe" />
                  <View style={aStyles.statDivider} />
                  <StatPill value={data.no?.length ?? 0} label="Can't go" />
                  <View style={aStyles.statDivider} />
                  <StatPill value={data.total ?? 0} label="Replied" />
                </>
              ) : null}
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}>
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : !data || data.total === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Ionicons name="people-outline" size={24} color="#cbd5e1" />
                </View>
                <Text style={{ fontSize: font.sm, fontWeight: '600', color: '#64748b' }}>No responses yet</Text>
                <Text style={{ fontSize: font.xs, color: colors.textMuted, marginTop: 4 }}>Athletes haven't replied to this session</Text>
              </View>
            ) : (
              <>
                <Section label="Going" people={data.yes} iconName="checkmark-circle-outline" iconColor="#059669" bg="#d1fae5" textColor="#065f46" />
                <Section label="Maybe" people={data.maybe} iconName="help-circle-outline" iconColor="#d97706" bg="#fef3c7" textColor="#92400e" />
                <Section label="Can't make it" people={data.no} iconName="close-circle-outline" iconColor="#dc2626" bg="#fee2e2" textColor="#991b1b" />
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const aStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { backgroundColor: '#7c3aed', paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 14 },
  headerTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  sessionLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(196,181,253,1)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  eventTitle: { fontSize: font.base, fontWeight: '800', color: '#fff', lineHeight: 21 },
  eventMeta: { fontSize: font.xs, color: 'rgba(196,181,253,1)' },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', marginTop: 14, paddingTop: 12, alignItems: 'center' },
  statPill: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: font.lg, fontWeight: '900', color: '#fff', lineHeight: 24 },
  statLabel: { fontSize: 10, color: 'rgba(196,181,253,1)', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { fontSize: font.xs, fontWeight: '700', flex: 1 },
  countBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 10, fontWeight: '900' },
  fullRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarInitials: { fontSize: 11, fontWeight: '700' },
  fullName: { fontSize: font.sm, fontWeight: '600', color: '#1e293b' },
  fullEmail: { fontSize: 11, color: '#94a3b8' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  chipName: { fontSize: font.xs, fontWeight: '600', flex: 1 },
})

export default function ManagerDashboardScreen() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const [club, setClub] = useState(null)
  const [athletes, setAthletes] = useState([])
  const [events, setEvents] = useState([])
  const [milestones, setMilestones] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [volunteering, setVolunteering] = useState([])
  const [planInfo, setPlanInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [attendanceModal, setAttendanceModal] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  async function fetchAll() {
    try {
      const [cl, at, ev, mi, an, vo, notif, pl] = await Promise.allSettled([
        api.get('/club'),
        api.get('/athletes'),
        api.get('/events'),
        api.get('/milestones'),
        api.get('/announcements'),
        api.get('/volunteering'),
        api.get('/notifications'),
        api.get('/club/plan'),
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
        setAnnouncements(list.slice(0, 3))
      }
      if (vo.status === 'fulfilled') {
        const list = Array.isArray(vo.value.data) ? vo.value.data : vo.value.data?.data ?? []
        const now = new Date()
        setVolunteering(list.filter(v => !v.date || new Date(v.date) >= now).slice(0, 3))
      }
      if (notif.status === 'fulfilled') {
        const list = Array.isArray(notif.value.data) ? notif.value.data : notif.value.data?.data ?? []
        setUnreadCount(list.filter(n => !n.is_read).length)
      }
      if (pl.status === 'fulfilled') setPlanInfo(pl.value.data ?? null)
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
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <SkeletonLoader />
      </SafeAreaView>
    )
  }

  const activeAthletes = athletes.filter(a => a.is_active !== false && a.invite_status === 'accepted')
  const pendingInvites = athletes.filter(a => a.invite_status === 'pending')
  const volNeeded = volunteering.filter(v => !v.spots || (v.signed_up ?? 0) < v.spots).length

  const ftemCounts = {}
  activeAthletes.forEach(a => {
    if (a.ftem_phase) ftemCounts[a.ftem_phase] = (ftemCounts[a.ftem_phase] ?? 0) + 1
  })
  const ftemPhases = Object.keys(FTEM_PHASES)
  const ftemTotal = Object.values(ftemCounts).reduce((s, n) => s + n, 0)

  const stats = [
    { iconName: 'people-outline',   value: athletes.length,       label: 'Athletes',   sub: `${activeAthletes.length} active`,  color: '#3b82f6', bg: '#eff6ff', nav: () => navigation.navigate('Athletes') },
    { iconName: 'time-outline',     value: pendingInvites.length, label: 'Pending',    sub: 'awaiting invite',                  color: '#d97706', bg: '#fffbeb', nav: () => navigation.navigate('Athletes') },
    { iconName: 'calendar-outline', value: events.length,         label: 'Sessions',   sub: 'coming up',                       color: '#7c3aed', bg: '#f5f3ff', nav: () => navigation.navigate('Calendar') },
    { iconName: 'trophy-outline',   value: milestones.length,     label: 'Milestones', sub: 'recent',                          color: '#d97706', bg: '#fffbeb', nav: () => navigation.navigate('Awards') },
    { iconName: 'heart-outline',    value: volNeeded,             label: 'Volunteer',  sub: 'spots open',                      color: '#059669', bg: '#ecfdf5', nav: null },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>{greeting()}, {user?.full_name?.split(' ')[0] ?? 'Coach'} 👋</Text>
            <Text style={styles.greetingDate}>{todayLabel()}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('More', { screen: 'NotificationsList' })}
            activeOpacity={0.75}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {club ? (
          <View style={styles.clubBanner}>
            {club.logo_url ? (
              <Image source={{ uri: club.logo_url }} style={styles.clubLogo} resizeMode="contain" />
            ) : (
              <View style={styles.clubIconWrap}>
                <Ionicons name="business-outline" size={28} color="rgba(255,255,255,0.8)" />
              </View>
            )}
            <View style={styles.clubInfo}>
              <Text style={styles.clubLabel}>YOUR CLUB</Text>
              <Text style={styles.clubName} numberOfLines={2}>{club.name}</Text>
              <Text style={styles.clubDetail} numberOfLines={1}>
                {[sportLabel(club.sport), club.city ? `${club.city}${club.state ? `, ${club.state}` : ''}` : null].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('More', { screen: 'SettingsList' })}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={14} color="#fff" />
              <Text style={styles.settingsBtnText}>Settings</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Active trial banner */}
        {planInfo && planInfo.tier === 'free' && planInfo.trial_active && (
          <TouchableOpacity
            style={styles.planCardTrial}
            onPress={() => Linking.openURL('https://ausfairgo.com.au/pricing')}
            activeOpacity={0.85}
          >
            <View style={styles.planCardInner}>
              <View style={styles.planIconWrapTrial}>
                <Ionicons name="flash" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={styles.planTitleTrial}>Pro Trial Active</Text>
                  <View style={styles.planTrialBadge}>
                    <Text style={styles.planTrialBadgeText}>
                      {planInfo.trial_days_left} day{planInfo.trial_days_left !== 1 ? 's' : ''} left
                    </Text>
                  </View>
                </View>
                <Text style={styles.planTrialSub}>Full Pro access. Upgrade before trial ends to keep all features.</Text>
                <View style={[styles.planBar, { width: '100%', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <View style={[styles.planBarFill, {
                    width: `${Math.max(4, Math.min(100, (planInfo.trial_days_left / 14) * 100))}%`,
                    backgroundColor: '#fff',
                  }]} />
                </View>
                <View style={[styles.planUpgradeBtn, { marginTop: 10, backgroundColor: '#fff' }]}>
                  <Ionicons name="flash" size={12} color="#7c3aed" />
                  <Text style={[styles.planUpgradeBtnText, { color: '#7c3aed' }]}>Upgrade to Pro</Text>
                  <Ionicons name="chevron-forward" size={12} color="#7c3aed" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Trial expired banner */}
        {planInfo && planInfo.tier === 'free' && !planInfo.trial_active && (
          <TouchableOpacity
            style={styles.planCardExpired}
            onPress={() => Linking.openURL('https://ausfairgo.com.au/pricing')}
            activeOpacity={0.85}
          >
            <View style={styles.planCardInner}>
              <View style={styles.planIconWrapExpired}>
                <Ionicons name="lock-closed" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={styles.planTitleExpired}>Trial ended</Text>
                  <View style={styles.planExpiredBadge}>
                    <Text style={styles.planExpiredBadgeText}>Features locked</Text>
                  </View>
                </View>
                <Text style={styles.planExpiredSub}>Calendar, sessions & more are locked. Upgrade to restore access.</Text>
                <View style={[styles.planUpgradeBtn, { marginTop: 10, backgroundColor: '#fff' }]}>
                  <Ionicons name="flash" size={12} color="#dc2626" />
                  <Text style={[styles.planUpgradeBtnText, { color: '#dc2626' }]}>Upgrade Now</Text>
                  <Ionicons name="chevron-forward" size={12} color="#dc2626" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {planInfo && planInfo.tier !== 'free' && (
          <View style={styles.planCardPro}>
            <View style={styles.planProIconWrap}>
              <Ionicons name="flash" size={16} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planProTitle}>{planInfo.tier.charAt(0).toUpperCase() + planInfo.tier.slice(1)} plan</Text>
              <Text style={styles.planProSub}>
                {planInfo.tier === 'elite'
                  ? 'All features · Unlimited athletes'
                  : `${planInfo.usage?.athletes ?? 0}/${planInfo.limits?.athletes} athletes · ${planInfo.usage?.squads ?? 0}/${planInfo.limits?.squads} squads`}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
          </View>
        )}

        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.statCard}
              onPress={s.nav ?? undefined}
              activeOpacity={s.nav ? 0.7 : 1}
            >
              <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                <Ionicons name={s.iconName} size={16} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value ?? '—'}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>📅 Upcoming Sessions</Text>
              <Text style={styles.sectionHint}>tap a session to see attendance</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.sectionLink}>Full calendar →</Text>
            </TouchableOpacity>
          </View>
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={36} color="#cbd5e1" />
              <Text style={styles.emptyText}>No upcoming sessions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
                <Text style={styles.emptyLink}>Schedule one →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            events.map((ev, i) => {
              const d = new Date(ev.start_time)
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={[styles.eventCard, i === 0 && styles.eventCardFirst]}
                  onPress={() => setAttendanceModal(ev)}
                  activeOpacity={0.75}
                >
                  {i === 0 ? (
                    <View style={styles.nextBadge}>
                      <Text style={styles.nextBadgeText}>Next</Text>
                    </View>
                  ) : null}
                  <View style={styles.eventRow}>
                    <View style={[styles.dateBadge, i === 0 && styles.dateBadgeFirst]}>
                      <Text style={[styles.dateDay, i === 0 && styles.dateDayFirst]}>{fmtDay(ev.start_time)}</Text>
                      <Text style={[styles.dateMon, i === 0 && styles.dateMonFirst]}>{fmtMon(ev.start_time)}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                      <Text style={styles.eventTime}>{fmtTime(ev.start_time)}</Text>
                      {ev.location ? <Text style={styles.eventMeta} numberOfLines={1}>{ev.location}</Text> : null}
                      {ev.squad_name ? <Text style={styles.eventMeta} numberOfLines={1}>{ev.squad_name}</Text> : null}
                    </View>
                    {ev.rsvp_counts ? (
                      <View style={styles.rsvpWrap}>
                        <Text style={styles.rsvpCount}>{ev.rsvp_counts.yes ?? 0}</Text>
                        <Text style={styles.rsvpLabel}>going</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📈 FTEM Spread</Text>
            <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'AnalyticsScreen' })}>
              <Text style={styles.sectionLink}>Analytics →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ftemCard}>
            {ftemTotal === 0 ? (
              <Text style={styles.emptyMsg}>No athletes yet</Text>
            ) : (
              <>
                {ftemPhases.filter(p => ftemCounts[p] > 0).map(phase => {
                  const count = ftemCounts[phase]
                  const pct = Math.round((count / ftemTotal) * 100)
                  const meta = FTEM_PHASES[phase]
                  return (
                    <View key={phase} style={styles.ftemRow}>
                      <View style={[styles.ftemPhaseBadge, { backgroundColor: meta?.bgColor ?? '#f1f5f9' }]}>
                        <Text style={[styles.ftemPhaseText, { color: meta?.textColor ?? '#334155' }]}>{phase}</Text>
                      </View>
                      <View style={styles.ftemTrack}>
                        <View style={[styles.ftemFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.ftemCount}>{count}</Text>
                      <Text style={styles.ftemPct}>{pct}%</Text>
                    </View>
                  )
                })}
                <View style={styles.ftemFooter}>
                  <Text style={styles.ftemFooterText}>{athletes.length} total athletes</Text>
                  <Text style={styles.ftemFooterText}>{activeAthletes.length} active</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📢 Announcements</Text>
            <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'AnnouncementsList' })}>
              <Text style={styles.sectionLink}>Manage →</Text>
            </TouchableOpacity>
          </View>
          {announcements.length === 0 ? (
            <Text style={styles.emptyMsg}>No announcements yet</Text>
          ) : announcements.map(a => (
            <View key={a.id} style={styles.annoCard}>
              <Text style={styles.annoTitle} numberOfLines={1}>{a.title}</Text>
              {a.body ? <Text style={styles.annoBody} numberOfLines={1}>{a.body}</Text> : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Recent Milestones</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Awards')}>
              <Text style={styles.sectionLink}>All →</Text>
            </TouchableOpacity>
          </View>
          {milestones.length === 0 ? (
            <Text style={styles.emptyMsg}>No milestones recorded yet</Text>
          ) : milestones.map(m => {
            const meta = FTEM_PHASES[m.ftem_phase]
            return (
              <View key={m.id} style={styles.milestoneCard}>
                <Ionicons name="trophy" size={14} color="#f59e0b" style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle} numberOfLines={1}>{m.title}</Text>
                  {m.athlete_name ? <Text style={styles.milestoneSub}>{m.athlete_name}</Text> : null}
                  <Text style={styles.milestoneMeta}>{fmtFull(m.achieved_at ?? m.date)}</Text>
                </View>
                {m.ftem_phase ? (
                  <View style={[styles.ftemBadge, { backgroundColor: meta?.bgColor ?? '#f1f5f9' }]}>
                    <Text style={[styles.ftemBadgeText, { color: meta?.textColor ?? '#334155' }]}>{m.ftem_phase}</Text>
                  </View>
                ) : null}
              </View>
            )
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤝 Volunteering</Text>
          </View>
          {volunteering.length === 0 ? (
            <Text style={styles.emptyMsg}>No open opportunities</Text>
          ) : volunteering.map(v => {
            const spotsLeft = v.spots ? v.spots - (v.signed_up ?? 0) : null
            const isFull = spotsLeft !== null && spotsLeft <= 0
            return (
              <View key={v.id} style={styles.volCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.volTitle} numberOfLines={1}>{v.title}</Text>
                  {v.date ? <Text style={styles.volMeta}>{fmtFull(v.date)}</Text> : null}
                </View>
                {spotsLeft !== null ? (
                  <View style={[styles.spotsBadge, { backgroundColor: isFull ? '#fee2e2' : '#d1fae5' }]}>
                    <Text style={[styles.spotsText, { color: isFull ? '#dc2626' : '#059669' }]}>
                      {isFull ? 'Full' : `${spotsLeft} left`}
                    </Text>
                  </View>
                ) : null}
              </View>
            )
          })}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {attendanceModal ? (
        <AttendanceModal event={attendanceModal} onClose={() => setAttendanceModal(null)} />
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.sm },

  greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  greetingText: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  greetingDate: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  bellBtn: {
    width: 42, height: 42, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: colors.error, borderRadius: 999,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: colors.background,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  clubBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#059669', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  clubLogo: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#fff' },
  clubIconWrap: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  clubInfo: { flex: 1 },
  clubLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  clubName: { fontSize: font.xl, fontWeight: '800', color: '#fff', marginTop: 2 },
  clubDetail: { fontSize: font.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  settingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  settingsBtnText: { fontSize: font.xs, fontWeight: '700', color: '#fff' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: spacing.md },
  statCard: {
    width: STAT_W, alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    paddingVertical: 12, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: font.xl, fontWeight: '800', color: colors.text, lineHeight: 26 },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  statSub: { fontSize: 9, color: colors.textMuted, textAlign: 'center', marginTop: -2 },

  section: { marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  sectionHint: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  sectionLink: { fontSize: font.xs, color: colors.primary, fontWeight: '600' },
  emptyMsg: { fontSize: font.xs, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },

  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 6, backgroundColor: colors.surface, borderRadius: radius.lg },
  emptyText: { fontSize: font.sm, color: '#94a3b8' },
  emptyLink: { fontSize: font.xs, color: colors.primary, fontWeight: '600' },

  eventCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#f1f5f9', position: 'relative',
  },
  eventCardFirst: { backgroundColor: '#f5f3ff', borderColor: '#e9d5ff' },
  nextBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#ede9fe', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  nextBadgeText: { fontSize: 10, fontWeight: '700', color: '#7c3aed' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center',
  },
  dateBadgeFirst: { backgroundColor: '#7c3aed' },
  dateDay: { fontSize: font.md, fontWeight: '800', color: '#475569', lineHeight: 20 },
  dateDayFirst: { color: '#fff' },
  dateMon: { fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' },
  dateMonFirst: { color: 'rgba(196,181,253,1)' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  eventTime: { fontSize: font.sm, color: colors.primary, marginTop: 1 },
  eventMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },
  rsvpWrap: { alignItems: 'center' },
  rsvpCount: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  rsvpLabel: { fontSize: 10, color: colors.textMuted },

  ftemCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  ftemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  ftemPhaseBadge: { width: 34, borderRadius: 6, alignItems: 'center', paddingVertical: 3, paddingHorizontal: 2 },
  ftemPhaseText: { fontSize: font.xs, fontWeight: '800' },
  ftemTrack: { flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
  ftemFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  ftemCount: { fontSize: font.xs, fontWeight: '700', color: '#475569', width: 20, textAlign: 'right' },
  ftemPct: { fontSize: 10, color: colors.textMuted, width: 30, textAlign: 'right' },
  ftemFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 8, marginTop: 2 },
  ftemFooterText: { fontSize: font.xs, color: colors.textMuted },

  annoCard: {
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe',
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: spacing.sm,
  },
  annoTitle: { fontSize: font.sm, fontWeight: '600', color: '#1e293b' },
  annoBody: { fontSize: font.xs, color: '#64748b', marginTop: 2 },

  milestoneCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, marginBottom: spacing.sm,
  },
  milestoneTitle: { fontSize: font.sm, fontWeight: '600', color: '#1e293b' },
  milestoneSub: { fontSize: font.xs, color: '#64748b', marginTop: 1 },
  milestoneMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  ftemBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  ftemBadgeText: { fontSize: 10, fontWeight: '700' },

  planCardInner: { flexDirection: 'row', gap: 12 },
  planBar: { width: 64, height: 6, backgroundColor: '#fde68a', borderRadius: 3, overflow: 'hidden' },
  planBarFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 3 },
  planUpgradeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#d97706', borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  planUpgradeBtnText: { fontSize: font.xs, fontWeight: '700', color: '#fff' },

  // Trial active (violet/indigo)
  planCardTrial: {
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  planIconWrapTrial: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  planTitleTrial: { fontSize: font.base, fontWeight: '800', color: '#fff' },
  planTrialBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  planTrialBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  planTrialSub: { fontSize: font.xs, color: 'rgba(255,255,255,0.8)', lineHeight: 16 },

  // Trial expired (red)
  planCardExpired: {
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  planIconWrapExpired: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  planTitleExpired: { fontSize: font.base, fontWeight: '800', color: '#fff' },
  planExpiredBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  planExpiredBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  planExpiredSub: { fontSize: font.xs, color: 'rgba(255,255,255,0.8)', lineHeight: 16 },
  planCardPro: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0',
    borderRadius: radius.lg, padding: 12, marginBottom: spacing.md,
  },
  planProIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center',
  },
  planProTitle: { fontSize: font.base, fontWeight: '800', color: '#065f46' },
  planProSub: { fontSize: font.xs, color: '#059669', marginTop: 1 },

  volCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  volTitle: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  volMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  spotsBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  spotsText: { fontSize: 10, fontWeight: '700' },
})
