import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import {
  View, Text, ScrollView, Modal, Pressable, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Image, Alert, StyleSheet, Dimensions, Linking,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import Constants from 'expo-constants'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'

const _apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'https://ausfairgo.com.au/api'
const WEB_BASE = _apiUrl.replace(/\/api\/?$/, '')

const SCREEN_W = Dimensions.get('window').width

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

function sportEmoji(value) {
  return SPORTS.find(s => s.value === value)?.emoji ?? '🏅'
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

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
      <SkeletonBlock height={100} style={{ borderRadius: radius.lg, marginBottom: spacing.md }} />
      <SkeletonBlock height={80} style={{ borderRadius: radius.lg, marginBottom: spacing.md }} />
      <SkeletonBlock height={110} style={{ borderRadius: radius.lg, marginBottom: spacing.md }} />
      <SkeletonBlock height={14} width="45%" style={{ marginBottom: spacing.sm }} />
      {[0, 1, 2].map(i => <SkeletonBlock key={i} height={52} style={{ borderRadius: radius.md, marginBottom: spacing.sm }} />)}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

function SquadRequestModal({ onClose }) {
  const [squads, setSquads] = useState([])
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const insets = useSafeAreaInsets()
  const [pickerVisible, setPickerVisible] = useState(false)

  useEffect(() => {
    api.get('/squads').then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setSquads(list)
    }).catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!selected) return
    setSaving(true)
    try {
      await api.post(`/squads/${selected.id}/request`, { reason })
      Alert.alert('Request sent', 'Your squad change request has been sent to your coach.')
      onClose()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send request')
      setSaving(false)
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={sqStyles.backdrop} onPress={onClose}>
        <Pressable style={[sqStyles.sheet, { paddingBottom: insets.bottom || 16 }]} onPress={e => e.stopPropagation()}>
          <View style={sqStyles.handle} />
          <View style={sqStyles.headerRow}>
            <Text style={sqStyles.title}>Request squad change</Text>
            <TouchableOpacity style={sqStyles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: spacing.md }}>
            <View>
              <Text style={sqStyles.fieldLabel}>Which squad do you want to join?</Text>
              <TouchableOpacity style={sqStyles.dropdownBtn} onPress={() => setPickerVisible(true)}>
                <Text style={selected ? sqStyles.dropdownValue : sqStyles.dropdownPlaceholder}>
                  {selected ? selected.name : 'Select squad…'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View>
              <Text style={sqStyles.fieldLabel}>Reason (optional)</Text>
              <TextInput
                style={sqStyles.textarea}
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. I moved age groups…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <View style={sqStyles.btnRow}>
              <TouchableOpacity style={sqStyles.cancelBtn} onPress={onClose}>
                <Text style={sqStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sqStyles.submitBtn, (!selected || saving) && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={!selected || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={sqStyles.submitBtnText}>Send request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>

      <Modal visible={pickerVisible} transparent statusBarTranslucent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={sqStyles.backdrop} onPress={() => setPickerVisible(false)}>
          <Pressable style={[sqStyles.sheet, { maxHeight: '60%', paddingBottom: insets.bottom || 16 }]} onPress={e => e.stopPropagation()}>
            <View style={sqStyles.handle} />
            <Text style={[sqStyles.title, { paddingHorizontal: spacing.md, paddingBottom: 12 }]}>Select squad</Text>
            <ScrollView>
              {squads.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={sqStyles.pickerRow}
                  onPress={() => { setSelected(s); setPickerVisible(false) }}
                >
                  <Text style={[sqStyles.pickerText, selected?.id === s.id && sqStyles.pickerTextSelected]}>{s.name}</Text>
                  {selected?.id === s.id ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
                </TouchableOpacity>
              ))}
              {squads.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.textMuted, padding: spacing.md }}>No squads found</Text>
              ) : null}
            </ScrollView>
            <View style={{ height: spacing.lg }} />
          </Pressable>
        </Pressable>
      </Modal>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const sqStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginTop: 10, marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginBottom: spacing.md },
  title: { fontSize: font.base, fontWeight: '800', color: colors.text },
  closeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  fieldLabel: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  dropdownBtn: { height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, justifyContent: 'space-between', backgroundColor: '#fff' },
  dropdownValue: { fontSize: font.sm, color: colors.text },
  dropdownPlaceholder: { fontSize: font.sm, color: colors.textMuted },
  textarea: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: font.sm, color: colors.text, minHeight: 72 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },
  submitBtn: { flex: 1, height: 48, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerText: { fontSize: font.base, color: colors.text },
  pickerTextSelected: { color: colors.primary, fontWeight: '700' },
})

