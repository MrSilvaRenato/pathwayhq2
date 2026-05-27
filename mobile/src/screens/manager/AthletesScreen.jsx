import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, Alert, ScrollView,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import Avatar from '../../components/Avatar'

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(a) {
  return `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

function fmtDate(d) {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ftemBg(phase) { return FTEM_PHASES[phase]?.bgColor ?? '#f1f5f9' }
function ftemFg(phase) { return FTEM_PHASES[phase]?.textColor ?? '#475569' }

// ── Athlete Card ──────────────────────────────────────────────────────────────

function AthleteCard({ a, isAdmin, onPress, onDelete }) {
  const sport = SPORTS.find(s => s.value === a.sport)
  const age   = calcAge(a.dob)
  const name  = a.name ?? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      {/* Header row */}
      <View style={s.cardHeader}>
        <Avatar url={a.avatar_url} name={name} size="md" />
        <View style={s.cardMeta}>
          <View style={s.cardNameRow}>
            <Text style={s.cardName} numberOfLines={1}>{name}</Text>
            {a.invite_status === 'pending' && (
              <View style={s.pendingBadge}>
                <Text style={s.pendingBadgeText}>Pending invite</Text>
              </View>
            )}
          </View>
          <View style={[s.ftemBadge, { backgroundColor: ftemBg(a.ftem_phase) }]}>
            <Text style={[s.ftemBadgeText, { color: ftemFg(a.ftem_phase) }]}>
              {a.ftem_phase} · {FTEM_PHASES[a.ftem_phase]?.label ?? a.ftem_phase}
            </Text>
          </View>
        </View>
      </View>

      {/* Chips row */}
      <View style={s.chipsRow}>
        {sport && (
          <View style={s.chip}>
            <Text style={s.chipText}>{sport.emoji} {sport.label}</Text>
          </View>
        )}
        {!!a.squad_names && (
          <View style={s.chip}>
            <Text style={s.chipText}>{a.squad_names}</Text>
          </View>
        )}
        {age !== null && (
          <View style={s.chip}>
            <Text style={s.chipText}>{age} yrs</Text>
          </View>
        )}
        <View style={[s.chip, a.is_active ? s.chipActive : s.chipInactive]}>
          <Text style={[s.chipText, a.is_active ? s.chipActiveText : s.chipInactiveText]}>
            {a.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={s.cardFooter}>
        {isAdmin && (a.contact_phone || a.contact_email) && (
          <View style={s.contactInfo}>
            {!!a.contact_phone && (
              <TouchableOpacity
                style={s.contactRow}
                onPress={() => Linking.openURL(`tel:${a.contact_phone}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                <Text style={s.contactText}>{a.contact_phone}</Text>
              </TouchableOpacity>
            )}
            {!!a.contact_email && (
              <TouchableOpacity
                style={s.contactRow}
                onPress={() => Linking.openURL(`mailto:${a.contact_email}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
                <Text style={s.contactText} numberOfLines={1}>{a.contact_email}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={[s.cardActions, !isAdmin && { marginLeft: 'auto' }]}>
          <TouchableOpacity style={s.viewBtn} onPress={onPress} activeOpacity={0.7}>
            <Ionicons name="arrow-forward-outline" size={13} color={colors.primary} />
            <Text style={s.viewBtnText}>View profile</Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity style={s.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Add Athlete Modal ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  first_name: '', last_name: '', dob: null,
  gender: 'male', ftem_phase: 'F1', invite_email: '', phone: '',
}

function AddModal({ onClose, onSaved }) {
  const [form, setForm]             = useState({ ...EMPTY_FORM })
  const [saving, setSaving]         = useState(false)
  const [emailLookup, setEmailLookup]     = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [showDobPicker, setShowDobPicker] = useState(false)
  const [showGenderSheet, setShowGenderSheet]   = useState(false)
  const [showPhaseSheet, setShowPhaseSheet]     = useState(false)
  const debounceRef = useRef(null)

  function handleEmailChange(email) {
    setForm(p => ({ ...p, invite_email: email }))
    setEmailLookup(null)
    clearTimeout(debounceRef.current)
    const trimmed = email.trim()
    const valid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    if (!valid) return
    setLookupLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/lookup?email=${encodeURIComponent(trimmed)}`)
        setEmailLookup(data)
        if (data.found) {
          setForm(p => ({
            ...p,
            first_name: data.first_name || p.first_name,
            last_name:  data.last_name  || p.last_name,
          }))
        }
      } catch {
        setEmailLookup(null)
      } finally {
        setLookupLoading(false)
      }
    }, 500)
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Required', 'Please enter first and last name.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        dob: form.dob ? form.dob.toISOString().slice(0, 10) : '',
      }
      const { data } = await api.post('/athletes', payload)
      let msg = `${form.first_name} ${form.last_name} added successfully`
      if (data.status === 'pending')  msg = `Invite sent to ${form.invite_email} — waiting for acceptance`
      else if (data.status === 'invited') msg = `${form.first_name} ${form.last_name} added — invite email sent`
      onSaved(msg)
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to add athlete.')
      setSaving(false)
    }
  }

  const dobLabel = form.dob ? fmtDate(form.dob) : 'Select date…'
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add athlete</Text>
            <TouchableOpacity onPress={onClose} style={s.modalClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Email */}
            <Text style={s.label}>
              Athlete email <Text style={s.labelOptional}>(optional)</Text>
            </Text>
            <View style={s.emailRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={form.invite_email}
                onChangeText={handleEmailChange}
                placeholder="athlete@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={s.emailIcon}>
                {lookupLoading && <ActivityIndicator size="small" color={colors.textMuted} />}
                {!lookupLoading && emailLookup?.found && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                {!lookupLoading && emailLookup && !emailLookup.found && <Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
              </View>
            </View>
            {emailLookup?.found && (
              <View style={s.lookupFound}>
                <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                <View style={{ flex: 1 }}>
                  <Text style={s.lookupFoundTitle}>{emailLookup.full_name} already has a PathwayHQ account</Text>
                  <Text style={s.lookupFoundSub}>An invitation will be sent. They must accept before being added.</Text>
                </View>
              </View>
            )}
            {emailLookup && !emailLookup.found && (
              <Text style={s.lookupNotFound}>
                <Ionicons name="mail-outline" size={12} /> No account found — an invite email will be sent to create one.
              </Text>
            )}

            {/* First / Last name */}
            <View style={[s.twoCol, { marginTop: spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>First name</Text>
                <TextInput
                  style={s.input}
                  value={form.first_name}
                  onChangeText={v => setForm(p => ({ ...p, first_name: v }))}
                  placeholder="First name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Last name</Text>
                <TextInput
                  style={s.input}
                  value={form.last_name}
                  onChangeText={v => setForm(p => ({ ...p, last_name: v }))}
                  placeholder="Last name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* DOB + Phone */}
            <View style={[s.twoCol, { marginTop: spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Date of birth</Text>
                <TouchableOpacity style={s.pickerBtn} onPress={() => setShowDobPicker(true)} activeOpacity={0.7}>
                  <Text style={[s.pickerBtnText, !form.dob && { color: colors.textMuted }]} numberOfLines={1}>{dobLabel}</Text>
                  <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Contact phone</Text>
                <View style={s.phoneRow}>
                  <Ionicons name="call-outline" size={14} color={colors.textMuted} style={{ marginLeft: 10 }} />
                  <TextInput
                    style={[s.input, { flex: 1, borderWidth: 0, paddingLeft: 6 }]}
                    value={form.phone}
                    onChangeText={v => setForm(p => ({ ...p, phone: v }))}
                    placeholder="+61 4xx xxx xxx"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Gender + FTEM */}
            <View style={[s.twoCol, { marginTop: spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Gender</Text>
                <TouchableOpacity style={s.pickerBtn} onPress={() => setShowGenderSheet(true)} activeOpacity={0.7}>
                  <Text style={s.pickerBtnText}>{genderOptions.find(g => g.value === form.gender)?.label ?? 'Male'}</Text>
                  <Ionicons name="chevron-down" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>FTEM phase</Text>
                <TouchableOpacity style={s.pickerBtn} onPress={() => setShowPhaseSheet(true)} activeOpacity={0.7}>
                  <Text style={s.pickerBtnText}>{form.ftem_phase}</Text>
                  <Ionicons name="chevron-down" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={s.modalFooter}>
            <TouchableOpacity onPress={onClose} style={s.footerCancel} activeOpacity={0.8}>
              <Text style={s.footerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.footerSave, saving && { opacity: 0.5 }]} activeOpacity={0.8}>
              <Text style={s.footerSaveText}>
                {saving ? 'Saving…' : emailLookup?.found ? 'Send invite' : 'Add athlete'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* DOB picker */}
      {showDobPicker && (
        <DateTimePicker
          value={form.dob ?? new Date(2005, 0, 1)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(e, d) => {
            setShowDobPicker(false)
            if (d) setForm(p => ({ ...p, dob: d }))
          }}
        />
      )}

      {/* Gender sheet */}
      <Modal visible={showGenderSheet} transparent animationType="slide" onRequestClose={() => setShowGenderSheet(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowGenderSheet(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Gender</Text>
          {genderOptions.map(g => (
            <TouchableOpacity
              key={g.value}
              style={[s.sheetItem, form.gender === g.value && s.sheetItemActive]}
              onPress={() => { setForm(p => ({ ...p, gender: g.value })); setShowGenderSheet(false) }}
              activeOpacity={0.7}
            >
              <Text style={[s.sheetItemText, form.gender === g.value && s.sheetItemTextActive]}>{g.label}</Text>
              {form.gender === g.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Phase sheet */}
      <Modal visible={showPhaseSheet} transparent animationType="slide" onRequestClose={() => setShowPhaseSheet(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowPhaseSheet(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>FTEM Phase</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {Object.entries(FTEM_PHASES).map(([k, v]) => (
              <TouchableOpacity
                key={k}
                style={[s.sheetItem, form.ftem_phase === k && s.sheetItemActive]}
                onPress={() => { setForm(p => ({ ...p, ftem_phase: k })); setShowPhaseSheet(false) }}
                activeOpacity={0.7}
              >
                <View style={[s.phaseChip, { backgroundColor: v.bgColor }]}>
                  <Text style={[s.phaseChipText, { color: v.textColor }]}>{k}</Text>
                </View>
                <Text style={[s.sheetItemText, form.ftem_phase === k && s.sheetItemTextActive]}>{v.label}</Text>
                {form.ftem_phase === k && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AthletesScreen({ navigation }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'club_admin' || user?.role === 'coach'

  const [athletes, setAthletes] = useState([])
  const [squads, setSquads]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal]   = useState(false)

  const [q, setQ]             = useState('')
  const [filterPhase, setFilterPhase] = useState('')
  const [filterSquad, setFilterSquad] = useState('')
  const [showPhaseSheet, setShowPhaseSheet] = useState(false)
  const [showSquadSheet, setShowSquadSheet] = useState(false)

  async function fetchAll() {
    try {
      const { data } = await api.get('/athletes')
      setAthletes(Array.isArray(data) ? data : [])
    } catch {}
    try {
      const { data } = await api.get('/squads')
      setSquads(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => {
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAll().finally(() => setRefreshing(false))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return athletes.filter(a => {
      const name = `${a.first_name ?? ''} ${a.last_name ?? ''} ${a.name ?? ''}`.toLowerCase()
      if (q && !name.includes(ql)) return false
      if (filterPhase && a.ftem_phase !== filterPhase) return false
      if (filterSquad && !(a.squad_ids ?? '').split(',').includes(filterSquad)) return false
      return true
    })
  }, [athletes, q, filterPhase, filterSquad])

  const hasFilters = q || filterPhase || filterSquad

  async function handleDelete(a) {
    const name = a.name ?? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()
    Alert.alert(
      'Delete athlete',
      `Delete ${name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/athletes/${a.id}`)
              setAthletes(p => p.filter(x => x.id !== a.id))
            } catch {
              Alert.alert('Error', 'Failed to delete athlete.')
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const phaseLabel = filterPhase ? `${filterPhase} — ${FTEM_PHASES[filterPhase]?.label ?? filterPhase}` : 'All phases'
  const squadLabel = filterSquad ? (squads.find(sq => String(sq.id) === filterSquad)?.name ?? 'Squad') : 'All squads'

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            {/* Subtitle */}
            <Text style={s.subtitle}>
              {athletes.length} total · {athletes.filter(a => a.is_active).length} active
            </Text>

            {/* Filters */}
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={s.searchInput}
                value={q}
                onChangeText={setQ}
                placeholder="Search athletes…"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
              />
              {!!q && (
                <TouchableOpacity onPress={() => setQ('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <View style={s.filterRow}>
              <TouchableOpacity
                style={[s.filterBtn, !!filterPhase && s.filterBtnActive]}
                onPress={() => setShowPhaseSheet(true)}
                activeOpacity={0.7}
              >
                <Text style={[s.filterBtnText, !!filterPhase && s.filterBtnTextActive]} numberOfLines={1}>
                  {filterPhase || 'All phases'}
                </Text>
                <Ionicons name="chevron-down" size={13} color={filterPhase ? colors.primary : colors.textMuted} />
              </TouchableOpacity>

              {squads.length > 0 && (
                <TouchableOpacity
                  style={[s.filterBtn, !!filterSquad && s.filterBtnActive]}
                  onPress={() => setShowSquadSheet(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.filterBtnText, !!filterSquad && s.filterBtnTextActive]} numberOfLines={1}>
                    {filterSquad ? squadLabel : 'All squads'}
                  </Text>
                  <Ionicons name="chevron-down" size={13} color={filterSquad ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              )}

              {hasFilters && (
                <TouchableOpacity
                  style={s.clearBtn}
                  onPress={() => { setQ(''); setFilterPhase(''); setFilterSquad('') }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={13} color={colors.textSecondary} />
                  <Text style={s.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}

              <Text style={s.countLabel}>{filtered.length} of {athletes.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <AthleteCard
            a={item}
            isAdmin={isAdmin}
            onPress={() => navigation.navigate('AthleteDetail', { athlete: item })}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={s.emptyTitle}>{hasFilters ? 'No athletes found' : 'No athletes yet'}</Text>
            {isAdmin && !hasFilters && (
              <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.7}>
                <Text style={s.emptyLink}>Add your first athlete</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* FAB */}
      {isAdmin && (
        <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Add modal */}
      {showModal && (
        <AddModal
          onClose={() => setShowModal(false)}
          onSaved={async (msg) => {
            setShowModal(false)
            Alert.alert('Success', msg)
            setLoading(true)
            await fetchAll()
            setLoading(false)
          }}
        />
      )}

      {/* Phase filter sheet */}
      <Modal visible={showPhaseSheet} transparent animationType="slide" onRequestClose={() => setShowPhaseSheet(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowPhaseSheet(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Filter by Phase</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[s.sheetItem, !filterPhase && s.sheetItemActive]}
              onPress={() => { setFilterPhase(''); setShowPhaseSheet(false) }}
              activeOpacity={0.7}
            >
              <Text style={[s.sheetItemText, !filterPhase && s.sheetItemTextActive]}>All phases</Text>
              {!filterPhase && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
            {Object.entries(FTEM_PHASES).map(([k, v]) => (
              <TouchableOpacity
                key={k}
                style={[s.sheetItem, filterPhase === k && s.sheetItemActive]}
                onPress={() => { setFilterPhase(k); setShowPhaseSheet(false) }}
                activeOpacity={0.7}
              >
                <View style={[s.phaseChip, { backgroundColor: v.bgColor }]}>
                  <Text style={[s.phaseChipText, { color: v.textColor }]}>{k}</Text>
                </View>
                <Text style={[s.sheetItemText, filterPhase === k && s.sheetItemTextActive]}>{v.label}</Text>
                {filterPhase === k && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Squad filter sheet */}
      <Modal visible={showSquadSheet} transparent animationType="slide" onRequestClose={() => setShowSquadSheet(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowSquadSheet(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Filter by Squad</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[s.sheetItem, !filterSquad && s.sheetItemActive]}
              onPress={() => { setFilterSquad(''); setShowSquadSheet(false) }}
              activeOpacity={0.7}
            >
              <Text style={[s.sheetItemText, !filterSquad && s.sheetItemTextActive]}>All squads</Text>
              {!filterSquad && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
            {squads.map(sq => (
              <TouchableOpacity
                key={sq.id}
                style={[s.sheetItem, filterSquad === String(sq.id) && s.sheetItemActive]}
                onPress={() => { setFilterSquad(String(sq.id)); setShowSquadSheet(false) }}
                activeOpacity={0.7}
              >
                <Text style={[s.sheetItemText, filterSquad === String(sq.id) && s.sheetItemTextActive]}>{sq.name}</Text>
                {filterSquad === String(sq.id) && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md, paddingBottom: 100 },

  subtitle: { fontSize: font.sm, color: colors.textSecondary, marginBottom: spacing.sm },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, height: 44, marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: font.sm, color: colors.text },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 36, paddingHorizontal: 12,
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive:     { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  filterBtnText:       { fontSize: font.sm, color: colors.textSecondary, maxWidth: 120 },
  filterBtnTextActive: { color: colors.primary, fontWeight: '600' },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 36, paddingHorizontal: 12,
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  clearBtnText: { fontSize: font.sm, color: colors.textSecondary },
  countLabel: { fontSize: font.sm, color: colors.textMuted, marginLeft: 'auto' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderLight,
    padding: 14, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardMeta:    { flex: 1, minWidth: 0 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  cardName:    { fontSize: font.base, fontWeight: '700', color: colors.text },

  pendingBadge:     { backgroundColor: '#fef3c7', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#92400e' },

  ftemBadge:     { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  ftemBadgeText: { fontSize: 11, fontWeight: '700' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { backgroundColor: '#f1f5f9', borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 12, color: colors.textSecondary },
  chipActive:       { backgroundColor: '#d1fae5' },
  chipInactive:     { backgroundColor: '#f1f5f9' },
  chipActiveText:   { color: '#065f46', fontWeight: '700' },
  chipInactiveText: { color: colors.textMuted },

  cardFooter:  { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  contactInfo: { flex: 1, gap: 3 },
  contactRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contactText: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  deleteBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: radius.md },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: font.base, fontWeight: '700', color: colors.textMuted, marginTop: spacing.sm },
  emptyLink:  { fontSize: font.sm, color: colors.primary, textDecorationLine: 'underline', marginTop: spacing.sm },

  // FAB
  fab: {
    position: 'absolute', right: spacing.md, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },

  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  modalTitle: { fontSize: font.lg, fontWeight: '900', color: colors.text },
  modalClose: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: colors.background },
  modalBody:  { padding: spacing.md, paddingBottom: spacing.xl },
  modalFooter: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  footerCancel: {
    flex: 1, height: 48, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  footerCancelText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },
  footerSave: {
    flex: 1, height: 48, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.lg, backgroundColor: colors.primary,
  },
  footerSaveText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },

  label:         { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  labelOptional: { fontWeight: '400', color: colors.textMuted },
  input: {
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: font.sm, color: colors.text, minHeight: 44,
  },
  twoCol:   { flexDirection: 'row', gap: spacing.sm },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 44,
  },
  pickerBtnText: { flex: 1, fontSize: font.sm, color: colors.text, marginRight: 4 },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, minHeight: 44,
  },
  emailRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emailIcon: { width: 24, alignItems: 'center' },

  lookupFound: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#eff6ff', borderRadius: radius.md, borderWidth: 1, borderColor: '#bfdbfe',
    padding: 10, marginTop: 6,
  },
  lookupFoundTitle: { fontSize: font.xs, fontWeight: '600', color: '#1e40af' },
  lookupFoundSub:   { fontSize: font.xs, color: '#3b82f6', marginTop: 2 },
  lookupNotFound:   { fontSize: font.xs, color: colors.textMuted, marginTop: 4 },

  // Sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32, maxHeight: '75%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetTitle: {
    fontSize: font.base, fontWeight: '700', color: colors.text,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sheetItemActive:     { backgroundColor: colors.primaryLight },
  sheetItemText:       { flex: 1, fontSize: font.base, color: colors.text },
  sheetItemTextActive: { color: colors.primary, fontWeight: '700' },
  phaseChip:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  phaseChipText: { fontSize: 11, fontWeight: '700' },
})
