import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
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

function ftemColor(phase) {
  const p = FTEM_PHASES[phase]
  if (!p) return 'slate'
  if (phase?.startsWith('F')) return 'slate'
  if (phase?.startsWith('T')) return 'blue'
  if (phase?.startsWith('E')) return 'green'
  if (phase === 'M') return 'amber'
  return 'slate'
}

function ftemLabel(phase) {
  return FTEM_PHASES[phase]?.label ?? phase ?? '—'
}

function sportLabel(value) {
  return SPORTS.find((s) => s.value === value)?.label ?? value ?? '—'
}

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  async function fetchAll() {
    try {
      const [profileRes, milestonesRes, announcementsRes, eventsRes, invitesRes] =
        await Promise.allSettled([
          api.get('/athletes/me'),
          api.get('/milestones'),
          api.get('/announcements'),
          api.get('/events'),
          api.get('/athletes/invites'),
        ])

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
      if (milestonesRes.status === 'fulfilled') {
        const list = Array.isArray(milestonesRes.value.data)
          ? milestonesRes.value.data
          : milestonesRes.value.data?.data ?? []
        setMilestones(list.slice(0, 3))
      }
      if (announcementsRes.status === 'fulfilled') {
        const list = Array.isArray(announcementsRes.value.data)
          ? announcementsRes.value.data
          : announcementsRes.value.data?.data ?? []
        setAnnouncements(list.slice(0, 2))
      }
      if (eventsRes.status === 'fulfilled') {
        const list = Array.isArray(eventsRes.value.data)
          ? eventsRes.value.data
          : eventsRes.value.data?.data ?? []
        setEvents(list.slice(0, 2))
      }
      if (invitesRes.status === 'fulfilled') {
        const list = Array.isArray(invitesRes.value.data)
          ? invitesRes.value.data
          : invitesRes.value.data?.data ?? []
        setInvites(list)
      }
    } catch {
      // handled per-request
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAll()
  }, [])

  async function handleInvite(inviteId, action) {
    setActionLoading(`${action}-${inviteId}`)
    try {
      if (action === 'accept') {
        await api.post(`/athletes/invites/${inviteId}/accept`)
      } else {
        await api.post(`/athletes/invites/${inviteId}/decline`)
      }
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      fetchAll()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Action failed.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const club = profile?.club
  const athlete = profile

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Club banner */}
        {club ? (
          <View style={styles.clubBanner}>
            <View style={styles.clubBannerInner}>
              <Avatar name={club.name} size="md" />
              <View style={styles.clubInfo}>
                <Text style={styles.clubName}>{club.name}</Text>
                {club.manager_name ? (
                  <Text style={styles.clubMeta}>Manager: {club.manager_name}</Text>
                ) : null}
                {club.contact_email ? (
                  <Text style={styles.clubMeta}>{club.contact_email}</Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
          <Card style={styles.noClubCard}>
            <View style={styles.noClubRow}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={styles.noClubText}>
                You are not part of a club yet. Search for clubs to join.
              </Text>
            </View>
          </Card>
        )}

        {/* Profile card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={user?.name} url={athlete?.avatar_url} size="lg" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name ?? '—'}</Text>
              <Text style={styles.profileSport}>{sportLabel(athlete?.sport)}</Text>
              <View style={styles.badgeRow}>
                {athlete?.ftem_phase ? (
                  <Badge
                    label={ftemLabel(athlete.ftem_phase)}
                    color={ftemColor(athlete.ftem_phase)}
                  />
                ) : (
                  <Badge label="No phase set" color="slate" />
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Pending invites */}
        {invites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Club Invitations</Text>
            {invites.map((invite) => (
              <Card key={invite.id} style={styles.inviteCard}>
                <Text style={styles.inviteTitle}>
                  {invite.club_name ?? invite.club?.name ?? 'A club'}
                </Text>
                <Text style={styles.inviteMsg}>
                  {invite.message || 'You have been invited to join this club.'}
                </Text>
                <View style={styles.inviteActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleInvite(invite.id, 'accept')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === `accept-${invite.id}` ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleInvite(invite.id, 'decline')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === `decline-${invite.id}` ? (
                      <ActivityIndicator color={colors.textSecondary} size="small" />
                    ) : (
                      <Text style={styles.declineBtnText}>Decline</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Recent milestones */}
        {milestones.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recent Milestones</Text>
            </View>
            {milestones.map((m) => (
              <Card key={m.id} style={styles.milestoneCard}>
                <View style={styles.milestoneRow}>
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneTitle}>{m.title}</Text>
                    {m.description ? (
                      <Text style={styles.milestoneDesc} numberOfLines={2}>
                        {m.description}
                      </Text>
                    ) : null}
                    {m.date || m.achieved_at ? (
                      <Text style={styles.milestoneMeta}>
                        {formatDate(m.date ?? m.achieved_at)}
                      </Text>
                    ) : null}
                  </View>
                  {m.ftem_phase ? (
                    <Badge
                      label={FTEM_PHASES[m.ftem_phase]?.label ?? m.ftem_phase}
                      color={ftemColor(m.ftem_phase)}
                    />
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            {events.map((ev) => (
              <Card key={ev.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{ev.name ?? ev.title}</Text>
                {ev.start_date || ev.date ? (
                  <Text style={styles.eventDate}>
                    {formatDate(ev.start_date ?? ev.date)}
                  </Text>
                ) : null}
                {ev.location ? (
                  <Text style={styles.eventMeta}>{ev.location}</Text>
                ) : null}
              </Card>
            ))}
          </View>
        )}

        {/* Recent announcements */}
        {announcements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recent Announcements</Text>
            </View>
            {announcements.map((a) => (
              <Card key={a.id} style={styles.announcementCard}>
                <Text style={styles.announcementTitle}>{a.title}</Text>
                <Text style={styles.announcementBody} numberOfLines={3}>
                  {a.body ?? a.content}
                </Text>
                {a.created_at ? (
                  <Text style={styles.announcementMeta}>
                    {formatDate(a.created_at)}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingTop: spacing.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  clubBanner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  clubBannerInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clubInfo: { flex: 1 },
  clubName: { fontSize: font.md, fontWeight: '700', color: '#fff' },
  clubMeta: { fontSize: font.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  noClubCard: { marginBottom: spacing.md },
  noClubRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noClubText: { flex: 1, fontSize: font.sm, color: colors.textSecondary },

  profileCard: { marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  profileSport: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  badgeRow: { marginTop: 6 },

  section: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.base,
    fontWeight: '700',
    color: colors.text,
  },

  inviteCard: {
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  inviteTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: 4 },
  inviteMsg: { fontSize: font.sm, color: colors.textSecondary, marginBottom: spacing.md },
  inviteActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  declineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  declineBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },

  milestoneCard: { marginBottom: spacing.sm },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontSize: font.base, fontWeight: '600', color: colors.text },
  milestoneDesc: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  milestoneMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 4 },

  eventCard: { marginBottom: spacing.sm },
  eventTitle: { fontSize: font.base, fontWeight: '600', color: colors.text },
  eventDate: { fontSize: font.sm, color: colors.primary, marginTop: 2 },
  eventMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },

  announcementCard: { marginBottom: spacing.sm },
  announcementTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: 4 },
  announcementBody: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 20 },
  announcementMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 6 },
})
