import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Image, Modal, Pressable,
  ScrollView,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { colors, font, spacing, radius } from '../../lib/theme'
import { SPORTS } from '../../lib/constants'

const OLYMPIC_SPORTS = SPORTS.filter(s => s.in2032)

const SORT_OPTIONS = [
  { value: 'az',     label: 'A → Z' },
  { value: 'za',     label: 'Z → A' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
]

// ── bottom-sheet dropdown ─────────────────────────────────────────────────────
function DropdownSheet({ visible, title, options, value, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ds.backdrop} onPress={onClose}>
        <Pressable style={ds.sheet} onPress={e => e.stopPropagation()}>
          <View style={ds.handle} />
          <Text style={ds.title}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={ds.option}
                onPress={() => { onSelect(opt.value); onClose() }}
              >
                <Text style={[ds.optionText, opt.value === value && ds.optionActive]}>
                  {opt.label}
                </Text>
                {opt.value === value && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const ds = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', paddingTop: 4,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginVertical: 10 },
  title: {
    fontSize: font.sm, fontWeight: '700', color: colors.text,
    paddingHorizontal: spacing.md, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  optionText:   { flex: 1, fontSize: font.sm, color: colors.textSecondary },
  optionActive: { color: colors.primary, fontWeight: '700' },
})

// ── club card ─────────────────────────────────────────────────────────────────
function ClubCard({ club, onPress }) {
  const sportMeta = SPORTS.find(s => s.value === club.sport)
  return (
    <TouchableOpacity style={c.card} onPress={() => onPress(club)} activeOpacity={0.75}>
      {/* Logo / emoji */}
      <View style={c.logoWrap}>
        {club.logo_url ? (
          <Image source={{ uri: club.logo_url }} style={c.logo} resizeMode="cover" />
        ) : (
          <Text style={c.logoEmoji}>{sportMeta?.emoji ?? '🏅'}</Text>
        )}
      </View>

      <View style={c.info}>
        <Text style={c.name} numberOfLines={2}>{club.name}</Text>
        {club.city ? (
          <View style={c.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={c.location}>{club.city}{club.state ? `, ${club.state}` : ''}</Text>
          </View>
        ) : null}
        {club.founded_year ? (
          <Text style={c.founded}>Est. {club.founded_year}</Text>
        ) : null}

        <View style={c.badgeRow}>
          {sportMeta?.in2032 ? (
            <View style={c.badge2032}>
              <Ionicons name="flash" size={9} color="#10b981" />
              <Text style={c.badge2032Text}>2032</Text>
            </View>
          ) : null}
          {!club.is_claimed ? (
            <View style={c.badgeUnclaimed}>
              <Text style={c.badgeUnclaimedText}>Unclaimed</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

const c = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  logoWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logo:      { width: 44, height: 44, borderRadius: 12 },
  logoEmoji: { fontSize: 22 },
  info:      { flex: 1, minWidth: 0 },
  name:      { fontSize: font.base, fontWeight: '700', color: colors.text, lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  location:  { fontSize: font.xs, color: colors.textMuted, fontWeight: '500' },
  founded:   { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  badgeRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  badge2032: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0',
    borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2,
  },
  badge2032Text:     { fontSize: 10, fontWeight: '700', color: '#059669' },
  badgeUnclaimed:    { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  badgeUnclaimedText:{ fontSize: 10, fontWeight: '700', color: '#b45309' },
})

// ── detail sheet ──────────────────────────────────────────────────────────────
function ClubDetailSheet({ club, onClose }) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [clubDetail,   setClubDetail]   = useState(null)
  const [joinStatus,   setJoinStatus]   = useState(null)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [joinMessage,  setJoinMessage]  = useState('')
  const [joinSaving,   setJoinSaving]   = useState(false)
  const [joinDone,     setJoinDone]     = useState(false)
  const [joinError,    setJoinError]    = useState('')

  const isAthlete = user && !['club_admin', 'coach', 'site_admin'].includes(user?.role)

  useEffect(() => {
    setClubDetail(null)
    setJoinStatus(null)
    setShowJoinForm(false)
    setJoinDone(false)
    setJoinMessage('')
    api.get(`/clubs/public/${club.slug}`).then(r => setClubDetail(r.data)).catch(() => {})
    if (isAthlete) {
      api.get(`/clubs/public/${club.slug}/my-join-status`)
        .then(r => setJoinStatus(r.data?.status ?? null))
        .catch(() => {})
    }
  }, [club.slug])

  async function sendJoinRequest() {
    setJoinSaving(true)
    setJoinError('')
    try {
      await api.post(`/clubs/public/${club.slug}/join-request`, { message: joinMessage })
      setJoinDone(true)
      setJoinStatus('pending')
    } catch (err) {
      setJoinError(err?.response?.data?.message ?? 'Something went wrong.')
    } finally { setJoinSaving(false) }
  }

  const managerFirstName = clubDetail?.managerFirstName
  const sportMeta = SPORTS.find(s => s.value === club.sport)

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      {/* Backdrop — independent from sheet, no flex chain */}
      <Pressable style={sh.backdrop} onPress={onClose} />

      {/* Sheet — absolutely anchored to bottom, no parent height dependency */}
      <View style={sh.sheet}>
        <View style={sh.handle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[sh.content, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={sh.header}>
            <View style={sh.logoWrap}>
              {club.logo_url ? (
                <Image source={{ uri: club.logo_url }} style={sh.logo} resizeMode="cover" />
              ) : (
                <Text style={sh.logoEmoji}>{sportMeta?.emoji ?? '🏅'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sh.name}>{club.name}</Text>
              {club.city ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                  <Text style={sh.location}>{club.city}{club.state ? `, ${club.state}` : ''}</Text>
                </View>
              ) : null}
              {club.is_claimed && managerFirstName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <Ionicons name="person-circle-outline" size={13} color={colors.textMuted} />
                  <Text style={sh.location}>Managed by {managerFirstName}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={sh.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }}>
            {sportMeta ? (
              <View style={sh.chip}>
                <Text style={sh.chipText}>{sportMeta.emoji} {sportMeta.label}</Text>
              </View>
            ) : null}
            {club.founded_year ? (
              <View style={sh.chip}>
                <Text style={sh.chipText}>Est. {club.founded_year}</Text>
              </View>
            ) : null}
            {club.is_claimed ? (
              <View style={[sh.chip, sh.chipGreen]}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <Text style={[sh.chipText, { color: '#059669' }]}>Verified</Text>
              </View>
            ) : (
              <View style={[sh.chip, sh.chipAmber]}>
                <Text style={[sh.chipText, { color: '#b45309' }]}>Unclaimed</Text>
              </View>
            )}
            {sportMeta?.in2032 ? (
              <View style={[sh.chip, sh.chipGreen]}>
                <Ionicons name="flash" size={11} color="#059669" />
                <Text style={[sh.chipText, { color: '#059669' }]}>Brisbane 2032</Text>
              </View>
            ) : null}
          </View>

          {club.description ? (
            <View style={sh.descBox}>
              <Text style={sh.descText}>{club.description}</Text>
            </View>
          ) : null}

          {/* Info rows */}
          {[
            club.email   && { label: 'Email',   value: club.email },
            club.phone   && { label: 'Phone',   value: club.phone },
            club.website && { label: 'Website', value: club.website },
            club.address && { label: 'Address', value: club.address },
          ].filter(Boolean).map(row => (
            <View key={row.label} style={sh.infoRow}>
              <Text style={sh.infoLabel}>{row.label}</Text>
              <Text style={sh.infoValue} numberOfLines={2}>{row.value}</Text>
            </View>
          ))}

          {/* Join section */}
          {isAthlete && club.is_claimed && (
            <View style={sh.joinSection}>
              {joinStatus === 'pending' && (
                <View style={sh.joinStatusRow}>
                  <Text style={sh.joinStatusText}>⏳ Join request pending review</Text>
                </View>
              )}
              {joinStatus === 'member' && (
                <View style={[sh.joinStatusRow, sh.joinStatusGreen]}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={[sh.joinStatusText, { color: '#059669' }]}>You're a member</Text>
                </View>
              )}
              {joinStatus === 'rejected' && (
                <View style={[sh.joinStatusRow, sh.joinStatusRed]}>
                  <Text style={[sh.joinStatusText, { color: '#dc2626' }]}>Request declined</Text>
                </View>
              )}
              {(joinStatus === null || joinStatus === 'approved') && !joinDone && !showJoinForm && (
                <TouchableOpacity style={sh.joinBtn} onPress={() => setShowJoinForm(true)} activeOpacity={0.85}>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={sh.joinBtnText}>Request to join</Text>
                </TouchableOpacity>
              )}
              {(joinStatus === null || joinStatus === 'approved') && showJoinForm && !joinDone && (
                <View>
                  <View style={sh.joinUserRow}>
                    <View style={sh.joinAvatar}>
                      <Text style={sh.joinAvatarText}>{user?.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={sh.joinUserName} numberOfLines={1}>{user?.full_name}</Text>
                      <Text style={sh.joinUserEmail} numberOfLines={1}>{user?.email}</Text>
                    </View>
                    <Text style={sh.sendingAsLabel}>Sending as</Text>
                  </View>
                  <TextInput
                    style={sh.joinTextArea}
                    value={joinMessage}
                    onChangeText={setJoinMessage}
                    placeholder="Introduce yourself, your experience, position…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  {joinError ? (
                    <View style={sh.joinError}>
                      <Text style={sh.joinErrorText}>{joinError}</Text>
                    </View>
                  ) : null}
                  <View style={sh.joinButtons}>
                    <TouchableOpacity style={sh.joinCancelBtn} onPress={() => { setShowJoinForm(false); setJoinError('') }}>
                      <Text style={sh.joinCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[sh.joinSendBtn, joinSaving && { opacity: 0.6 }]}
                      onPress={sendJoinRequest}
                      disabled={joinSaving}
                    >
                      {joinSaving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Ionicons name="send-outline" size={15} color="#fff" />
                      }
                      <Text style={sh.joinSendText}>Send request</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {joinDone && (
                <View style={sh.joinDoneWrap}>
                  <Text style={sh.joinDoneEmoji}>🙌</Text>
                  <Text style={sh.joinDoneTitle}>Request sent!</Text>
                  <Text style={sh.joinDoneMsg}>The club manager will review your request and get back to you.</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const sh = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '90%',
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 4,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginVertical: 10 },
  content: { padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: spacing.md },
  logoWrap: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logo:      { width: 56, height: 56, borderRadius: 14 },
  logoEmoji: { fontSize: 26 },
  name:      { fontSize: font.lg, fontWeight: '800', color: colors.text, lineHeight: 24 },
  location:  { fontSize: font.sm, color: colors.textMuted },
  closeBtn:  { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  chipGreen: { backgroundColor: '#ecfdf5' },
  chipAmber: { backgroundColor: '#fffbeb' },
  chipText:  { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  descBox:   { backgroundColor: colors.background, borderRadius: radius.md, padding: 12, marginBottom: spacing.md },
  descText:  { fontSize: font.sm, color: colors.textSecondary, lineHeight: 20 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  infoLabel: { fontSize: font.sm, color: colors.textMuted, fontWeight: '500', width: 70 },
  infoValue: { flex: 1, fontSize: font.sm, color: colors.text, fontWeight: '600', textAlign: 'right' },

  // Join section — inside ScrollView, separator above
  joinSection: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 14,
  },
  joinBtnText: { fontSize: font.base, fontWeight: '700', color: '#fff' },
  joinStatusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#fffbeb', borderRadius: radius.lg, paddingVertical: 12,
    borderWidth: 1, borderColor: '#fde68a',
  },
  joinStatusGreen: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  joinStatusRed:   { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  joinStatusText:  { fontSize: font.sm, fontWeight: '600', color: '#b45309' },

  // Join form
  joinUserRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.background, borderRadius: radius.md,
    padding: 12, marginBottom: spacing.sm,
  },
  joinAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  joinAvatarText:  { fontSize: 13, fontWeight: '800', color: colors.primary },
  joinUserName:    { fontSize: font.sm, fontWeight: '700', color: colors.text },
  joinUserEmail:   { fontSize: 11, color: colors.textMuted },
  sendingAsLabel:  { fontSize: 10, fontWeight: '700', color: colors.textMuted, flexShrink: 0 },
  joinTextArea: {
    backgroundColor: colors.background, borderRadius: radius.md,
    padding: 12, fontSize: font.sm, color: colors.text, lineHeight: 20,
    minHeight: 72, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  joinError:     { backgroundColor: '#fef2f2', borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#fecaca' },
  joinErrorText: { fontSize: font.xs, color: '#dc2626' },
  joinButtons:   { flexDirection: 'row', gap: 8 },
  joinCancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 12, alignItems: 'center' },
  joinCancelText:{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },
  joinSendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 12,
  },
  joinSendText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },

  // Join done
  joinDoneWrap:  { alignItems: 'center', paddingVertical: spacing.md },
  joinDoneEmoji: { fontSize: 36, marginBottom: 8 },
  joinDoneTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, marginBottom: 4 },
  joinDoneMsg:   { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
})

// ── filter button ─────────────────────────────────────────────────────────────
function FilterBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[f.btn, active && f.btnActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[f.btnText, active && f.btnTextActive]}>{label}</Text>
      <Ionicons name="chevron-down" size={12} color={active ? colors.primary : colors.textMuted} />
    </TouchableOpacity>
  )
}

const f = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  btnActive: { borderColor: colors.primary, backgroundColor: '#f0fdf4' },
  btnText:   { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  btnTextActive: { color: colors.primary },
})

// ── main screen ───────────────────────────────────────────────────────────────
export default function ClubsScreen({ route }) {
  const openSlug = route?.params?.openSlug ?? null

  const [clubs,   setClubs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [q,       setQ]       = useState('')
  const [sport,   setSport]   = useState('')
  const [suburb,  setSuburb]  = useState('')
  const [sort,    setSort]    = useState('az')
  const [detail,  setDetail]  = useState(null)

  const [sportSheet,  setSportSheet]  = useState(false)
  const [suburbSheet, setSuburbSheet] = useState(false)
  const [sortSheet,   setSortSheet]   = useState(false)

  useEffect(() => {
    api.get('/clubs/public')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : []
        setClubs(list)
        if (openSlug) {
          const match = list.find(c => c.slug === openSlug)
          if (match) setDetail(match)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Suburbs derived from sport-filtered set
  const availableSuburbs = useMemo(() => {
    const base = clubs.filter(c => !sport || c.sport === sport)
    return ['', ...new Set(base.map(c => c.city).filter(Boolean))].map(s => ({
      value: s,
      label: s || 'All suburbs',
    }))
  }, [clubs, sport])

  const filtered = useMemo(() => {
    const lq = q.toLowerCase()
    return clubs
      .filter(c => {
        if (q && !c.name.toLowerCase().includes(lq) && !(c.city ?? '').toLowerCase().includes(lq) && !(c.description ?? '').toLowerCase().includes(lq)) return false
        if (sport  && c.sport !== sport)  return false
        if (suburb && c.city  !== suburb) return false
        return true
      })
      .sort((a, b) => {
        if (sort === 'za')     return b.name.localeCompare(a.name)
        if (sort === 'oldest') return (a.founded_year ?? 9999) - (b.founded_year ?? 9999)
        if (sort === 'newest') return (b.founded_year ?? 0)    - (a.founded_year ?? 0)
        return a.name.localeCompare(b.name)
      })
  }, [clubs, q, sport, suburb, sort])

  const hasFilters = q || sport || suburb
  const sportLabel = SPORTS.find(s => s.value === sport)?.label
  const suburbLabel = suburb || null
  const sortLabel   = SORT_OPTIONS.find(s => s.value === sort)?.label ?? 'Sort'

  const sportOptions = [
    { value: '', label: 'All sports' },
    ...OLYMPIC_SPORTS.map(s => ({ value: s.value, label: `${s.emoji} ${s.label}` })),
  ]

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search by club name or suburb…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {q ? (
            <TouchableOpacity onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter row */}
      <View style={s.filterRow}>
        <FilterBtn
          label={sportLabel ?? 'Sport'}
          active={!!sport}
          onPress={() => setSportSheet(true)}
        />
        <FilterBtn
          label={suburbLabel ?? 'Suburb'}
          active={!!suburb}
          onPress={() => setSuburbSheet(true)}
        />
        <FilterBtn
          label={sortLabel}
          active={sort !== 'az'}
          onPress={() => setSortSheet(true)}
        />
        {hasFilters ? (
          <TouchableOpacity
            style={s.clearBtn}
            onPress={() => { setQ(''); setSport(''); setSuburb('') }}
          >
            <Ionicons name="close" size={13} color={colors.textMuted} />
            <Text style={s.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={s.resultCount}>{filtered.length} club{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🏟️</Text>
          <Text style={s.emptyTitle}>No clubs found</Text>
          <Text style={s.emptyMsg}>
            {hasFilters ? 'Try adjusting your search or filters' : 'No public clubs yet.'}
          </Text>
          {hasFilters ? (
            <TouchableOpacity onPress={() => { setQ(''); setSport(''); setSuburb('') }}>
              <Text style={s.clearLink}>Clear filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <ClubCard club={item} onPress={setDetail} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Dropdowns */}
      <DropdownSheet
        visible={sportSheet}
        title="Filter by sport"
        options={sportOptions}
        value={sport}
        onSelect={v => { setSport(v); setSuburb('') }}
        onClose={() => setSportSheet(false)}
      />
      <DropdownSheet
        visible={suburbSheet}
        title="Filter by suburb"
        options={availableSuburbs}
        value={suburb}
        onSelect={setSuburb}
        onClose={() => setSuburbSheet(false)}
      />
      <DropdownSheet
        visible={sortSheet}
        title="Sort clubs"
        options={SORT_OPTIONS}
        value={sort}
        onSelect={setSort}
        onClose={() => setSortSheet(false)}
      />

      {/* Club detail sheet */}
      {detail ? (
        <ClubDetailSheet club={detail} onClose={() => setDetail(null)} />
      ) : null}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: radius.md,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: font.base, color: colors.text },

  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8 },
  clearBtnText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  resultCount: { marginLeft: 'auto', fontSize: 11, color: colors.textMuted, fontWeight: '500' },

  list:  { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptyMsg:   { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  clearLink:  { marginTop: 12, fontSize: font.sm, color: colors.primary, fontWeight: '600' },
})
