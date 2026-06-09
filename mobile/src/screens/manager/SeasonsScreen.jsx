import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Avatar from '../../components/Avatar'
import UpgradeSheet, { parseUpgradeError } from '../../components/UpgradeSheet'

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:  { label: 'Draft',  color: colors.textMuted,   bg: '#f1f5f9' },
  open:   { label: 'Open',   color: colors.primaryDark, bg: colors.primaryLight },
  closed: { label: 'Closed', color: colors.textMuted,   bg: '#f1f5f9' },
}

const REG_STATUS = {
  invited:          { label: 'Invited',       color: '#1d4ed8', bg: '#dbeafe' },
  manual_pending:   { label: 'Pay at club',   color: '#92400e', bg: '#fef3c7' },
  paid:             { label: 'Paid',          color: '#065f46', bg: '#d1fae5' },
  manual_confirmed: { label: 'Paid (manual)', color: '#065f46', bg: '#d1fae5' },
  rejected:         { label: 'Rejected',      color: '#991b1b', bg: '#fee2e2' },
}

const STATUS_OPTIONS = [
  { value: 'draft',  label: 'Draft — not visible to athletes' },
  { value: 'open',   label: 'Open — athletes can be invited' },
  { value: 'closed', label: 'Closed — registration complete' },
]