export default function DashboardScreen() {
  const { user } = useAuth()
  const navigation = useNavigation()
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
  const [showSquadRequest, setShowSquadRequest] = useState(false)

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
        const list = Array.isArray(milestonesRes.value.data) ? milestonesRes.value.data : milestonesRes.value.data?.data ?? []
        setMilestones(list.slice(0, 4))
      }
      if (announcementsRes.status === 'fulfilled') {
        const list = Array.isArray(announcementsRes.value.data) ? announcementsRes.value.data : announcementsRes.value.data?.data ?? []
        setAnnouncements(list.slice(0, 4))
      }
      if (eventsRes.status === 'fulfilled') {
        const list = Array.isArray(eventsRes.value.data) ? eventsRes.value.data : eventsRes.value.data?.data ?? []
        const now = new Date()
        setEvents(list.filter(e => new Date(e.start_time) >= now).slice(0, 4))
      }
      if (invitesRes.status === 'fulfilled') {
        const list = Array.isArray(invitesRes.value.data) ? invitesRes.value.data : invitesRes.value.data?.data ?? []
        setInvites(list)
      }
      if (volRes.status === 'fulfilled') {
        const list = Array.isArray(volRes.value.data) ? volRes.value.data : volRes.value.data?.data ?? []
        const now = new Date()
        setVolunteering(list.filter(v => !v.date || new Date(v.date) >= now).slice(0, 3))
      }
      if (jrRes.status === 'fulfilled') {
        const list = Array.isArray(jrRes.value.data) ? jrRes.value.data : jrRes.value.data?.data ?? []
        setJoinRequests(list.filter(r => r.status === 'pending' || r.status === 'rejected'))
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { fetchAll() }, []))

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationsList')}
          style={{ marginRight: 4, padding: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

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
      setInvites(prev => prev.filter(i => i.id !== id))
      fetchAll()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Action failed.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleWithdrawJoinRequest(jr) {
    Alert.alert(
      'Withdraw Request',
      `Withdraw your request to join ${jr.club_name ?? 'this club'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/clubs/public/${jr.club_slug ?? jr.slug}/join-request`)
              setJoinRequests(p => p.filter(r => r.id !== jr.id))
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Failed.')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <SkeletonLoader />
      </SafeAreaView>
    )
  }

  const athlete = profile
  const club = profile?.club ?? (profile?.club_name ? profile : null)
  const nextEvent = events[0] ?? null
  const ftemMeta = athlete?.ftem_phase ? FTEM_PHASES[athlete.ftem_phase] : null

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{greeting()}, {user?.full_name?.split(' ')[0] ?? 'Athlete'} 👋</Text>
          <Text style={styles.greetingDate}>{todayLabel()}</Text>
        </View>

        {(athlete?.club_name ?? club?.name) ? (
          <View style={styles.clubBanner}>
            <View style={styles.clubBannerTop}>
              {(athlete?.club_logo ?? club?.logo_url) ? (
                <Image source={{ uri: athlete?.club_logo ?? club?.logo_url }} style={styles.clubLogo} resizeMode="contain" />
              ) : (
                <View style={styles.clubIconWrap}>
                  <Ionicons name="business-outline" size={28} color="rgba(255,255,255,0.8)" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.clubLabel}>YOUR CLUB</Text>
                <Text style={styles.clubName} numberOfLines={1}>{athlete?.club_name ?? club?.name}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                  {(athlete?.club_sport ?? club?.sport) ? (
                    <Text style={styles.clubDetail}>{sportLabel(athlete?.club_sport ?? club?.sport)}</Text>
                  ) : null}
                  {(athlete?.club_city ?? club?.city) ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="location-outline" size={11} color="rgba(167,243,208,1)" />
                      <Text style={styles.clubDetail}>
                        {athlete?.club_city ?? club?.city}{(athlete?.club_state ?? club?.state) ? `, ${athlete?.club_state ?? club?.state}` : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {(athlete?.manager_name ?? club?.manager_name) ? (
              <View style={styles.managerRow}>
                <View style={styles.managerAvatar}>
                  <Ionicons name="person-circle-outline" size={20} color="rgba(255,255,255,0.8)" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.managerLabel}>CLUB MANAGER</Text>
                  <Text style={styles.managerName} numberOfLines={1}>{athlete?.manager_name ?? club?.manager_name}</Text>
                  {(athlete?.manager_email ?? club?.manager_email ?? club?.contact_email) ? (
                    <Text style={styles.managerEmail} numberOfLines={1}>
                      {athlete?.manager_email ?? club?.manager_email ?? club?.contact_email}
                    </Text>
                  ) : null}
                </View>
                {(athlete?.club_slug ?? club?.slug) ? (
                  <TouchableOpacity
                    style={styles.viewClubChip}
                    onPress={() => navigation.navigate('ClubsScreen', { openSlug: athlete?.club_slug ?? club?.slug })}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.viewClubText}>View club</Text>
                    <Ionicons name="arrow-forward" size={11} color="#fff" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : (
          {user?.role === 'parent' ? (
            <View style={styles.noClubCard}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={styles.noClubText}>No athletes linked yet. Ask your club coach to link you to your child's profile.</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.noClubCard}
              onPress={() => navigation.navigate('ClubsScreen')}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={styles.noClubText}>You are not part of a club yet. Tap to search for clubs to join.</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        )}

        {invites.map(invite => (
          <View key={invite.id} style={styles.inviteCard}>
            <View style={styles.inviteRow}>
              <View style={styles.inviteIconWrap}>
                <Text style={{ fontSize: 20 }}>🏟️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inviteTitle} numberOfLines={2}>
                  {invite.club_name ?? invite.club?.name ?? 'A club'} wants to add you as an athlete
                </Text>
                <Text style={styles.inviteMeta}>
                  {[
                    invite.first_name ? `${invite.first_name} ${invite.last_name ?? ''}`.trim() : null,
                    invite.ftem_phase ? `FTEM ${invite.ftem_phase}` : null,
                    invite.club_city ?? null,
                  ].filter(Boolean).join(' · ')}
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
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </>
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
                      <>
                        <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        {joinRequests.map(jr => {
          const isPending = jr.status === 'pending'
          return (
            <View key={jr.id} style={[styles.joinCard, isPending ? styles.joinCardPending : styles.joinCardRejected]}>
              <View style={styles.joinRow}>
                <View style={[styles.joinIconWrap, isPending ? styles.joinIconPending : styles.joinIconRejected]}>
                  <Text style={{ fontSize: 18 }}>{isPending ? '⏳' : '❌'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.joinTitle}>
                    {isPending
                      ? `Your request to join ${jr.club_name ?? 'this club'} is pending`
                      : `Your request to join ${jr.club_name ?? 'this club'} was not approved`}
                  </Text>
                  <Text style={styles.joinMeta}>
                    {[jr.club_sport, jr.club_city].filter(Boolean).join(' · ')}
                    {jr.created_at ? ` · Submitted ${new Date(jr.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </Text>
                  {isPending ? (
                    <TouchableOpacity style={styles.withdrawBtn} onPress={() => handleWithdrawJoinRequest(jr)}>
                      <Ionicons name="trash-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.withdrawBtnText}>Withdraw request</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          )
        })}

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {athlete?.avatar_url ? (
              <Image source={{ uri: athlete.avatar_url }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileInitials}>
                <Text style={styles.profileInitialsText}>{sportEmoji(athlete?.sport)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {athlete?.first_name ? `${athlete.first_name} ${athlete.last_name ?? ''}`.trim() : user?.full_name ?? '—'}
              </Text>
              <Text style={styles.profileSport}>
                {sportLabel(athlete?.sport)}{athlete?.squad_names ? ` · ${athlete.squad_names}` : ''}
              </Text>
              {ftemMeta ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <View style={[styles.ftemBadge, { backgroundColor: ftemMeta.bgColor }]}>
                    <Text style={[styles.ftemBadgeText, { color: ftemMeta.textColor }]}>{athlete.ftem_phase}</Text>
                  </View>
                  <Text style={styles.ftemBadgeLabel}>{ftemMeta.label}</Text>
                </View>
              ) : null}
              {athlete?.squad_names ? (
                <TouchableOpacity onPress={() => setShowSquadRequest(true)} style={{ marginTop: 8 }}>
                  <Text style={styles.squadRequestLink}>Request squad change →</Text>
                </TouchableOpacity>
              ) : null}
              {athlete?.slug ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`${WEB_BASE}/athlete/${athlete.slug}`)}
                  style={styles.viewProfileBtn}
                >
                  <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
                  <Text style={styles.viewProfileText}>View my profile</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {nextEvent ? (
          <View style={styles.nextSessionCard}>
            <View style={styles.nextSessionBgCircle1} />
            <View style={styles.nextSessionBgCircle2} />
            <View style={{ position: 'relative' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextSessionLabel}>NEXT SESSION</Text>
                  <Text style={styles.nextSessionTitle} numberOfLines={2}>{nextEvent.title}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="calendar-outline" size={14} color="rgba(196,181,253,1)" />
                      <Text style={styles.nextSessionMeta}>
                        {fmtFull(nextEvent.start_time)} at {fmtTime(nextEvent.start_time)}
                      </Text>
                    </View>
                    {nextEvent.location ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="location-outline" size={14} color="rgba(196,181,253,1)" />
                        <Text style={styles.nextSessionMeta}>{nextEvent.location}</Text>
                      </View>
                    ) : null}
                  </View>
                  {nextEvent.squad_name ? (
                    <View style={styles.squadPill}>
                      <Ionicons name="people-outline" size={12} color="#fff" />
                      <Text style={styles.squadPillText}>{nextEvent.squad_name}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateDay}>{fmtDay(nextEvent.start_time)}</Text>
                  <Text style={styles.dateMon}>{fmtMon(nextEvent.start_time)}</Text>
                </View>
              </View>
              {events.length > 1 ? (
                <View style={styles.nextSessionFooter}>
                  <Text style={styles.nextSessionFooterText}>{events.length - 1} more upcoming</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('AthleteMore', { screen: 'CalendarList' })}>
                    <Text style={styles.nextSessionFooterLink}>View calendar →</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.noSessionCard}>
            <Ionicons name="calendar-outline" size={36} color="#cbd5e1" />
            <Text style={styles.noSessionText}>No upcoming sessions</Text>
          </View>
        )}

        {announcements.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📢 Announcements</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
                <Text style={styles.sectionLink}>All →</Text>
              </TouchableOpacity>
            </View>
            {announcements.map(a => (
              <View key={a.id} style={styles.annoCard}>
                <Text style={styles.annoTitle} numberOfLines={1}>{a.title}</Text>
                {a.body ? <Text style={styles.annoBody} numberOfLines={1}>{a.body}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {milestones.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏆 My Milestones</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Milestones')}>
                <Text style={styles.sectionLink}>All →</Text>
              </TouchableOpacity>
            </View>
            {milestones.map(m => {
              const meta = FTEM_PHASES[m.ftem_phase]
              return (
                <View key={m.id} style={styles.milestoneCard}>
                  <Ionicons name="trophy" size={14} color="#f59e0b" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneTitle} numberOfLines={1}>{m.title}</Text>
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
        ) : null}

        {volunteering.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🤝 Volunteer Spots</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AthleteMore', { screen: 'VolunteeringScreen' })}>
                <Text style={styles.sectionLink}>All →</Text>
              </TouchableOpacity>
            </View>
            {volunteering.map(v => {
              const spotsLeft = v.spots ? v.spots - (v.signed_up ?? 0) : null
              const isFull = spotsLeft !== null && spotsLeft <= 0
              return (
                <View key={v.id} style={[styles.volCard, v.i_signed_up && styles.volCardSignedUp]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.volTitle} numberOfLines={1}>{v.title}</Text>
                    {v.date ? <Text style={styles.volMeta}>{fmtFull(v.date)}</Text> : null}
                  </View>
                  {v.i_signed_up ? (
                    <View style={[styles.spotsBadge, { backgroundColor: '#d1fae5' }]}>
                      <Text style={[styles.spotsText, { color: '#059669' }]}>You're in</Text>
                    </View>
                  ) : spotsLeft !== null ? (
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
        ) : null}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {showSquadRequest ? (
        <SquadRequestModal onClose={() => setShowSquadRequest(false)} />
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.sm },

  greetingRow: { marginBottom: spacing.md },
  greetingText: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  greetingDate: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },

  clubBanner: {
    backgroundColor: '#059669', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md, gap: 12,
  },
  clubBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  clubLogo: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#fff' },
  clubIconWrap: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  clubLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(167,243,208,1)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  clubName: { fontSize: font.xl, fontWeight: '800', color: '#fff' },
  clubDetail: { fontSize: font.xs, color: 'rgba(167,243,208,1)' },
  managerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12,
  },
  managerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  managerLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(167,243,208,1)', textTransform: 'uppercase', letterSpacing: 1 },
  managerName: { fontSize: font.sm, fontWeight: '700', color: '#fff', marginTop: 1 },
  managerEmail: { fontSize: font.xs, color: 'rgba(167,243,208,1)', marginTop: 1 },
  viewClubChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.lg,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  viewClubText: { fontSize: font.xs, fontWeight: '600', color: '#fff' },

  noClubCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  noClubText: { flex: 1, fontSize: font.sm, color: colors.textSecondary },

  inviteCard: {
    backgroundColor: '#fffbeb', borderWidth: 2, borderColor: '#fcd34d',
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
  },
  inviteRow: { flexDirection: 'row', gap: 12 },
  inviteIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  inviteTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text, lineHeight: 20 },
  inviteMeta: { fontSize: font.xs, color: '#64748b', marginTop: 3 },
  inviteActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 10,
  },
  acceptBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
  declineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 10, backgroundColor: '#fff',
  },
  declineBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },

  joinCard: {
    borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
  },
  joinCardPending: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  joinCardRejected: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  joinRow: { flexDirection: 'row', gap: 12 },
  joinIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  joinIconPending: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#bfdbfe' },
  joinIconRejected: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  joinTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text, lineHeight: 20 },
  joinMeta: { fontSize: font.xs, color: '#64748b', marginTop: 3 },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8,
    alignSelf: 'flex-start', backgroundColor: '#fff',
  },
  withdrawBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },

  profileCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 56, height: 56, borderRadius: 16 },
  profileInitials: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitialsText: { fontSize: 24 },
  profileName: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  profileSport: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  ftemBadge: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  ftemBadgeText: { fontSize: font.xs, fontWeight: '800' },
  ftemBadgeLabel: { fontSize: font.xs, color: colors.textMuted },
  squadRequestLink: { fontSize: font.xs, fontWeight: '600', color: colors.primary },
  viewProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5', borderRadius: radius.md, borderWidth: 1, borderColor: '#d1fae5',
    paddingHorizontal: 10, paddingVertical: 6,
  },
  viewProfileText: { fontSize: font.xs, fontWeight: '700', color: colors.primary },

  nextSessionCard: {
    backgroundColor: '#7c3aed', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md, overflow: 'hidden',
  },
  nextSessionBgCircle1: {
    position: 'absolute', right: -32, top: -32,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextSessionBgCircle2: {
    position: 'absolute', right: -16, bottom: 0,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextSessionLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(196,181,253,1)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  nextSessionTitle: { fontSize: font.xl, fontWeight: '800', color: '#fff', lineHeight: 28 },
  nextSessionMeta: { fontSize: font.sm, color: 'rgba(196,181,253,1)' },
  squadPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 10,
  },
  squadPillText: { fontSize: font.xs, fontWeight: '600', color: '#fff' },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center',
  },
  dateDay: { fontSize: 28, fontWeight: '900', color: '#fff', lineHeight: 32 },
  dateMon: { fontSize: font.sm, fontWeight: '700', color: 'rgba(196,181,253,1)', marginTop: 2 },
  nextSessionFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', marginTop: 14, paddingTop: 12,
  },
  nextSessionFooterText: { fontSize: font.xs, color: 'rgba(196,181,253,1)' },
  nextSessionFooterLink: { fontSize: font.xs, fontWeight: '700', color: '#fff' },

  noSessionCard: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1.5,
    borderColor: colors.borderLight, borderStyle: 'dashed', marginBottom: spacing.md,
  },
  noSessionText: { fontSize: font.sm, fontWeight: '600', color: '#94a3b8' },

  section: { marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  sectionLink: { fontSize: font.xs, color: colors.primary, fontWeight: '600' },

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
  milestoneMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  volCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  volCardSignedUp: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  volTitle: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  volMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  spotsBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  spotsText: { fontSize: 10, fontWeight: '700' },
})
