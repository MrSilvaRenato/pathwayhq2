import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Linking,
  Modal, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import Avatar from '../../components/Avatar'

// ── helpers ───────────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null
  const d   = new Date(dob)
  const now = new Date()
  let age   = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

function fmtDate(dt) {
  return new Date(dt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function sportLabel(value) {
  return SPORTS.find(s => s.value === value)?.label ?? value ?? '—'
}

function initials(a) {
  return `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}

const PHASE_OPTIONS = Object.entries(FTEM_PHASES).map(([value, meta]) => ({
  value,
  label: `${value} — ${meta.label}`,
}))

// ── dropdown sheet ────────────────────────────────────────────────────────────
function DropdownSheet({ visible, title, options, value, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ds.backdrop} onPress={onClose}>
        <Pressable style={ds.sheet} onPress={e => e.stopPropagation()}>
          <View style={ds.handle} />
          {title ? <Text style={ds.title}>{title}</Text> : null}
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
            <View style={{ height: 20 }} />
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
  title: { fontSize: font.sm, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.md, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optionText: { flex: 1, fontSize: font.sm, color: colors.textSecondary },
  optionActive: { color: colors.primary, fontWeight: '700' },
})

// ── main screen ───────────────────────────────────────────────────────────────
export default function AthleteDetailScreen({ route }) {
  const { athlete: initial } = route.params ?? {}
  const { isAdmin } = useAuth()
  const navigation  = useNavigation()

  const [athlete,    setAthlete]    = useState(initial ?? {})
  const [milestones, setMilestones] = useState([])
  const [loadingMs,  setLoadingMs]  = useState(true)
  const [editing,    setEditing]    = useState(false)
  const [form,       setForm]       = useState({})
  const [saving,     setSaving]     = useState(false)
  const [phaseSheet, setPhaseSheet] = useState(false)
  const [statusSheet, setStatusSheet] = useState(false)

  const id = athlete?.id

  useEffect(() => {
    if (!id) return
    api.get(`/athletes/${id}`)
      .then(r => { setAthlete(r.data); setForm(buildForm(r.data)) })
      .catch(() => {})
    api.get(`/milestones/athlete/${id}`)
      .then(r => setMilestones(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoadingMs(false))
  }, [id])

  function buildForm(a) {
    return {
      first_name: a.first_name ?? '',
      last_name:  a.last_name  ?? '',
      ftem_phase: a.ftem_phase ?? '',
      is_active:  a.is_active  !== false,
      phone:      a.contact_phone ?? a.phone ?? '',
      notes:      a.notes ?? '',
    }
  }

  function startEdit() {
    setForm(buildForm(athlete))
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data } = await api.put(`/athletes/${id}`, form)
      setAthlete(data ?? { ...athlete, ...form })
      setEditing(false)
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Delete athlete',
      'This cannot be undone. The athlete and all their data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/athletes/${id}`)
            navigation.goBack()
          } catch {
            Alert.alert('Error', 'Failed to delete athlete.')
          }
        }},
      ]
    )
  }

  const a        = athlete
  const name     = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || a.name || '—'
  const age      = calcAge(a.dob)
  const phaseMeta = FTEM_PHASES[a.ftem_phase]
  const squads   = a.squad_names?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  const phone    = a.contact_phone ?? a.phone
  const email    = a.contact_email ?? a.email

  const STATUS_OPTIONS = [
    { value: 'active',   label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Profile card ── */}
        <View style={s.card}>
          {editing ? (
            /* ── Edit mode ── */
            <View style={s.editWrap}>
              <View style={s.row2}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>First name</Text>
                  <TextInput
                    style={s.input}
                    value={form.first_name}
                    onChangeText={v => setForm(p => ({ ...p, first_name: v }))}
                    placeholder="First name"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="words"
                  />
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Last name</Text>
                  <TextInput
                    style={s.input}
                    value={form.last_name}
                    onChangeText={v => setForm(p => ({ ...p, last_name: v }))}
                    placeholder="Last name"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={s.row2}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>FTEM phase</Text>
                  <TouchableOpacity style={s.dropBtn} onPress={() => setPhaseSheet(true)}>
                    <Text style={[s.dropBtnText, !form.ftem_phase && { color: colors.textMuted }]}>
                      {form.ftem_phase ? `${form.ftem_phase} — ${FTEM_PHASES[form.ftem_phase]?.label ?? ''}` : 'Select phase…'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Status</Text>
                  <TouchableOpacity style={s.dropBtn} onPress={() => setStatusSheet(true)}>
                    <Text style={s.dropBtnText}>{form.is_active ? 'Active' : 'Inactive'}</Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>Contact phone</Text>
                <View style={s.inputIconWrap}>
                  <Ionicons name="call-outline" size={15} color={colors.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, s.inputWithIcon]}
                    value={form.phone}
                    onChangeText={v => setForm(p => ({ ...p, phone: v }))}
                    placeholder="+61 4xx xxx xxx"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>Notes</Text>
                <TextInput
                  style={[s.input, s.textarea]}
                  value={form.notes}
                  onChangeText={v => setForm(p => ({ ...p, notes: v }))}
                  placeholder="Internal notes…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={s.editActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Ionicons name="checkmark" size={15} color="#fff" />
                        <Text style={s.saveBtnText}>Save</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── View mode ── */
            <>
              {/* Avatar + name + badges */}
              <View style={s.heroWrap}>
                <Avatar name={name} url={a.avatar_url} size="xl" />
                <Text style={s.athleteName}>{name}</Text>

                <View style={s.badgeRow}>
                  {phaseMeta ? (
                    <View style={[s.phaseBadge, { backgroundColor: phaseMeta.bgColor ?? '#f1f5f9' }]}>
                      <Text style={[s.phaseBadgeText, { color: phaseMeta.textColor ?? '#334155' }]}>
                        {a.ftem_phase} · {phaseMeta.label}
                      </Text>
                    </View>
                  ) : null}
                  <View style={[s.statusBadge, a.is_active !== false ? s.statusActive : s.statusInactive]}>
                    <Text style={[s.statusText, a.is_active !== false ? s.statusTextActive : s.statusTextInactive]}>
                      {a.is_active !== false ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Chips (no horizontal scroll — wrapped) */}
              <View style={s.chipWrap}>
                {a.sport ? (
                  <View style={s.chip}>
                    <Text style={s.chipText}>{sportLabel(a.sport)}</Text>
                  </View>
                ) : null}
                {age !== null ? (
                  <View style={s.chip}>
                    <Text style={s.chipText}>Age {age}</Text>
                  </View>
                ) : null}
                {a.gender ? (
                  <View style={s.chip}>
                    <Text style={s.chipText}>{a.gender.charAt(0).toUpperCase() + a.gender.slice(1)}</Text>
                  </View>
                ) : null}
                {squads.map(sq => (
                  <View key={sq} style={[s.chip, s.chipGreen]}>
                    <Text style={[s.chipText, s.chipTextGreen]}>{sq}</Text>
                  </View>
                ))}
              </View>

              {/* Contact buttons */}
              {(phone || email) ? (
                <View style={s.contactRow}>
                  {phone ? (
                    <TouchableOpacity
                      style={s.contactBtn}
                      onPress={() => Linking.openURL(`tel:${phone}`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call-outline" size={16} color="#fff" />
                      <Text style={s.contactBtnText} numberOfLines={1}>{phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {email ? (
                    <TouchableOpacity
                      style={[s.contactBtn, s.contactBtnBlue]}
                      onPress={() => Linking.openURL(`mailto:${email}`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="mail-outline" size={16} color="#fff" />
                      <Text style={s.contactBtnText} numberOfLines={1}>{email}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {/* Notes */}
              {a.notes ? (
                <View style={s.notesBox}>
                  <Text style={s.notesLabel}>NOTES</Text>
                  <Text style={s.notesText}>{a.notes}</Text>
                </View>
              ) : null}

              {/* Admin actions */}
              {isAdmin ? (
                <View style={s.adminActions}>
                  <TouchableOpacity style={s.editBtn} onPress={startEdit} activeOpacity={0.8}>
                    <Ionicons name="create-outline" size={15} color="#fff" />
                    <Text style={s.editBtnText}>Edit athlete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}
        </View>

        {/* ── Milestones timeline ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>
            <Ionicons name="trophy-outline" size={14} color="#f59e0b" /> Milestones
          </Text>

          {loadingMs ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : milestones.length === 0 ? (
            <Text style={s.emptyText}>No milestones recorded yet.</Text>
          ) : (
            <View style={s.timeline}>
              {/* Vertical line */}
              <View style={s.timelineLine} />
              {milestones.map((m, i) => {
                const meta = FTEM_PHASES[m.ftem_phase]
                return (
                  <View key={m.id ?? i} style={s.timelineItem}>
                    <View style={s.timelineDot} />
                    <View style={s.milestoneCard}>
                      <View style={s.milestoneHeader}>
                        <Text style={s.milestoneTitle} numberOfLines={2}>{m.title}</Text>
                        {m.ftem_phase ? (
                          <View style={[s.mPhaseBadge, { backgroundColor: meta?.bgColor ?? '#f1f5f9' }]}>
                            <Text style={[s.mPhaseText, { color: meta?.textColor ?? '#334155' }]}>{m.ftem_phase}</Text>
                          </View>
                        ) : null}
                      </View>
                      {m.description ? <Text style={s.milestoneDesc}>{m.description}</Text> : null}
                      <Text style={s.milestoneDate}>{fmtDate(m.achieved_at ?? m.date)}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <DropdownSheet
        visible={phaseSheet}
        title="Select FTEM phase"
        options={PHASE_OPTIONS}
        value={form.ftem_phase}
        onSelect={v => setForm(p => ({ ...p, ftem_phase: v }))}
        onClose={() => setPhaseSheet(false)}
      />

      <DropdownSheet
        visible={statusSheet}
        title="Set status"
        options={STATUS_OPTIONS}
        value={form.is_active ? 'active' : 'inactive'}
        onSelect={v => setForm(p => ({ ...p, is_active: v === 'active' }))}
        onClose={() => setStatusSheet(false)}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },

  card: {
    backgroundColor: '#fff', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  // View mode — hero
  heroWrap:  { alignItems: 'center', paddingVertical: spacing.md, gap: 10 },
  athleteName: { fontSize: font.xxl, fontWeight: '800', color: colors.text, textAlign: 'center' },

  badgeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  phaseBadge: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  phaseBadgeText: { fontSize: font.xs, fontWeight: '700' },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  statusActive: { backgroundColor: '#d1fae5' },
  statusInactive: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: font.xs, fontWeight: '700' },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#64748b' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip:     { borderRadius: radius.md, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 7 },
  chipGreen:{ backgroundColor: '#ecfdf5' },
  chipText: { fontSize: font.sm, color: '#475569', fontWeight: '500' },
  chipTextGreen: { color: '#059669' },

  contactRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 13, paddingHorizontal: 12,
  },
  contactBtnBlue: { backgroundColor: '#3b82f6' },
  contactBtnText: { color: '#fff', fontSize: font.sm, fontWeight: '700', flex: 1 },

  notesBox: { backgroundColor: '#f8fafc', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  notesLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  notesText:  { fontSize: font.sm, color: colors.textSecondary, lineHeight: 20 },

  adminActions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14,
  },
  editBtnText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },
  deleteBtn: {
    width: 48, height: 48, borderRadius: radius.md,
    borderWidth: 1, borderColor: '#fecaca',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff5f5',
  },

  // Edit mode
  editWrap: { gap: 12 },
  row2:     { flexDirection: 'row', gap: 10 },
  halfField:{ flex: 1 },
  field:    { },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: font.base, color: colors.text, backgroundColor: '#fafafa',
  },
  inputIconWrap: { position: 'relative' },
  inputIcon:     { position: 'absolute', left: 12, top: 13, zIndex: 1 },
  inputWithIcon: { paddingLeft: 36 },
  textarea:      { minHeight: 80, textAlignVertical: 'top' },

  dropBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#fafafa',
  },
  dropBtnText: { flex: 1, fontSize: font.sm, color: colors.text, marginRight: 4 },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },
  saveBtn: {
    flex: 1, flexDirection: 'row', gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },

  // Milestones
  sectionTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  emptyText: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },

  timeline: { paddingLeft: 24 },
  timelineLine: {
    position: 'absolute', left: spacing.md + 11, top: spacing.md, bottom: spacing.md,
    width: 2, backgroundColor: '#fde68a',
  },
  timelineItem: { flexDirection: 'row', marginBottom: 14 },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#f59e0b', borderWidth: 2, borderColor: '#fff',
    marginLeft: -36, marginRight: 14, marginTop: 16,
    shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 2,
  },
  milestoneCard: {
    flex: 1, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: radius.md, padding: 12,
  },
  milestoneHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  milestoneTitle: { flex: 1, fontSize: font.sm, fontWeight: '600', color: '#1e293b', lineHeight: 19 },
  mPhaseBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  mPhaseText:  { fontSize: 10, fontWeight: '700' },
  milestoneDesc: { fontSize: font.xs, color: '#64748b', lineHeight: 18, marginBottom: 4 },
  milestoneDate: { fontSize: 10, color: colors.textMuted },
})