function fmtMoney(cents) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`
}

function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateShort(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
}

function toISODate(date) {
  return date.toISOString().split('T')[0]
}

// ── Dropdown picker (reused pattern) ──────────────────────────────────────────
function DropdownPicker({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)
  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.dropdownBtnText} numberOfLines={1}>{selected?.label ?? 'Select…'}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sheetItem, opt.value === value && styles.sheetItemSelected]}
              onPress={() => { onChange(opt.value); setOpen(false) }}
            >
              <Text style={[styles.sheetItemText, opt.value === value && styles.sheetItemTextSelected]}>
                {opt.label}
              </Text>
              {opt.value === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
          <View style={{ height: spacing.lg }} />
        </View>
      </Modal>
    </>
  )
}

// ── Date field with native picker ──────────────────────────────────────────────
function DateField({ label, value, onChange }) {
  const [show, setShow] = useState(false)
  const date = value ? new Date(value) : new Date()

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
        <Text style={[styles.dateBtnText, !value && { color: colors.textMuted }]}>
          {value ? fmtDate(value) : 'Set date'}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, selected) => {
            setShow(Platform.OS === 'ios')
            if (selected) onChange(toISODate(selected))
            if (Platform.OS !== 'ios') setShow(false)
          }}
        />
      )}
    </View>
  )
}

// ── Season form modal ──────────────────────────────────────────────────────────
function SeasonModal({ season, onSave, onClose, onUpgrade }) {
  const [form, setForm] = useState({
    name:                  season?.name                  ?? '',
    description:           season?.description           ?? '',
    start_date:            season?.start_date            ?? '',
    end_date:              season?.end_date              ?? '',
    registration_deadline: season?.registration_deadline ?? '',
    fee:                   season ? (season.fee_cents / 100).toFixed(2) : '',
    status:                season?.status                ?? 'draft',
  })
  const [saving, setSaving] = useState(false)
  const isEditing = !!season

  async function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Season name is required.')
      return
    }
    setSaving(true)
    try {
      const { fee, ...rest } = form
      const payload = { ...rest, fee_cents: Math.round(parseFloat(fee || 0) * 100) }
      if (isEditing) {
        await api.put(`/seasons/${season.id}`, payload)
      } else {
        await api.post('/seasons', payload)
      }
      onSave()
    } catch (e) {
      const up = parseUpgradeError(e)
      if (up) { onUpgrade?.(up); return }
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save season.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Season' : 'New Season'}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <Text style={styles.fieldLabel}>Season name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
              placeholder="e.g. Winter 2025, Season 1"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              placeholder="Optional notes about this season"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.row2}>
              <DateField label="Start date" value={form.start_date} onChange={v => setForm(p => ({ ...p, start_date: v }))} />
              <DateField label="End date" value={form.end_date} onChange={v => setForm(p => ({ ...p, end_date: v }))} />
            </View>

            <View style={styles.row2}>
              <DateField label="Reg. deadline" value={form.registration_deadline} onChange={v => setForm(p => ({ ...p, registration_deadline: v }))} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Fee (AUD $)</Text>
                <TextInput
                  style={styles.input}
                  value={form.fee}
                  onChangeText={v => setForm(p => ({ ...p, fee: v }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Status</Text>
            <DropdownPicker
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={v => setForm(p => ({ ...p, status: v }))}
            />

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.primaryBtnText}>{isEditing ? 'Save changes' : 'Create season'}</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Season detail ──────────────────────────────────────────────────────────────
function SeasonDetail({ seasonId, athletes, onBack }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [sending, setSending]   = useState(false)
  const [acting, setActing]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/seasons/${seasonId}`)
      setData(r.data)
    } catch {
      Alert.alert('Error', 'Failed to load season.')
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  useEffect(() => { load() }, [load])

  if (loading || !data) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
  }

  const { season, registrations } = data
  const registeredIds = new Set(registrations.map(r => r.athlete_id))
  const eligible = athletes.filter(a => a.user_id && !registeredIds.has(a.id))
  const paidCount = registrations.filter(r => r.status === 'paid' || r.status === 'manual_confirmed').length
  const sc = STATUS_CONFIG[season.status] ?? STATUS_CONFIG.draft

  function toggleSelect(id) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  async function sendInvites() {
    setSending(true)
    try {
      const res = await api.post(`/seasons/${seasonId}/invite`, { athlete_ids: selected })
      Alert.alert('Sent', `${res.data.invited} invitation${res.data.invited !== 1 ? 's' : ''} sent.`)
      setSelected([])
      load()
    } catch {
      Alert.alert('Error', 'Failed to send invites.')
    } finally {
      setSending(false)
    }
  }

  async function markPaid(regId) {
    setActing(regId)
    try {
      await api.put(`/registrations/${regId}/mark-paid`)
      load()
    } catch {
      Alert.alert('Error', 'Failed to mark as paid.')
    } finally {
      setActing(null) }
  }

  async function removeReg(regId) {
    Alert.alert('Remove', 'Remove this registration?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        setActing(regId + 'd')
        try { await api.delete(`/registrations/${regId}`); load() }
        catch { Alert.alert('Error', 'Failed to remove.') }
        finally { setActing(null) }
      }},
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>

      {/* Back + title */}
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={styles.backBtnText}>Seasons</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.detailTitleRow}>
        <Text style={styles.detailTitle}>{season.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#2563eb' }]}>{registrations.length}</Text>
          <Text style={styles.statLabel}>Registrations</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{paidCount}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.text }]}>{fmtMoney(season.fee_cents)}</Text>
          <Text style={styles.statLabel}>Fee / athlete</Text>
        </View>
      </View>

      {/* Invite section */}
      {eligible.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionCardTitle}>Send registration request</Text>
              <Text style={styles.sectionCardSubtitle}>Select athletes to invite to this season</Text>
            </View>
            {selected.length > 0 && (
              <TouchableOpacity
                style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                onPress={sendInvites}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <Ionicons name="send-outline" size={13} color="#fff" />
                      <Text style={styles.sendBtnText}>Send to {selected.length}</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>

          {eligible.map(a => {
            const isSelected = selected.includes(a.id)
            const name = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.athleteRow, isSelected && styles.athleteRowSelected]}
                onPress={() => toggleSelect(a.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.athleteCheck, isSelected && styles.athleteCheckActive]}>
                  {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Avatar name={name} size="sm" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.athleteName}>{name}</Text>
                  {a.squad_names || a.ftem_phase
                    ? <Text style={styles.athleteMeta}>{a.squad_names || a.ftem_phase}</Text>
                    : null}
                </View>
              </TouchableOpacity>
            )
          })}

          {selected.length > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionBarText}>
                {selected.length} selected · {fmtMoney(selected.length * season.fee_cents)} total
              </Text>
              <TouchableOpacity onPress={() => setSelected([])}>
                <Text style={styles.selectionBarClear}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Registrations list */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionCardTitle}>Registrations ({registrations.length})</Text>
        </View>
        {registrations.length === 0 ? (
          <Text style={styles.emptyText}>No registrations yet. Select athletes above to send payment requests.</Text>
        ) : (
          registrations.map(r => {
            const s = REG_STATUS[r.status] ?? { label: r.status, color: colors.textMuted, bg: '#f1f5f9' }
            const canMarkPaid = ['invited', 'manual_pending'].includes(r.status)
            const canRemove   = !['paid', 'manual_confirmed'].includes(r.status)
            return (
              <View key={r.id} style={styles.regRow}>
                <View style={styles.regInfo}>
                  <View style={styles.regTopRow}>
                    <Text style={styles.regName}>{r.athlete_name}</Text>
                    <View style={[styles.regStatusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.regStatusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                  {r.email ? <Text style={styles.regEmail}>{r.email}</Text> : null}
                  {r.paid_at ? <Text style={styles.regPaidAt}>Paid {fmtDate(r.paid_at)}</Text> : null}
                  {(canMarkPaid || canRemove) && (
                    <View style={styles.regActions}>
                      {canMarkPaid && (
                        <TouchableOpacity
                          style={styles.markPaidBtn}
                          onPress={() => markPaid(r.id)}
                          disabled={acting === r.id}
                        >
                          {acting === r.id
                            ? <ActivityIndicator size="small" color={colors.primary} />
                            : <>
                                <Ionicons name="cash-outline" size={13} color={colors.primary} />
                                <Text style={styles.markPaidText}>Mark paid</Text>
                              </>
                          }
                        </TouchableOpacity>
                      )}
                      {canRemove && (
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeReg(r.id)}
                          disabled={acting === r.id + 'd'}
                        >
                          {acting === r.id + 'd'
                            ? <ActivityIndicator size="small" color={colors.error} />
                            : <>
                                <Ionicons name="trash-outline" size={13} color={colors.error} />
                                <Text style={styles.removeBtnText}>Remove</Text>
                              </>
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )
          })
        )}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function SeasonsScreen() {
  const [seasons, setSeasons]     = useState([])
  const [athletes, setAthletes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [upgrade, setUpgrade]     = useState(null)
  const [detail, setDetail]       = useState(null)

  async function load() {
    try {
      const [s, a] = await Promise.all([api.get('/seasons'), api.get('/athletes')])
      setSeasons(Array.isArray(s.data) ? s.data : [])
      setAthletes(Array.isArray(a.data) ? a.data : a.data?.data ?? [])
    } catch {
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  const onRefresh = useCallback(() => { setRefreshing(true); load() }, [])

  async function handleDelete(id) {
    Alert.alert('Delete season', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/seasons/${id}`)
          setSeasons(p => p.filter(s => s.id !== id))
        } catch {
          Alert.alert('Error', 'Failed to delete season.')
        }
      }},
    ])
  }

  if (detail !== null) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <SeasonDetail
          seasonId={detail}
          athletes={athletes}
          onBack={() => { setDetail(null); load() }}
        />
      </SafeAreaView>
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar-outline" size={20} color="#7c3aed" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Seasons</Text>
          <Text style={styles.headerSubtitle}>Manage seasons and registration payments</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => { setEditing(null); setShowModal(true) }}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.newBtnText}>New season</Text>
        </TouchableOpacity>
      </View>

      {seasons.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No seasons yet</Text>
          <Text style={styles.emptySubtitle}>Create a season to start collecting registration payments.</Text>
          <TouchableOpacity style={[styles.newBtn, { marginTop: spacing.md }]} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.newBtnText}>Create season</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={seasons}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setDetail(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                      </View>
                    </View>
                    <View style={styles.cardMeta}>
                      <View style={styles.cardMetaItem}>
                        <Ionicons name="cash-outline" size={13} color={colors.textMuted} />
                        <Text style={styles.cardMetaText}>{fmtMoney(item.fee_cents)} / athlete</Text>
                      </View>
                      {item.start_date && (
                        <View style={styles.cardMetaItem}>
                          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                          <Text style={styles.cardMetaText}>
                            {fmtDateShort(item.start_date)}{item.end_date ? ` – ${fmtDateShort(item.end_date)}` : ''}
                          </Text>
                        </View>
                      )}
                      <View style={styles.cardMetaItem}>
                        <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                        <Text style={styles.cardMetaText}>
                          {item.registrations_count ?? 0} registered · {item.paid_count ?? 0} paid
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => { setEditing(item); setShowModal(true) }}
                      hitSlop={8}
                    >
                      <Ionicons name="pencil-outline" size={15} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleDelete(item.id)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.error} />
                    </TouchableOpacity>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}

      {showModal && (
        <SeasonModal
          season={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={() => { setShowModal(false); setEditing(null); load() }}
          onUpgrade={up => { setShowModal(false); setUpgrade(up) }}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: font.lg, fontWeight: '900', color: colors.text },
  headerSubtitle: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },

  listContent: { padding: spacing.md, paddingTop: 4, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  cardTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, flexShrink: 1 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: font.xs, fontWeight: '700' },
  cardMeta: { flexDirection: 'column', gap: 4 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontSize: font.xs, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardActionBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
  },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: font.base, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  emptySubtitle: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', marginTop: 6 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: font.lg, fontWeight: '900', color: colors.text },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { padding: spacing.md },
  modalFooter: {
    flexDirection: 'row', gap: 12, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },

  fieldLabel: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: font.base, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: spacing.sm },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  dateBtnText: { flex: 1, fontSize: font.base, color: colors.text },

  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  dropdownBtnText: { flex: 1, fontSize: font.base, color: colors.text, marginRight: 8 },

  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 20,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 12,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
  },
  sheetItemSelected: { backgroundColor: colors.primaryLight },
  sheetItemText: { fontSize: font.base, color: colors.text, flex: 1, marginRight: 8 },
  sheetItemTextSelected: { color: colors.primary, fontWeight: '700' },

  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.base },
  primaryBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },

  // Detail
  detailContent: { padding: spacing.md },
  detailHeader: { marginBottom: spacing.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: font.sm, color: colors.primary, fontWeight: '600' },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: spacing.md },
  detailTitle: { fontSize: font.xl, fontWeight: '900', color: colors.text, flexShrink: 1 },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.sm + 4,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statValue: { fontSize: font.xl, fontWeight: '900' },
  statLabel: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },

  sectionCard: {
    backgroundColor: colors.surface, borderRadius: 16, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  sectionCardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8,
  },
  sectionCardTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  sectionCardSubtitle: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: font.xs },

  athleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  athleteRowSelected: { backgroundColor: colors.primaryLight },
  athleteCheck: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 2,
    borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  athleteCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  athleteName: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  athleteMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },

  selectionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.sm + 4, backgroundColor: colors.primaryLight,
    borderTopWidth: 1, borderTopColor: colors.primary,
  },
  selectionBarText: { fontSize: font.sm, fontWeight: '600', color: colors.primaryDark },
  selectionBarClear: { fontSize: font.sm, color: colors.primaryDark, fontWeight: '600', textDecorationLine: 'underline' },

  emptyText: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', padding: spacing.lg },

  regRow: {
    paddingVertical: 12, paddingHorizontal: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  regInfo: { flex: 1 },
  regTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  regName: { fontSize: font.sm, fontWeight: '700', color: colors.text, flex: 1 },
  regStatusBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  regStatusText: { fontSize: font.xs, fontWeight: '700' },
  regEmail: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  regPaidAt: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },
  regActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  markPaidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  markPaidText: { fontSize: font.xs, fontWeight: '700', color: colors.primary },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  removeBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.error },
})
