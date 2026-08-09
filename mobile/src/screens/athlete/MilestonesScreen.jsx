import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, Switch, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES } from '../../lib/constants'
import UpgradeSheet, { parseUpgradeError } from '../../components/UpgradeSheet'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function monthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

function uniqueAthleteCount(items) {
  return new Set(items.map(m => m.athlete_id).filter(Boolean)).size
}

function ftemBg(phase) { return FTEM_PHASES[phase]?.bgColor ?? '#f1f5f9' }
function ftemFg(phase) { return FTEM_PHASES[phase]?.textColor ?? '#475569' }

// ── FtemBadge ────────────────────────────────────────────────────────────────

function FtemBadge({ phase }) {
  if (!phase || !FTEM_PHASES[phase]) return null
  return (
    <View style={[s.ftemBadge, { backgroundColor: ftemBg(phase) }]}>
      <Text style={[s.ftemBadgeText, { color: ftemFg(phase) }]}>{phase}</Text>
    </View>
  )
}

// ── MilestoneCard ─────────────────────────────────────────────────────────────

function MilestoneCard({ m, isManager, onDelete, onTogglePublic }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    await onTogglePublic(m.id, !m.is_shared_with_parent)
    setToggling(false)
  }

  return (
    <View style={s.card}>
      <View style={s.cardStripe} />
      <View style={s.cardBody}>
        <View style={[s.cardIcon, { backgroundColor: ftemBg(m.ftem_phase) }]}>
          <Ionicons name="trophy" size={18} color={ftemFg(m.ftem_phase)} />
        </View>

        <View style={s.cardContent}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle} numberOfLines={2}>{m.title}</Text>
            {m.is_claimed && <View style={s.claimedDot} />}
          </View>
          {(m.first_name || m.last_name) && (
            <Text style={s.cardAthlete}>{m.first_name} {m.last_name}</Text>
          )}
          {!!m.description && (
            <Text style={s.cardDesc} numberOfLines={2}>{m.description}</Text>
          )}
          <Text style={s.cardDate}>{fmtDate(m.achieved_at)}</Text>
          {!!m.club_name && (
            <View style={s.cardClubRow}>
              <Ionicons name="business-outline" size={11} color={colors.textMuted} />
              <Text style={s.cardClubName}>{m.club_name}</Text>
            </View>
          )}
        </View>

        <View style={s.cardRight}>
          <FtemBadge phase={m.ftem_phase} />
          {isManager && !confirmDelete && (
            <View style={s.cardActions}>
              <TouchableOpacity
                onPress={handleToggle}
                disabled={toggling}
                style={[s.publicBtn, m.is_shared_with_parent ? s.publicBtnOn : s.publicBtnOff]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={m.is_shared_with_parent ? 'globe-outline' : 'lock-closed-outline'}
                  size={11}
                  color={m.is_shared_with_parent ? '#059669' : '#94a3b8'}
                />
                <Text style={[s.publicBtnText, { color: m.is_shared_with_parent ? '#059669' : '#94a3b8' }]}>
                  {m.is_shared_with_parent ? 'Public' : 'Private'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmDelete(true)} style={s.deleteBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={14} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          )}
          {!isManager && m.is_shared_with_parent && (
            <View style={s.publicChip}>
              <Text style={s.publicChipText}>Public</Text>
            </View>
          )}
        </View>
      </View>

      {isManager && confirmDelete && (
        <View style={s.deleteConfirm}>
          <Text style={s.deleteConfirmText}>Delete this milestone?</Text>
          <View style={s.deleteConfirmBtns}>
            <TouchableOpacity onPress={() => setConfirmDelete(false)} style={s.cancelBtn} activeOpacity={0.8}>
              <Text style={s.cancelBtnText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(m.id)} style={s.confirmBtn} activeOpacity={0.8}>
              <Text style={s.confirmBtnText}>Yes, delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

// ── Add Milestone Modal ───────────────────────────────────────────────────────

const BLANK = {
  athlete_id: '', title: '', description: '',
  ftem_phase: 'F1', achieved_at: new Date(), is_shared_with_parent: false,
}

function AddModal({ athletes, onClose, onSaved, onUpgrade }) {
  const [form, setForm] = useState({ ...BLANK })
  const [saving, setSaving] = useState(false)
  const [showAthletePicker, setShowAthletePicker] = useState(false)
  const [showPhasePicker, setShowPhasePicker]     = useState(false)
  const [showDatePicker, setShowDatePicker]       = useState(false)
  const insets = useSafeAreaInsets()

  const selectedAthlete = useMemo(
    () => athletes.find(a => String(a.id) === String(form.athlete_id)) ?? null,
    [athletes, form.athlete_id],
  )

  function pickAthlete(a) {
    setForm(p => ({ ...p, athlete_id: String(a.id), ftem_phase: a.ftem_phase ?? p.ftem_phase }))
    setShowAthletePicker(false)
  }

  async function handleSave() {
    if (!form.athlete_id || !form.title.trim()) {
      Alert.alert('Required', 'Please select an athlete and enter a title.')
      return
    }
    setSaving(true)
    try {
      await api.post('/milestones', {
        ...form,
        achieved_at: form.achieved_at.toISOString().slice(0, 10),
      })
      onSaved()
    } catch (e) {
      const up = parseUpgradeError(e)
      if (up) { onClose(); onUpgrade?.(up); return }
      Alert.alert('Error', 'Failed to save milestone.')
      setSaving(false)
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add milestone</Text>
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
            <Text style={s.label}>Athlete</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => setShowAthletePicker(true)} activeOpacity={0.7}>
              <Text style={[s.pickerBtnText, !selectedAthlete && { color: colors.textMuted }]}>
                {selectedAthlete
                  ? `${selectedAthlete.first_name} ${selectedAthlete.last_name}`
                  : 'Select athlete…'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            {selectedAthlete?.ftem_phase && (
              <Text style={s.hint}>
                Current phase:{' '}
                <Text style={{ fontWeight: '700', color: colors.text }}>
                  {selectedAthlete.ftem_phase} — {FTEM_PHASES[selectedAthlete.ftem_phase]?.label ?? selectedAthlete.ftem_phase}
                </Text>
              </Text>
            )}

            <Text style={[s.label, { marginTop: spacing.md }]}>Title</Text>
            <TextInput
              style={s.input}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
              placeholder="e.g. First hat-trick"
              placeholderTextColor={colors.textMuted}
            />

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>FTEM Phase</Text>
                <TouchableOpacity style={s.pickerBtn} onPress={() => setShowPhasePicker(true)} activeOpacity={0.7}>
                  <Text style={s.pickerBtnText}>{form.ftem_phase}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Date achieved</Text>
                <TouchableOpacity style={s.pickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                  <Text style={s.pickerBtnText} numberOfLines={1}>{fmtDate(form.achieved_at.toISOString())}</Text>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[s.label, { marginTop: spacing.md }]}>Description (optional)</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              placeholder="Add context or notes…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={s.toggleRow}
              onPress={() => setForm(p => ({ ...p, is_shared_with_parent: !p.is_shared_with_parent }))}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.toggleLabel}>Show on public club profile</Text>
                <Text style={s.toggleDesc}>Displays this milestone in the club's trophy cabinet and shares with parents</Text>
              </View>
              <Switch
                value={form.is_shared_with_parent}
                onValueChange={v => setForm(p => ({ ...p, is_shared_with_parent: v }))}
                trackColor={{ false: '#e2e8f0', true: '#6ee7b7' }}
                thumbColor={form.is_shared_with_parent ? '#059669' : '#94a3b8'}
              />
            </TouchableOpacity>
          </ScrollView>

          <View style={s.modalFooter}>
            <TouchableOpacity onPress={onClose} style={s.footerCancel} activeOpacity={0.8}>
              <Text style={s.footerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.footerSave, saving && { opacity: 0.5 }]} activeOpacity={0.8}>
              <Text style={s.footerSaveText}>{saving ? 'Saving…' : 'Add milestone'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Athlete sheet */}
      <Modal visible={showAthletePicker} transparent statusBarTranslucent animationType="slide" onRequestClose={() => setShowAthletePicker(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAthletePicker(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom || 16 }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Select Athlete</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {athletes.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[s.sheetItem, String(a.id) === form.athlete_id && s.sheetItemActive]}
                onPress={() => pickAthlete(a)}
                activeOpacity={0.7}
              >
                <Text style={[s.sheetItemText, String(a.id) === form.athlete_id && s.sheetItemTextActive]}>
                  {a.first_name} {a.last_name}{a.squad_names ? ` — ${a.squad_names}` : ''}
                </Text>
                {String(a.id) === form.athlete_id && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Phase sheet */}
      <Modal visible={showPhasePicker} transparent statusBarTranslucent animationType="slide" onRequestClose={() => setShowPhasePicker(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowPhasePicker(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom || 16 }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Select Phase</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {Object.entries(FTEM_PHASES).map(([k, v]) => (
              <TouchableOpacity
                key={k}
                style={[s.sheetItem, k === form.ftem_phase && s.sheetItemActive]}
                onPress={() => { setForm(p => ({ ...p, ftem_phase: k })); setShowPhasePicker(false) }}
                activeOpacity={0.7}
              >
                <View style={[s.phaseChip, { backgroundColor: v.bgColor }]}>
                  <Text style={[s.phaseChipText, { color: v.textColor }]}>{k}</Text>
                </View>
                <Text style={[s.sheetItemText, k === form.ftem_phase && s.sheetItemTextActive]}>{v.label}</Text>
                {k === form.ftem_phase && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Date picker */}
      {showDatePicker && (
        <DateTimePicker
          value={form.achieved_at}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(e, d) => {
            setShowDatePicker(false)
            if (d) setForm(p => ({ ...p, achieved_at: d }))
          }}
        />
      )}
    </Modal>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MilestonesScreen() {
  const { user } = useAuth()
  const isManager = user?.role === 'club_admin' || user?.role === 'coach'
  const insets = useSafeAreaInsets()

  const [items, setItems]           = useState([])
  const [athletes, setAthletes]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal]   = useState(false)
  const [upgrade, setUpgrade]       = useState(null)

  const [q, setQ]                         = useState('')
  const [filterAthlete, setFilterAthlete] = useState('')
  const [filterPhase, setFilterPhase]     = useState('')
  const [showAthleteSheet, setShowAthleteSheet] = useState(false)
  const [showPhaseSheet, setShowPhaseSheet]     = useState(false)

  async function fetchAll() {
    try {
      const { data } = await api.get('/milestones')
      setItems(Array.isArray(data) ? data : [])
    } catch {}
    if (isManager) {
      try {
        const { data } = await api.get('/athletes')
        setAthletes(Array.isArray(data) ? data : [])
      } catch {}
    }
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
    return items.filter(m => {
      if (q && !`${m.first_name ?? ''} ${m.last_name ?? ''} ${m.title}`.toLowerCase().includes(ql)) return false
      if (filterAthlete && String(m.athlete_id) !== filterAthlete) return false
      if (filterPhase && m.ftem_phase !== filterPhase) return false
      return true
    })
  }, [items, q, filterAthlete, filterPhase])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const m of filtered) {
      if (!m.achieved_at) continue
      const key = monthKey(m.achieved_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(m)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const hasFilters = q || filterAthlete || filterPhase

  const myPhases = useMemo(() => {
    if (isManager) return []
    const counts = {}
    for (const m of items) {
      if (m.ftem_phase) counts[m.ftem_phase] = (counts[m.ftem_phase] || 0) + 1
    }
    return Object.entries(counts)
  }, [items, isManager])

  const listData = useMemo(() => {
    const rows = []
    for (const [key, milestones] of grouped) {
      rows.push({ type: 'month', key: `month-${key}`, label: monthLabel(key), count: milestones.length })
      for (const m of milestones) {
        rows.push({ type: 'item', key: `item-${m.id}`, m })
      }
    }
    return rows
  }, [grouped])

  async function handleDelete(id) {
    try {
      await api.delete(`/milestones/${id}`)
      setItems(p => p.filter(x => x.id !== id))
    } catch {
      Alert.alert('Error', 'Failed to delete milestone.')
    }
  }

  async function handleTogglePublic(id, value) {
    const item = items.find(m => m.id === id)
    if (!item) return
    try {
      await api.put(`/milestones/${id}`, {
        athlete_id: item.athlete_id, title: item.title,
        description: item.description, ftem_phase: item.ftem_phase,
        achieved_at: item.achieved_at, is_shared_with_parent: value,
      })
      setItems(p => p.map(m => m.id === id ? { ...m, is_shared_with_parent: value } : m))
    } catch {
      Alert.alert('Error', 'Failed to update milestone.')
    }
  }

  const totalAthletes = uniqueAthleteCount(items)
  const subtitle = items.length === 0
    ? 'No milestones yet'
    : `${items.length} milestone${items.length !== 1 ? 's' : ''} across ${totalAthletes} athlete${totalAthletes !== 1 ? 's' : ''}`

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
        data={listData}
        keyExtractor={item => item.key}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <Text style={s.subtitle}>{subtitle}</Text>

            {/* Phase chips for athlete view */}
            {!isManager && myPhases.length > 0 && (
              <View style={s.phaseStrip}>
                {myPhases.map(([phase, count]) => (
                  <View key={phase} style={[s.phaseChipLarge, { backgroundColor: ftemBg(phase) }]}>
                    <Ionicons name="trophy" size={12} color={ftemFg(phase)} />
                    <Text style={[s.phaseChipLargeLabel, { color: ftemFg(phase) }]}>{phase}</Text>
                    <Text style={[s.phaseChipLargeCount, { color: ftemFg(phase) }]}>{count}</Text>
                  </View>
                ))}
                <View style={[s.phaseChipLarge, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="flash" size={12} color="#059669" />
                  <Text style={[s.phaseChipLargeLabel, { color: '#059669' }]}>{items.length} total</Text>
                </View>
              </View>
            )}

            {/* Filters */}
            <View style={s.filters}>
              <View style={s.searchBox}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
                <TextInput
                  style={s.searchInput}
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search…"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={s.filterRow}>
                {isManager && (
                  <TouchableOpacity
                    style={[s.filterBtn, !!filterAthlete && s.filterBtnActive]}
                    onPress={() => setShowAthleteSheet(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.filterBtnText, !!filterAthlete && s.filterBtnTextActive]} numberOfLines={1}>
                      {filterAthlete
                        ? (athletes.find(a => String(a.id) === filterAthlete)?.first_name ?? 'Athlete')
                        : 'All athletes'}
                    </Text>
                    <Ionicons name="chevron-down" size={13} color={filterAthlete ? colors.primary : colors.textMuted} />
                  </TouchableOpacity>
                )}

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

                {hasFilters && (
                  <TouchableOpacity
                    style={s.clearBtn}
                    onPress={() => { setQ(''); setFilterAthlete(''); setFilterPhase('') }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={13} color={colors.textSecondary} />
                    <Text style={s.clearBtnText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'month') {
            return (
              <View style={s.monthHeader}>
                <View style={s.monthAccent} />
                <Text style={s.monthLabel}>{item.label}</Text>
                <Text style={s.monthCount}>({item.count})</Text>
              </View>
            )
          }
          return (
            <MilestoneCard
              m={item.m}
              isManager={isManager}
              onDelete={handleDelete}
              onTogglePublic={handleTogglePublic}
            />
          )
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="trophy-outline" size={36} color="#fbbf24" />
            </View>
            {isManager ? (
              <>
                <Text style={s.emptyTitle}>
                  {hasFilters ? 'No milestones match your filters' : 'No milestones recorded yet'}
                </Text>
                <Text style={s.emptySubtitle}>
                  {hasFilters
                    ? 'Try adjusting your search or filters.'
                    : "Start celebrating your athletes' achievements."}
                </Text>
                {!hasFilters && (
                  <TouchableOpacity style={s.emptyBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={s.emptyBtnText}>Record first milestone</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={s.emptyTitle}>No milestones yet</Text>
                <Text style={s.emptySubtitle}>Keep training — your coach will celebrate your progress here.</Text>
                <View style={s.keepGoing}>
                  <Ionicons name="flash" size={14} color="#059669" />
                  <Text style={s.keepGoingText}>Keep going!</Text>
                </View>
              </>
            )}
          </View>
        }
      />

      {/* FAB */}
      {isManager && (
        <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Add modal */}
      {showModal && (
        <AddModal
          athletes={athletes}
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false)
            setLoading(true)
            await fetchAll()
            setLoading(false)
          }}
          onUpgrade={up => { setShowModal(false); setUpgrade(up) }}
        />
      )}
      <UpgradeSheet
        visible={!!upgrade}
        message={upgrade?.message}
        requiredPlan={upgrade?.requiredPlan ?? 'pro'}
        onClose={() => setUpgrade(null)}
      />

      {/* Athlete filter sheet */}
      <Modal visible={showAthleteSheet} transparent statusBarTranslucent animationType="slide" onRequestClose={() => setShowAthleteSheet(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAthleteSheet(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom || 16 }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Filter by Athlete</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[s.sheetItem, !filterAthlete && s.sheetItemActive]}
              onPress={() => { setFilterAthlete(''); setShowAthleteSheet(false) }}
              activeOpacity={0.7}
            >
              <Text style={[s.sheetItemText, !filterAthlete && s.sheetItemTextActive]}>All athletes</Text>
              {!filterAthlete && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
            {athletes.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[s.sheetItem, filterAthlete === String(a.id) && s.sheetItemActive]}
                onPress={() => { setFilterAthlete(String(a.id)); setShowAthleteSheet(false) }}
                activeOpacity={0.7}
              >
                <Text style={[s.sheetItemText, filterAthlete === String(a.id) && s.sheetItemTextActive]}>
                  {a.first_name} {a.last_name}
                </Text>
                {filterAthlete === String(a.id) && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Phase filter sheet */}
      <Modal visible={showPhaseSheet} transparent statusBarTranslucent animationType="slide" onRequestClose={() => setShowPhaseSheet(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowPhaseSheet(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom || 16 }]}>
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
    </SafeAreaView>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md, paddingBottom: 100 },

  subtitle: {
    fontSize: font.sm, color: colors.textSecondary, marginBottom: spacing.md,
  },

  // Phase strip (athlete view)
  phaseStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  phaseChipLarge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.md,
  },
  phaseChipLargeLabel: { fontSize: font.xs, fontWeight: '700' },
  phaseChipLargeCount: { fontSize: font.xs, fontWeight: '900' },

  // Filters
  filters:  { marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, height: 44, marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: font.sm, color: colors.text },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 38, paddingHorizontal: 12,
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  filterBtnText:   { fontSize: font.sm, color: colors.textSecondary, maxWidth: 120 },
  filterBtnTextActive: { color: colors.primary, fontWeight: '600' },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 38, paddingHorizontal: 12,
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  clearBtnText: { fontSize: font.sm, color: colors.textSecondary },

  // Month header
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  monthAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: '#fbbf24' },
  monthLabel:  { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  monthCount:  { fontSize: font.xs, color: colors.textMuted },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: '#fde68a',
    marginBottom: spacing.sm, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardStripe: { height: 4, backgroundColor: '#fbbf24' },
  cardBody:   { flexDirection: 'row', padding: 14, gap: 10 },
  cardIcon:   { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle:   { flex: 1, fontSize: font.base, fontWeight: '700', color: colors.text, lineHeight: 20 },
  claimedDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399', flexShrink: 0 },
  cardAthlete: { fontSize: font.xs, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  cardDesc:    { fontSize: font.xs, color: colors.textMuted, marginTop: 4, lineHeight: 17 },
  cardDate:    { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  cardClubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardClubName: { fontSize: 10, color: colors.textMuted },
  cardRight:   { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },

  ftemBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  ftemBadgeText: { fontSize: 11, fontWeight: '700' },

  publicBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  publicBtnOn:  { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  publicBtnOff: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  publicBtnText: { fontSize: 10, fontWeight: '600' },

  deleteBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },

  publicChip: {
    backgroundColor: '#f0fdf4', borderRadius: radius.full,
    borderWidth: 1, borderColor: '#bbf7d0',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  publicChipText: { fontSize: 10, fontWeight: '600', color: '#059669' },

  // Delete confirm
  deleteConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderTopWidth: 1, borderTopColor: '#fee2e2',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  deleteConfirmText: { flex: 1, fontSize: font.xs, fontWeight: '600', color: '#b91c1c' },
  deleteConfirmBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    height: 36, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  confirmBtn: {
    height: 36, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#ef4444', borderRadius: radius.md,
  },
  confirmBtnText: { fontSize: font.xs, fontWeight: '700', color: '#fff' },

  // Empty state
  empty: {
    alignItems: 'center', paddingVertical: 48, paddingHorizontal: spacing.lg,
    borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', backgroundColor: '#fff', marginTop: spacing.md,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 18, backgroundColor: '#fffbeb',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  emptyTitle:    { fontSize: font.base, fontWeight: '700', color: colors.textSecondary, textAlign: 'center', marginBottom: 6 },
  emptySubtitle: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingHorizontal: 20, paddingVertical: 12, minHeight: 44,
  },
  emptyBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
  keepGoing: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  keepGoingText: { fontSize: font.xs, fontWeight: '600', color: '#059669' },

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

  label: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  hint:  { fontSize: font.xs, color: colors.textMuted, marginTop: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: font.sm, color: colors.text, minHeight: 44,
  },
  textarea: { minHeight: 80, paddingTop: 10 },
  twoCol: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 44,
  },
  pickerBtnText: { flex: 1, fontSize: font.sm, color: colors.text },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12, marginTop: spacing.md,
  },
  toggleLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  toggleDesc:  { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },

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
    paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sheetItemActive:     { backgroundColor: colors.primaryLight },
  sheetItemText:       { flex: 1, fontSize: font.base, color: colors.text },
  sheetItemTextActive: { color: colors.primary, fontWeight: '700' },
  phaseChip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  phaseChipText: { fontSize: 11, fontWeight: '700' },
})
