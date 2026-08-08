import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import Avatar from '../../components/Avatar'
import UpgradeSheet, { parseUpgradeError } from '../../components/UpgradeSheet'

// ── helpers ───────────────────────────────────────────────────────────────────

function ftemBg(phase) { return FTEM_PHASES[phase]?.bgColor ?? '#f1f5f9' }
function ftemFg(phase) { return FTEM_PHASES[phase]?.textColor ?? '#475569' }

function sportEmoji(sport) {
  const map = { soccer:'⚽',football:'🏈',basketball:'🏀',tennis:'🎾',swimming:'🏊',athletics:'🏃',rugby:'🏉',cricket:'🏏',netball:'🥅',gymnastics:'🤸',volleyball:'🏐',hockey:'🏑' }
  if (!sport) return '🏅'
  const key = sport.toLowerCase()
  for (const [k, v] of Object.entries(map)) { if (key.includes(k)) return v }
  return '🏅'
}

function athleteName(a) {
  return a.name ?? (`${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || '—')
}

// ── Pending squad requests ────────────────────────────────────────────────────

function PendingSection({ onApproved }) {
  const [requests, setRequests] = useState([])
  const [acting, setActing]     = useState(null)

  useEffect(() => {
    api.get('/squad-requests').then(r => setRequests(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  if (requests.length === 0) return null

  async function act(id, action) {
    setActing(id + action)
    try {
      await api.put(`/squad-requests/${id}/${action}`)
      setRequests(p => p.filter(r => r.id !== id))
      if (action === 'approve') onApproved?.()
    } catch {
      Alert.alert('Error', 'Action failed.')
    } finally { setActing(null) }
  }

  return (
    <View style={s.pendingSection}>
      <View style={s.pendingHeader}>
        <Ionicons name="time-outline" size={15} color="#d97706" />
        <Text style={s.pendingHeaderText}>
          {requests.length} pending squad request{requests.length !== 1 ? 's' : ''}
        </Text>
      </View>
      {requests.map(r => {
        const name = athleteName(r.athlete ?? {})
        return (
          <View key={r.id} style={s.pendingRow}>
            <Avatar url={r.athlete?.avatar_url} name={name} size="sm" />
            <View style={s.pendingInfo}>
              <Text style={s.pendingName} numberOfLines={1}>{name}</Text>
              <Text style={s.pendingDetail} numberOfLines={1}>
                Wants to join <Text style={{ fontWeight: '700' }}>{r.squad?.name}</Text>
                {r.reason ? ` · "${r.reason}"` : ''}
              </Text>
            </View>
            <View style={s.pendingActions}>
              <TouchableOpacity
                style={[s.pendingApprove, !!acting && { opacity: 0.5 }]}
                onPress={() => act(r.id, 'approve')}
                disabled={!!acting}
                activeOpacity={0.8}
              >
                {acting === r.id + 'approve'
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="checkmark" size={12} color="#fff" /><Text style={s.pendingApproveText}>Approve</Text></>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.pendingDecline, !!acting && { opacity: 0.5 }]}
                onPress={() => act(r.id, 'reject')}
                disabled={!!acting}
                activeOpacity={0.8}
              >
                <Text style={s.pendingDeclineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ── Squad Card ────────────────────────────────────────────────────────────────

function SquadCard({ squad, isAdmin, onPress, onEdit, onDelete }) {
  const count = squad.athletes_count ?? squad.athlete_count ?? 0
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.cardTop}>
        <View style={s.cardIcon}>
          <Ionicons name="layers-outline" size={20} color={colors.primary} />
        </View>
        <View style={s.cardMeta}>
          <Text style={s.cardName} numberOfLines={1}>{squad.name}</Text>
          <Text style={s.cardDesc} numberOfLines={1}>
            {squad.description || 'No description'}
          </Text>
        </View>
        {isAdmin && (
          <View style={s.cardBtns}>
            <TouchableOpacity style={s.cardIconBtn} onPress={onEdit} activeOpacity={0.7} hitSlop={8}>
              <Ionicons name="pencil-outline" size={15} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={s.cardIconBtn} onPress={onDelete} activeOpacity={0.7} hitSlop={8}>
              <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={s.cardFooter}>
        <View style={s.countChip}>
          <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
          <Text style={s.countChipText}>{count} athlete{count !== 1 ? 's' : ''}</Text>
        </View>
        <View style={s.viewRoster}>
          <Text style={s.viewRosterText}>View roster</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Squad create / edit modal ─────────────────────────────────────────────────

function SquadModal({ squad, onClose, onSaved }) {
  const [form, setForm]   = useState({ name: squad?.name ?? '', description: squad?.description ?? '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name.trim()) { Alert.alert('Required', 'Please enter a squad name.'); return }
    setSaving(true)
    try {
      if (squad) {
        await api.put(`/squads/${squad.id}`, form)
        onSaved({ ...squad, ...form })
      } else {
        const { data } = await api.post('/squads', form)
        onSaved({ ...data, athletes_count: 0 })
      }
      onClose()
    } catch (err) {
      const up = parseUpgradeError(err)
      if (up) { onClose(); onUpgrade?.(up); return }
      Alert.alert('Error', squad ? 'Failed to save squad.' : 'Failed to create squad.')
      setSaving(false)
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <View style={s.modalHeaderLeft}>
              <View style={s.modalIcon}>
                <Ionicons name="layers-outline" size={20} color={colors.primary} />
              </View>
              <Text style={s.modalTitle}>{squad ? 'Edit squad' : 'New squad'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.modalClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>Squad name <Text style={s.labelRequired}>*</Text></Text>
            <TextInput
              style={s.input}
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
              placeholder="e.g. Senior Div 1 Men, U16 Girls…"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <Text style={[s.label, { marginTop: spacing.md }]}>
              Description <Text style={s.labelOptional}>(optional)</Text>
            </Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              placeholder="Age group, competition level, notes…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={s.modalFooter}>
            <TouchableOpacity onPress={onClose} style={s.footerCancel} activeOpacity={0.8}>
              <Text style={s.footerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !form.name.trim()}
              style={[s.footerSave, (saving || !form.name.trim()) && { opacity: 0.5 }]}
              activeOpacity={0.8}
            >
              {saving && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
              <Text style={s.footerSaveText}>{saving ? 'Saving…' : squad ? 'Save changes' : 'Create squad'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Roster bottom sheet ───────────────────────────────────────────────────────

function RosterSheet({ squad, isAdmin, onClose, onAthleteCountChanged }) {
  const [athletes,        setAthletes]        = useState(null)
  const [removing,        setRemoving]        = useState(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)
  const [showAddPicker,   setShowAddPicker]   = useState(false)
  const [allAthletes,     setAllAthletes]     = useState([])
  const [addQ,            setAddQ]            = useState('')
  const [adding,          setAdding]          = useState(null)
  const cacheRef = useRef({})
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (!squad) return
    setShowAddPicker(false)
    setConfirmRemoveId(null)
    setAddQ('')
    if (cacheRef.current[squad.id]) {
      setAthletes(cacheRef.current[squad.id])
      return
    }
    setAthletes(null)
    api.get(`/squads/${squad.id}/athletes`)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : []
        cacheRef.current[squad.id] = list
        setAthletes(list)
      })
      .catch(() => setAthletes([]))
  }, [squad?.id])

  useEffect(() => {
    if (!showAddPicker || allAthletes.length > 0) return
    api.get('/athletes').then(r => setAllAthletes(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [showAddPicker])

  async function handleRemove(athlete) {
    setRemoving(athlete.id)
    try {
      await api.delete(`/squads/${squad.id}/athletes/${athlete.id}`)
      const updated = (athletes ?? []).filter(a => a.id !== athlete.id)
      cacheRef.current[squad.id] = updated
      setAthletes(updated)
      onAthleteCountChanged(squad.id, updated.length)
    } catch {
      Alert.alert('Error', 'Failed to remove athlete.')
    } finally {
      setRemoving(null)
      setConfirmRemoveId(null)
    }
  }

  async function handleAdd(athlete) {
    setAdding(athlete.id)
    try {
      await api.post(`/squads/${squad.id}/athletes`, { athlete_id: athlete.id })
      const updated = [...(athletes ?? []), { ...athlete, status: 'active' }]
      cacheRef.current[squad.id] = updated
      setAthletes(updated)
      onAthleteCountChanged(squad.id, updated.length)
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to add athlete.'
      Alert.alert('Cannot add athlete', msg)
    } finally { setAdding(null) }
  }

  const currentIds = new Set((athletes ?? []).map(a => a.id))
  const available  = allAthletes
    .filter(a => !currentIds.has(a.id) && a.is_active !== false)
    .filter(a => !addQ || athleteName(a).toLowerCase().includes(addQ.toLowerCase()))

  const count = athletes?.length ?? (squad?.athletes_count ?? 0)

  return (
    <Modal visible={!!squad} transparent statusBarTranslucent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[s.rosterSheet, { paddingBottom: insets.bottom || 16 }]}>
        {/* Header */}
        <View style={s.rosterHeader}>
          <View style={s.rosterHeaderLeft}>
            <View style={s.rosterHeaderIcon}>
              <Ionicons name="people" size={20} color="#fff" />
            </View>
            <View>
              <Text style={s.rosterTitle} numberOfLines={1}>{squad?.name}</Text>
              <Text style={s.rosterCount}>
                {athletes === null ? 'Loading…' : `${count} athlete${count !== 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>
          <View style={s.rosterHeaderRight}>
            {isAdmin && (
              <TouchableOpacity
                style={[s.addAthleteBtn, showAddPicker && s.addAthleteBtnCancel]}
                onPress={() => setShowAddPicker(v => !v)}
                activeOpacity={0.8}
              >
                <Ionicons name={showAddPicker ? 'close' : 'person-add-outline'} size={14} color={showAddPicker ? colors.textSecondary : '#fff'} />
                <Text style={[s.addAthleteBtnText, showAddPicker && { color: colors.textSecondary }]}>
                  {showAddPicker ? 'Cancel' : 'Add'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={s.rosterClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add athlete picker */}
        {showAddPicker && isAdmin && (
          <View style={s.addPicker}>
            <View style={s.addPickerSearch}>
              <Ionicons name="search-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={s.addPickerInput}
                value={addQ}
                onChangeText={setAddQ}
                placeholder="Search athletes…"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
            </View>
            {available.length === 0 ? (
              <Text style={s.addPickerEmpty}>
                {addQ ? 'No athletes found' : 'All athletes already in this squad'}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {available.map(a => {
                  const name = athleteName(a)
                  return (
                    <View key={a.id} style={s.addPickerRow}>
                      <Avatar url={a.avatar_url} name={name} size="sm" />
                      <View style={s.addPickerInfo}>
                        <Text style={s.addPickerName} numberOfLines={1}>{name}</Text>
                        {a.ftem_phase && (
                          <View style={[s.ftemChip, { backgroundColor: ftemBg(a.ftem_phase) }]}>
                            <Text style={[s.ftemChipText, { color: ftemFg(a.ftem_phase) }]}>{a.ftem_phase}</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[s.addBtn, adding === a.id && { opacity: 0.5 }]}
                        onPress={() => handleAdd(a)}
                        disabled={adding === a.id}
                        activeOpacity={0.8}
                      >
                        {adding === a.id
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <><Ionicons name="add" size={13} color="#fff" /><Text style={s.addBtnText}>Add</Text></>}
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Athlete list */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {athletes === null ? (
            <View style={s.rosterLoading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={s.rosterLoadingText}>Loading athletes…</Text>
            </View>
          ) : athletes.length === 0 ? (
            <View style={s.rosterEmpty}>
              <Ionicons name="people-outline" size={36} color="#cbd5e1" />
              <Text style={s.rosterEmptyTitle}>No athletes yet</Text>
              <Text style={s.rosterEmptySubtitle}>
                {isAdmin ? 'Use "Add" to assign athletes to this squad.' : 'Athletes will appear here once added by your coach.'}
              </Text>
            </View>
          ) : (
            athletes.map((a, idx) => {
              const name = athleteName(a)
              return (
                <View key={a.id} style={[s.athleteRow, idx < athletes.length - 1 && s.athleteRowBorder]}>
                  <Avatar url={a.avatar_url} name={name} size="md" />
                  <View style={s.athleteInfo}>
                    <View style={s.athleteNameRow}>
                      <Text style={s.athleteNameText} numberOfLines={1}>{name}</Text>
                      {a.ftem_phase && (
                        <View style={[s.ftemChip, { backgroundColor: ftemBg(a.ftem_phase) }]}>
                          <Text style={[s.ftemChipText, { color: ftemFg(a.ftem_phase) }]}>{a.ftem_phase}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.athleteSub}>
                      {sportEmoji(a.sport)} {a.sport ?? 'General'}{' '}
                      <Text style={{ color: a.status === 'active' || a.is_active ? colors.primary : colors.textMuted }}>
                        · {a.status === 'active' || a.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </Text>
                  </View>
                  {isAdmin && confirmRemoveId !== a.id && (
                    <TouchableOpacity
                      style={s.removeIconBtn}
                      onPress={() => setConfirmRemoveId(a.id)}
                      disabled={removing === a.id}
                      activeOpacity={0.7}
                    >
                      {removing === a.id
                        ? <ActivityIndicator size="small" color={colors.textMuted} />
                        : <Ionicons name="close" size={16} color="#cbd5e1" />}
                    </TouchableOpacity>
                  )}
                  {isAdmin && confirmRemoveId === a.id && (
                    <View style={s.removeConfirm}>
                      <Text style={s.removeConfirmText}>Remove {a.first_name ?? name}?</Text>
                      <TouchableOpacity style={s.removeNo} onPress={() => setConfirmRemoveId(null)} activeOpacity={0.8}>
                        <Text style={s.removeNoText}>No</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.removeYes, removing === a.id && { opacity: 0.5 }]}
                        onPress={() => handleRemove(a)}
                        disabled={removing === a.id}
                        activeOpacity={0.8}
                      >
                        <Text style={s.removeYesText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SquadsScreen() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'club_admin' || user?.role === 'coach'
  const insets = useSafeAreaInsets()

  const [squads,       setSquads]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [selectedSquad, setSelectedSquad] = useState(null)
  const [editSquad,    setEditSquad]    = useState(null) // null=closed, false=new, obj=edit
  const [upgrade,      setUpgrade]      = useState(null)

  async function fetchSquads() {
    try {
      const { data } = await api.get('/squads')
      setSquads(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchSquads() }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchSquads()
  }, [])

  function handleSaved(squad) {
    setSquads(prev => {
      const idx = prev.findIndex(s => s.id === squad.id)
      if (idx >= 0) return prev.map(s => s.id === squad.id ? squad : s)
      return [...prev, squad]
    })
  }

  function handleDeleted(id) {
    Alert.alert(
      'Delete squad',
      `"${squads.find(s => s.id === id)?.name}" will be permanently removed. Athletes won't be deleted — just unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/squads/${id}`)
              setSquads(prev => prev.filter(s => s.id !== id))
              if (selectedSquad?.id === id) setSelectedSquad(null)
            } catch {
              Alert.alert('Error', 'Failed to delete squad.')
            }
          },
        },
      ],
    )
  }

  function handleAthleteCountChanged(squadId, newCount) {
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, athletes_count: newCount } : s))
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <FlatList
        data={squads}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <Text style={s.subtitle}>
              {squads.length} squad{squads.length !== 1 ? 's' : ''}
            </Text>
            {isAdmin && <PendingSection onApproved={fetchSquads} />}
          </View>
        }
        renderItem={({ item }) => (
          <SquadCard
            squad={item}
            isAdmin={isAdmin}
            onPress={() => setSelectedSquad(item)}
            onEdit={() => setEditSquad(item)}
            onDelete={() => handleDeleted(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="layers-outline" size={36} color="#94a3b8" />
            </View>
            <Text style={s.emptyTitle}>No squads yet</Text>
            <Text style={s.emptySubtitle}>Create squads to organise your athletes into training groups.</Text>
            {isAdmin && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => setEditSquad(false)} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.emptyBtnText}>Create first squad</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* FAB */}
      {isAdmin && (
        <TouchableOpacity style={s.fab} onPress={() => setEditSquad(false)} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Roster sheet */}
      <RosterSheet
        squad={selectedSquad}
        isAdmin={isAdmin}
        onClose={() => setSelectedSquad(null)}
        onAthleteCountChanged={handleAthleteCountChanged}
      />

      {/* Create / edit modal */}
      {editSquad !== null && (
        <SquadModal
          squad={editSquad || null}
          onClose={() => setEditSquad(null)}
          onSaved={handleSaved}
          onUpgrade={up => { setEditSquad(null); setUpgrade(up) }}
        />
      )}
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
  safe:    { flex: 1, backgroundColor: colors.background },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md, paddingBottom: 100 },

  subtitle: { fontSize: font.sm, color: colors.textSecondary, marginBottom: spacing.sm },

  // Pending section
  pendingSection: {
    backgroundColor: '#fffbeb', borderRadius: radius.lg, borderWidth: 1.5, borderColor: '#fde68a',
    overflow: 'hidden', marginBottom: spacing.md,
  },
  pendingHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: '#fef3c7', borderBottomWidth: 1, borderBottomColor: '#fde68a',
  },
  pendingHeaderText: { fontSize: font.sm, fontWeight: '700', color: '#92400e' },
  pendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#fef3c7',
  },
  pendingInfo:    { flex: 1, minWidth: 0 },
  pendingName:    { fontSize: font.sm, fontWeight: '700', color: colors.text },
  pendingDetail:  { fontSize: font.xs, color: colors.textSecondary, marginTop: 1 },
  pendingActions: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  pendingApprove: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6, minHeight: 36,
  },
  pendingApproveText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  pendingDecline: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff', minHeight: 36,
    justifyContent: 'center',
  },
  pendingDeclineText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  // Squad card
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderLight,
    padding: 14, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon:    { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardMeta:    { flex: 1, minWidth: 0 },
  cardName:    { fontSize: font.base, fontWeight: '700', color: colors.text },
  cardDesc:    { fontSize: font.sm, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  cardBtns:    { flexDirection: 'row', gap: 2, flexShrink: 0 },
  cardIconBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  countChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  countChipText: { fontSize: font.xs, fontWeight: '700', color: colors.textSecondary },
  viewRoster:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewRosterText: { fontSize: font.xs, fontWeight: '600', color: colors.textMuted },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: spacing.lg, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed' },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: font.lg, fontWeight: '700', color: colors.textSecondary },
  emptySubtitle: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },

  // FAB
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },

  // Modal
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: font.lg, fontWeight: '900', color: colors.text },
  modalClose: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: colors.background },
  modalBody:  { padding: spacing.md, paddingBottom: spacing.xl },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  footerCancel: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  footerCancelText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },
  footerSave: { flex: 1, height: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: radius.lg, backgroundColor: colors.primary },
  footerSaveText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },

  label:         { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  labelRequired: { color: colors.error },
  labelOptional: { fontWeight: '400', color: colors.textMuted },
  input: { backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: font.sm, color: colors.text, minHeight: 44 },
  textarea: { minHeight: 80, paddingTop: 10 },

  // Roster sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  rosterSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  rosterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#ecfdf5', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomWidth: 1, borderBottomColor: '#d1fae5' },
  rosterHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  rosterHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rosterTitle: { fontSize: font.base, fontWeight: '900', color: colors.text },
  rosterCount: { fontSize: font.xs, color: colors.textSecondary, marginTop: 1 },
  rosterHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addAthleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 7 },
  addAthleteBtnCancel: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  addAthleteBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  rosterClose: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: colors.background },

  // Add picker
  addPicker: { borderBottomWidth: 1, borderBottomColor: colors.borderLight, padding: spacing.md, backgroundColor: '#f8fafc' },
  addPickerSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, height: 40, marginBottom: spacing.sm },
  addPickerInput: { flex: 1, fontSize: font.sm, color: colors.text },
  addPickerEmpty: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  addPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderLight, padding: 10, marginBottom: 6 },
  addPickerInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addPickerName: { fontSize: font.sm, fontWeight: '600', color: colors.text, flexShrink: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Athlete rows
  athleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12 },
  athleteRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  athleteInfo: { flex: 1, minWidth: 0 },
  athleteNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  athleteNameText: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  athleteSub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  ftemChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ftemChipText: { fontSize: 10, fontWeight: '700' },
  removeIconBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  removeConfirm: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: radius.md, borderWidth: 1, borderColor: '#fecaca', paddingHorizontal: 10, paddingVertical: 7, marginTop: 6 },
  removeConfirmText: { flex: 1, fontSize: font.xs, fontWeight: '600', color: '#b91c1c' },
  removeNo: { height: 30, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  removeNoText: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  removeYes: { height: 30, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: '#ef4444', borderRadius: 8 },
  removeYesText: { fontSize: font.xs, fontWeight: '700', color: '#fff' },

  rosterLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  rosterLoadingText: { fontSize: font.sm, color: colors.textMuted },
  rosterEmpty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: spacing.lg },
  rosterEmptyTitle: { fontSize: font.base, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.sm },
  rosterEmptySubtitle: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
})
