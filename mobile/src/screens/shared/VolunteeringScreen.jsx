import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert, Modal,
  TextInput, ScrollView, Linking, Platform, KeyboardAvoidingView,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { colors, font, spacing, radius } from '../../lib/theme'
import UpgradeSheet, { parseUpgradeError } from '../../components/UpgradeSheet'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtAbsolute(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtRelative(str) {
  if (!str) return null
  const date = new Date(str)
  const now   = new Date()
  const diff  = Math.ceil((date - now) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff > 1 && diff <= 14) return `In ${diff} days`
  return null
}

function toDateStr(d) {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const isPastDate = (str) => str && new Date(str) < new Date(new Date().setHours(0, 0, 0, 0))

// ── SpotsBar ──────────────────────────────────────────────────────────────────

function SpotsBar({ spots, signedUp }) {
  if (!spots) return null
  const filled = signedUp ?? 0
  const pct    = Math.min(100, Math.round((filled / spots) * 100))
  const full   = pct >= 100

  return (
    <View style={s.spotsBarWrap}>
      <View style={s.spotsBarMeta}>
        <Text style={s.spotsBarCount}>{filled} / {spots} volunteers</Text>
        <Text style={[s.spotsBarLeft, full && s.spotsBarFull]}>
          {full ? 'Full' : `${spots - filled} left`}
        </Text>
      </View>
      <View style={s.spotsTrack}>
        <View
          style={[
            s.spotsFill,
            { width: `${pct}%`, backgroundColor: full ? '#ef4444' : colors.primary },
          ]}
        />
      </View>
    </View>
  )
}

// ── RosterSheet ───────────────────────────────────────────────────────────────

function RosterSheet({ visible, opportunity, signups, loading, onClose, onRemove }) {
  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <View style={s.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <View style={s.sheetHeaderInfo}>
              <Text style={s.sheetHeaderLabel}>Volunteers</Text>
              <Text style={s.sheetHeaderTitle} numberOfLines={1}>{opportunity?.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.sheetClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={s.sheetCenter}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : signups.length === 0 ? (
            <View style={s.sheetCenter}>
              <Text style={s.sheetEmpty}>No volunteers yet.</Text>
            </View>
          ) : (
            <ScrollView style={s.sheetScroll} contentContainerStyle={s.sheetScrollContent} showsVerticalScrollIndicator={false}>
              {signups.map(sv => (
                <View key={sv.signup_id} style={s.rosterRow}>
                  <View style={s.rosterInfo}>
                    <View style={s.rosterNameRow}>
                      <Text style={s.rosterName}>{sv.full_name}</Text>
                      {!!sv.role && (
                        <View style={s.rosterRoleChip}>
                          <Text style={s.rosterRoleText}>{sv.role.replace('_', ' ')}</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.rosterContacts}>
                      <TouchableOpacity
                        style={s.rosterContact}
                        onPress={() => Linking.openURL(`mailto:${sv.email}`)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="mail-outline" size={12} color={colors.primary} />
                        <Text style={s.rosterContactText} numberOfLines={1}>{sv.email}</Text>
                      </TouchableOpacity>
                      {!!sv.phone && (
                        <TouchableOpacity
                          style={s.rosterContact}
                          onPress={() => Linking.openURL(`tel:${sv.phone}`)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                          <Text style={s.rosterContactText}>{sv.phone}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={s.rosterRemoveBtn}
                    onPress={() => onRemove(sv.user_id, sv.full_name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={15} color="#cbd5e1" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

// ── AddModal ──────────────────────────────────────────────────────────────────

function AddModal({ visible, onClose, onSave }) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation]       = useState('')
  const [date, setDate]               = useState(null)
  const [spots, setSpots]             = useState('1')
  const [showPicker, setShowPicker]   = useState(false)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    if (visible) {
      setTitle(''); setDescription(''); setLocation('')
      setDate(null); setSpots('1'); setShowPicker(false); setSaving(false)
    }
  }, [visible])

  async function handleSave() {
    if (!title.trim()) return Alert.alert('Title required', 'Please enter a title for this opportunity.')
    setSaving(true)
    try {
      await onSave({
        title:       title.trim(),
        description: description.trim() || undefined,
        location:    location.trim() || undefined,
        date:        date ? toDateStr(date) : undefined,
        spots:       parseInt(spots) > 0 ? parseInt(spots) : undefined,
      })
    } finally { setSaving(false) }
  }

  const dateLabel = date
    ? date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Select date'

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={s.modalSafe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose} style={s.modalCancelBtn}>
            <Text style={s.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>Add opportunity</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[s.modalSaveBtn, saving && { opacity: 0.5 }]}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.modalSaveText}>Add & notify</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={s.modalScroll} contentContainerStyle={s.modalScrollContent} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Title <Text style={s.fieldRequired}>*</Text></Text>
            <TextInput
              style={s.fieldInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Canteen helper"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Description</Text>
            <TextInput
              style={[s.fieldInput, s.fieldMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's involved?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Location */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Location</Text>
            <TextInput
              style={s.fieldInput}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Club grounds"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
            />
          </View>

          {/* Date */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Date</Text>
            <TouchableOpacity
              style={[s.fieldInput, s.fieldDateBtn]}
              onPress={() => setShowPicker(p => !p)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={16} color={date ? colors.text : colors.textMuted} />
              <Text style={[s.fieldDateText, !date && { color: colors.textMuted }]}>{dateLabel}</Text>
              {date && (
                <TouchableOpacity
                  onPress={() => setDate(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={date ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={(_, d) => {
                  if (Platform.OS === 'android') setShowPicker(false)
                  if (d) setDate(d)
                }}
              />
            )}
          </View>

          {/* Spots */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Number of spots</Text>
            <TextInput
              style={s.fieldInput}
              value={spots}
              onChangeText={setSpots}
              placeholder="1"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>

          {/* Info note */}
          <View style={s.noticeRow}>
            <Ionicons name="people-outline" size={13} color={colors.textMuted} />
            <Text style={s.noticeText}>All club members will be notified when you save.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── VolunteerCard ─────────────────────────────────────────────────────────────

function VolunteerCard({ v, isAdmin, toggling, isPast, onToggle, onDelete, onViewVolunteers }) {
  const spotsLeft = v.spots ? v.spots - (v.signed_up ?? 0) : null
  const full      = spotsLeft !== null && spotsLeft <= 0
  const relative  = !isPast ? fmtRelative(v.date) : null

  const toggleLabel = toggling ? '…' : v.i_signed_up ? 'Cancel' : full ? 'Full' : 'Volunteer'
  const toggleDisabled = toggling || (full && !v.i_signed_up) || isPast

  return (
    <View style={[s.card, v.i_signed_up && s.cardSignedUp, isPast && s.cardPast]}>
      {/* Top row: title + delete */}
      <View style={s.cardTopRow}>
        <View style={s.cardTitleWrap}>
          <Text style={s.cardTitle}>{v.title}</Text>
          {v.i_signed_up && (
            <View style={s.signedUpBadge}>
              <Ionicons name="checkmark-circle" size={11} color="#059669" />
              <Text style={s.signedUpText}>You're in</Text>
            </View>
          )}
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={s.cardDeleteBtn}
            onPress={() => onDelete(v.id, v.title)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      {!!v.description && (
        <Text style={s.cardDesc} numberOfLines={2}>{v.description}</Text>
      )}

      {/* Meta: date + location */}
      {(!!v.date || !!v.location) && (
        <View style={s.cardMeta}>
          {!!v.date && (
            <View style={s.cardMetaRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              {relative && (
                <Text style={[
                  s.cardMetaRelative,
                  (relative === 'Today' || relative === 'Tomorrow') && s.cardMetaRelativeAmber,
                ]}>
                  {relative} —
                </Text>
              )}
              <Text style={s.cardMetaText}>{fmtAbsolute(v.date)}</Text>
            </View>
          )}
          {!!v.location && (
            <View style={s.cardMetaRow}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={s.cardMetaText}>{v.location}</Text>
            </View>
          )}
        </View>
      )}

      {/* Spots progress bar */}
      {!isPast && <SpotsBar spots={v.spots} signedUp={v.signed_up} />}

      {/* Bottom row: action button + view volunteers */}
      <View style={s.cardActions}>
        {!isPast && (
          <TouchableOpacity
            style={[
              s.toggleBtn,
              v.i_signed_up ? s.toggleBtnCancel : full ? s.toggleBtnFull : s.toggleBtnJoin,
              toggleDisabled && !v.i_signed_up && { opacity: 0.5 },
            ]}
            onPress={() => onToggle(v)}
            disabled={toggleDisabled}
            activeOpacity={0.8}
          >
            {toggling
              ? <ActivityIndicator size="small" color={v.i_signed_up ? '#059669' : '#fff'} />
              : <Ionicons
                  name={v.i_signed_up ? 'close-circle-outline' : full ? 'ban-outline' : 'checkmark-circle'}
                  size={15}
                  color={v.i_signed_up ? '#059669' : '#fff'}
                />}
            <Text style={[s.toggleBtnText, v.i_signed_up && s.toggleBtnTextCancel]}>
              {toggleLabel}
            </Text>
          </TouchableOpacity>
        )}

        {isAdmin && (v.signed_up ?? 0) > 0 && (
          <TouchableOpacity
            style={s.viewVolsBtn}
            onPress={() => onViewVolunteers(v)}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={13} color={colors.textMuted} />
            <Text style={s.viewVolsText}>
              {v.signed_up} volunteer{v.signed_up !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function VolunteeringScreen() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'club_admin' || user?.role === 'site_admin'

  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toggling, setToggling]   = useState({})
  const [tab, setTab]             = useState('upcoming')
  const [showAdd, setShowAdd]     = useState(false)
  const [upgrade, setUpgrade]     = useState(null)

  // Roster sheet state
  const [roster, setRoster]       = useState({ visible: false, v: null, signups: [], loading: false })

  const today    = new Date(new Date().setHours(0, 0, 0, 0))
  const upcoming = items.filter(v => !v.date || new Date(v.date) >= today)
  const past     = items.filter(v => v.date && new Date(v.date) < today)
  const displayed = tab === 'upcoming' ? upcoming : past

  async function load() {
    try {
      const { data } = await api.get('/volunteering')
      setItems(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [])

  async function handleAdd(form) {
    try {
      await api.post('/volunteering', form)
      await load()
      setShowAdd(false)
    } catch (e) {
      const up = parseUpgradeError(e)
      if (up) { setShowAdd(false); setUpgrade(up); return }
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to create opportunity.')
    }
  }

  async function toggleSignup(v) {
    setToggling(p => ({ ...p, [v.id]: true }))
    try {
      if (v.i_signed_up) {
        await api.delete(`/volunteering/${v.id}/signup`)
      } else {
        if (v.spots && (v.signed_up ?? 0) >= v.spots) {
          Alert.alert('Full', 'No spots remaining for this opportunity.')
          return
        }
        await api.post(`/volunteering/${v.id}/signup`)
      }
      await load()
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Action failed.')
    } finally {
      setToggling(p => { const n = { ...p }; delete n[v.id]; return n })
    }
  }

  function handleDelete(id, title) {
    Alert.alert(
      'Remove opportunity',
      `Remove "${title}"? All signed-up volunteers will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/volunteering/${id}`)
              setItems(p => p.filter(x => x.id !== id))
            } catch {
              Alert.alert('Error', 'Failed to remove opportunity.')
            }
          },
        },
      ]
    )
  }

  async function openRoster(v) {
    setRoster({ visible: true, v, signups: [], loading: true })
    try {
      const { data } = await api.get(`/volunteering/${v.id}/signups`)
      setRoster(p => ({ ...p, signups: data, loading: false }))
    } catch {
      setRoster(p => ({ ...p, loading: false }))
    }
  }

  function closeRoster() {
    setRoster({ visible: false, v: null, signups: [], loading: false })
  }

  function handleRemoveVolunteer(userId, name) {
    Alert.alert(
      'Remove volunteer',
      `Remove ${name} from this opportunity? They will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/volunteering/${roster.v.id}/volunteers/${userId}`)
              setRoster(p => ({ ...p, signups: p.signups.filter(sv => sv.user_id !== userId) }))
              // Refresh count
              setItems(p => p.map(x => x.id === roster.v.id ? { ...x, signed_up: (x.signed_up ?? 1) - 1 } : x))
            } catch {
              Alert.alert('Error', 'Failed to remove volunteer.')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <FlatList
        data={displayed}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[s.content, displayed.length === 0 && s.contentEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <VolunteerCard
            v={item}
            isAdmin={isAdmin}
            toggling={!!toggling[item.id]}
            isPast={tab === 'past'}
            onToggle={toggleSignup}
            onDelete={handleDelete}
            onViewVolunteers={openRoster}
          />
        )}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={s.tabRow}>
              {[
                { key: 'upcoming', label: `Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}` },
                { key: 'past',     label: `Past${past.length ? ` (${past.length})` : ''}` },
              ].map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
                  onPress={() => setTab(t.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabBtnText, tab === t.key && s.tabBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          items.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="hand-left-outline" size={32} color="#94a3b8" />
              </View>
              <Text style={s.emptyTitle}>No volunteering opportunities yet</Text>
              <Text style={s.emptySubtitle}>
                {isAdmin
                  ? 'Add an opportunity to get your community involved.'
                  : 'Your club hasn\'t posted any opportunities yet.'}
              </Text>
              {isAdmin && (
                <TouchableOpacity style={s.emptyAddBtn} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={s.emptyAddBtnText}>Add first opportunity</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={s.tabEmpty}>
              <Text style={s.tabEmptyText}>No {tab} opportunities</Text>
            </View>
          )
        }
      />

      {/* FAB */}
      {isAdmin && (
        <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Add modal */}
      <AddModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAdd}
      />

      {/* Roster sheet */}
      <RosterSheet
        visible={roster.visible}
        opportunity={roster.v}
        signups={roster.signups}
        loading={roster.loading}
        onClose={closeRoster}
        onRemove={handleRemoveVolunteer}
      />
      <UpgradeSheet
        visible={!!upgrade}
        message={upgrade?.message}
        requiredPlan={upgrade?.requiredPlan}
        onClose={() => setUpgrade(null)}
      />
    </SafeAreaView>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.background },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:      { padding: spacing.md, paddingBottom: 100 },
  contentEmpty: { flexGrow: 1 },

  // Tab switcher
  tabRow: {
    flexDirection: 'row', gap: 6,
    backgroundColor: '#f1f5f9', borderRadius: radius.lg,
    padding: 4, marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1, borderRadius: radius.md,
    paddingVertical: 8, alignItems: 'center',
  },
  tabBtnActive:     { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabBtnText:       { fontSize: font.sm, fontWeight: '600', color: colors.textMuted },
  tabBtnTextActive: { color: colors.text },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderLight,
    padding: 16, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardSignedUp: { borderColor: '#a7f3d0' },
  cardPast:     { opacity: 0.7 },

  cardTopRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  cardTitleWrap: { flex: 1, gap: 4 },
  cardTitle:     { fontSize: font.md, fontWeight: '800', color: colors.text, lineHeight: 22 },
  cardDeleteBtn: {
    width: 34, height: 34, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },

  signedUpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#d1fae5', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  signedUpText: { fontSize: 11, fontWeight: '700', color: '#059669' },

  cardDesc: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },

  cardMeta:    { gap: 4, marginBottom: 8 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  cardMetaText: { fontSize: font.xs, color: colors.textMuted, flexShrink: 1 },
  cardMetaRelative: { fontSize: font.xs, fontWeight: '700', color: colors.text },
  cardMetaRelativeAmber: { color: '#b45309' },

  // Spots bar
  spotsBarWrap: { marginBottom: 12 },
  spotsBarMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  spotsBarCount: { fontSize: font.xs, color: colors.textMuted, fontWeight: '500' },
  spotsBarLeft:  { fontSize: font.xs, color: '#059669', fontWeight: '700' },
  spotsBarFull:  { color: '#dc2626' },
  spotsTrack: {
    height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', overflow: 'hidden',
  },
  spotsFill: { height: 6, borderRadius: 3 },

  // Card actions
  cardActions:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.lg, paddingVertical: 10, minHeight: 44,
  },
  toggleBtnJoin:   { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  toggleBtnCancel: { backgroundColor: '#ecfdf5', borderWidth: 1.5, borderColor: '#a7f3d0' },
  toggleBtnFull:   { backgroundColor: '#f1f5f9' },
  toggleBtnText:       { fontSize: font.sm, fontWeight: '700', color: '#fff' },
  toggleBtnTextCancel: { color: '#059669' },

  viewVolsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8 },
  viewVolsText: { fontSize: font.xs, fontWeight: '600', color: colors.textMuted },

  // Empty states
  empty: {
    alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 48,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  emptyTitle:    { fontSize: font.lg, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: spacing.md,
  },
  emptyAddBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },

  tabEmpty: { alignItems: 'center', paddingVertical: 48 },
  tabEmptyText: { fontSize: font.sm, color: colors.textMuted, fontWeight: '500' },

  // FAB
  fab: {
    position: 'absolute', right: spacing.md, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },

  // Add modal
  modalSafe:          { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  modalTitle:      { fontSize: font.md, fontWeight: '800', color: colors.text },
  modalCancelBtn:  { paddingVertical: 4, paddingHorizontal: 4 },
  modalCancelText: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
  modalSaveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 80, alignItems: 'center',
  },
  modalSaveText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },

  modalScroll:        { flex: 1 },
  modalScrollContent: { padding: spacing.md, paddingBottom: 40, gap: 16 },

  fieldGroup:    { gap: 6 },
  fieldLabel:    { fontSize: font.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldRequired: { color: colors.error },
  fieldInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: font.sm, color: colors.text, backgroundColor: '#fff',
    minHeight: 48,
  },
  fieldMultiline: { minHeight: 80, paddingTop: 12 },
  fieldDateBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldDateText:  { flex: 1, fontSize: font.sm, color: colors.text },

  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noticeText: { fontSize: font.xs, color: colors.textMuted, flex: 1 },

  // Roster sheet
  sheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '75%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 16,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sheetHeaderInfo:  { flex: 1, marginRight: 12 },
  sheetHeaderLabel: { fontSize: font.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  sheetHeaderTitle: { fontSize: font.md, fontWeight: '700', color: colors.text, marginTop: 2 },
  sheetClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetCenter:       { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  sheetEmpty:        { fontSize: font.sm, color: colors.textMuted },
  sheetScroll:       { maxHeight: 400 },
  sheetScrollContent: { padding: 16, gap: 8 },

  rosterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f8fafc', borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  rosterInfo:     { flex: 1, minWidth: 0 },
  rosterNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  rosterName:     { fontSize: font.sm, fontWeight: '700', color: colors.text },
  rosterRoleChip: {
    backgroundColor: '#e2e8f0', borderRadius: radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  rosterRoleText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' },

  rosterContacts:     { gap: 3 },
  rosterContact:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rosterContactText:  { fontSize: font.xs, color: colors.primary, flexShrink: 1 },

  rosterRemoveBtn: {
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.md, flexShrink: 0,
  },
})
