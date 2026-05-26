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
  const [volunteering, setVolunteering] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  async function fetchAll() {
    try {
      const [profileRes, milestonesRes, announcementsRes, eventsRes, invitesRes, volRes, jrRes] =
        await Promise.allSettled([
          api.get('/athletes/me'),
          api.get('/milestones'),
          api.get('/announcements'),
          api.get('/events'),
          api.get('/athletes/invites'),
          api.get('/volunteering'),
          api.get('/my/join-requests'),
        ])

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
      if (milestonesRes.status === 'fulfilled') {
        const list = Array.isArray(milestonesRes.value.data)
          ? milestonesRes.value.data
          : milestonesRes.value.data?.data ?? []
        setMilestones(list.slice(0, 4))
      }
      if (announcementsRes.status === 'fulfilled') {
        const list = Array.isArray(announcementsRes.value.data)
          ? announcementsRes.value.data
          : announcementsRes.value.data?.data ?? []
        setAnnouncements(list.slice(0, 4))
      }
      if (eventsRes.status === 'fulfilled') {
        const list = Array.isArray(eventsRes.value.data)
          ? eventsRes.value.data
          : eventsRes.value.data?.data ?? []
        const now = new Date()
        setEvents(list.filter(e => new Date(e.start_time) >= now).slice(0, 4))
      }
      if (invitesRes.status === 'fulfilled') {
        const list = Array.isArray(invitesRes.value.data)
          ? invitesRes.value.data
          : invitesRes.value.data?.data ?? []
        setInvites(list)
      }
      if (volRes.status === 'fulfilled') {
        const list = Array.isArray(volRes.value.data)
          ? volRes.value.data
          : volRes.value.data?.data ?? []
        const now = new Date()
        setVolunteering(list.filter(v => new Date(v.date) >= now).slice(0, 3))
      }
      if (jrRes.status === 'fulfilled') {
        const list = Array.isArray(jrRes.value.data)
          ? jrRes.value.data
          : jrRes.value.data?.data ?? []
        setJoinRequests(list)
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

  async function handleInvite(invite, action) {
    const id = invite.id
    setActionLoading(`${action}-${id}`)
    try {
      if (action === 'accept') {
        await api.post(`/athletes/${id}/accept-invite`)
      } else {
        await api.delete(`/athletes/${id}/reject-invite`)
      }
      setInvites((prev) => prev.filter((i) => i.id !== id))
      fetchAll()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Action failed.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleWithdrawJoinRequest(jr) {
    Alert.alert('Withdraw Request', `Withdraw your request to join ${jr.club_name ?? 'this club'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/clubs/public/${jr.club_slug}/join-request`)
          setJoinRequests(p => p.filter(r => r.id !== jr.id))
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.message ?? 'Failed.')
        }
      }},
    ])
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
            <Avatar name={user?.full_name} url={athlete?.avatar_url} size="lg" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name ?? '—'}</Text>
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
                    onPress={() => handleInvite(invite, 'accept')}
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
                    onPress={() => handleInvite(invite, 'decline')}
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

        {/* Join requests status */}
        {joinRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Join Requests</Text>
            </View>
            {joinRequests.map((jr) => {
              const isPending  = jr.status === 'pending'
              const isRejected = jr.status === 'rejected'
              return (
                <Card
                  key={jr.id}
                  style={[
                    styles.joinCard,
                    isPending  && styles.joinCardPending,
                    isRejected && styles.joinCardRejected,
                  ]}
                >
                  <View style={styles.joinRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.joinClub}>{jr.club_name ?? '—'}</Text>
                      {jr.club_sport ? <Text style={styles.joinMeta}>{jr.club_sport}</Text> : null}
                      {jr.created_at ? <Text style={styles.joinMeta}>Submitted {formatDate(jr.created_at)}</Text> : null}
                    </View>
                    <Badge
                      label={isPending ? 'Pending' : isRejected ? 'Rejected' : jr.status}
                      color={isPending ? 'blue' : 'slate'}
                    />
                  </View>
                  {isPending ? (
                    <TouchableOpacity style={styles.withdrawBtn} onPress={() => handleWithdrawJoinRequest(jr)}>
                      <Text style={styles.withdrawBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                  ) : null}
                </Card>
              )
            })}
          </View>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            </View>
            {events.map((ev) => {
              const d = ev.start_time ? new Date(ev.start_time) : null
              return (
                <Card key={ev.id} style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    {d ? (
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateDay}>{d.getDate()}</Text>
                        <Text style={styles.dateMon}>{d.toLocaleString('en-AU', { month: 'short' })}</Text>
                      </View>
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>{ev.title ?? ev.name}</Text>
                      {d ? <Text style={styles.eventTime}>{d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text> : null}
                      {ev.location ? <Text style={styles.eventMeta}>{ev.location}</Text> : null}
                    </View>
                  </View>
                </Card>
              )
            })}
          </View>
        )}

        {/* Recent announcements */}
        {announcements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Announcements</Text>
            </View>
            {announcements.map((a) => (
              <Card key={a.id} style={styles.announcementCard}>
                <Text style={styles.announcementTitle}>{a.title}</Text>
                <Text style={styles.announcementBody} numberOfLines={3}>
                  {a.body ?? a.content}
                </Text>
                {a.created_at ? (
                  <Text style={styles.announcementMeta}>
                    {formatDate(a.posted_at ?? a.created_at)}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        )}

        {/* Volunteering */}
        {volunteering.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Volunteer Spots</Text>
            </View>
            {volunteering.map((v) => {
              const remaining = v.spots - (v.signed_up ?? 0)
              return (
                <Card key={v.id} style={styles.volCard}>
                  <View style={styles.volRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>{v.title}</Text>
                      <Text style={styles.eventMeta}>{formatDate(v.date)}</Text>
                    </View>
                    <Badge
                      label={v.i_signed_up ? "You're in" : remaining <= 0 ? 'Full' : `${remaining} spots`}
                      color={v.i_signed_up ? 'green' : remaining <= 0 ? 'slate' : 'blue'}
                    />
                  </View>
                </Card>
              )
            })}
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
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  dateDay: { fontSize: font.md, fontWeight: '800', color: colors.primary, lineHeight: 20 },
  dateMon: { fontSize: 10, fontWeight: '600', color: colors.primary, textTransform: 'uppercase' },
  eventTitle: { fontSize: font.base, fontWeight: '600', color: colors.text },
  eventTime: { fontSize: font.sm, color: colors.primary, marginTop: 1 },
  eventMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },

  joinCard: { marginBottom: spacing.sm },
  joinCardPending: { borderLeftWidth: 3, borderLeftColor: colors.info },
  joinCardRejected: { borderLeftWidth: 3, borderLeftColor: colors.textMuted },
  joinRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  joinClub: { fontSize: font.base, fontWeight: '700', color: colors.text },
  joinMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  withdrawBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  withdrawBtnText: { fontSize: font.xs, color: colors.textSecondary, fontWeight: '600' },

  volCard: { marginBottom: spacing.sm },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  announcementCard: { marginBottom: spacing.sm },
  announcementTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: 4 },
  announcementBody: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 20 },
  announcementMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 6 },
})
