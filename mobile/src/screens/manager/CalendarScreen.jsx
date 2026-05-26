import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'

const EVENT_TYPES = [
  { value: 'training', label: 'Training', color: 'blue'  },
  { value: 'match',    label: 'Match',    color: 'green' },
  { value: 'camp',     label: 'Camp',     color: 'blue'  },
  { value: 'other',    label: 'Other',    color: 'slate' },
]

function typeColor(type) {
  return EVENT_TYPES.find(t => t.value === type)?.color ?? 'slate'
}

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(str) {
  if (!str) return ''
  return new Date(str).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const BLANK = { title: '', location: '', start_time: '', end_time: '', event_type: 'training', description: '', squad_id: '' }

function todayISO() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export default function CalendarScreen() {
  const { user } = useAuth()
  const isManager = user?.role === 'club_admin' || user?.role === 'coach'
  const [events, setEvents] = useState([])
  const [squads, setSquads] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('upcoming')

  async function fetchEvents() {
    try {
      const [evRes, sqRes] = await Promise.allSettled([
        api.get('/events'),
        isManager ? api.get('/squads') : Promise.resolve({ data: [] }),
      ])
      if (evRes.status === 'fulfilled') {
        const list = Array.isArray(evRes.value.data) ? evRes.value.data : []
        setEvents(list)
      }
      if (sqRes.status === 'fulfilled') {
        const list = Array.isArray(sqRes.value.data) ? sqRes.value.data : []
        setSquads(list)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const onRefresh = useCallback(() => { setRefreshing(true); fetchEvents() }, [])

  const now = new Date()
  const filtered = events.filter(ev => {
    const d = new Date(ev.start_time)
    return filter === 'upcoming' ? d >= now : d < now
  }).sort((a, b) => filter === 'upcoming'
    ? new Date(a.start_time) - new Date(b.start_time)
    : new Date(b.start_time) - new Date(a.start_time)
  )

  function openAdd() {
    setForm({ ...BLANK, start_time: todayISO() })
    setEditEvent(null)
    setShowModal(true)
  }

  function openEdit(ev) {
    setForm({
      title: ev.title ?? '',
      location: ev.location ?? '',
      start_time: ev.start_time?.slice(0, 16) ?? '',
      end_time: ev.end_time?.slice(0, 16) ?? '',
      event_type: ev.event_type ?? 'training',
      description: ev.description ?? '',
      squad_id: ev.squad_id ?? '',
    })
    setEditEvent(ev)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { Alert.alert('Required', 'Title is required.'); return }
    if (!form.start_time)   { Alert.alert('Required', 'Start time is required.'); return }
    setSaving(true)
    try {
      if (editEvent) {
        const { data } = await api.put(`/events/${editEvent.id}`, form)
        setEvents(p => p.map(e => e.id === editEvent.id ? { ...e, ...data } : e))
      } else {
        const { data } = await api.post('/events', form)
        setEvents(p => [data, ...p])
      }
      setShowModal(false)
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ev) {
    Alert.alert('Delete Event', `Delete "${ev.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/events/${ev.id}`)
          setEvents(p => p.filter(e => e.id !== ev.id))
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.message ?? 'Failed.')
        }
      }},
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Filter + add row */}
      <View style={styles.topRow}>
        <View style={styles.filterRow}>
          {['upcoming', 'past'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'upcoming' ? 'Upcoming' : 'Past'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {isManager && (
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          iconName="calendar-outline"
          title={filter === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
          subtitle={isManager ? 'Tap + to schedule a session.' : ''}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item: ev }) => {
            const d = new Date(ev.start_time)
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateDay}>{d.getDate()}</Text>
                    <Text style={styles.dateMon}>{d.toLocaleString('en-AU', { month: 'short' })}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{ev.title}</Text>
                    <Text style={styles.cardTime}>{formatTime(ev.start_time)}{ev.end_time ? ` – ${formatTime(ev.end_time)}` : ''}</Text>
                    {ev.location ? <Text style={styles.cardMeta}><Ionicons name="location-outline" size={11} /> {ev.location}</Text> : null}
                    {ev.squad_name ? <Text style={styles.cardMeta}>{ev.squad_name}</Text> : null}
                  </View>
                  <View style={styles.cardRight}>
                    <Badge label={EVENT_TYPES.find(t => t.value === ev.event_type)?.label ?? ev.event_type ?? 'Other'} color={typeColor(ev.event_type)} />
                    {isManager && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => openEdit(ev)} style={styles.iconBtn}>
                          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(ev)} style={styles.iconBtn}>
                          <Ionicons name="trash-outline" size={14} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                {ev.rsvp_counts && (
                  <View style={styles.rsvpRow}>
                    <Text style={styles.rsvpText}>{ev.rsvp_counts.yes ?? 0} going · {ev.rsvp_counts.maybe ?? 0} maybe · {ev.rsvp_counts.no ?? 0} can't go</Text>
                  </View>
                )}
              </View>
            )
          }}
        />
      )}

      {/* Create/edit modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editEvent ? 'Edit Session' : 'New Session'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="e.g. Tuesday Training" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                {EVENT_TYPES.map(t => (
                  <TouchableOpacity key={t.value}
                    style={[styles.typeChip, form.event_type === t.value && styles.typeChipActive]}
                    onPress={() => setForm(p => ({ ...p, event_type: t.value }))}
                  >
                    <Text style={[styles.typeChipText, form.event_type === t.value && styles.typeChipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Start Time *</Text>
              <TextInput style={styles.input} value={form.start_time} onChangeText={v => setForm(p => ({ ...p, start_time: v }))} placeholder="YYYY-MM-DDTHH:MM" placeholderTextColor={colors.textMuted} autoCapitalize="none" />

              <Text style={styles.fieldLabel}>End Time</Text>
              <TextInput style={styles.input} value={form.end_time} onChangeText={v => setForm(p => ({ ...p, end_time: v }))} placeholder="YYYY-MM-DDTHH:MM" placeholderTextColor={colors.textMuted} autoCapitalize="none" />

              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput style={styles.input} value={form.location} onChangeText={v => setForm(p => ({ ...p, location: v }))} placeholder="Venue name or address" placeholderTextColor={colors.textMuted} />

              {squads.length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>Squad (optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                    {[{ id: '', name: 'All Athletes' }, ...squads].map(s => (
                      <TouchableOpacity key={String(s.id)}
                        style={[styles.typeChip, form.squad_id === s.id && styles.typeChipActive]}
                        onPress={() => setForm(p => ({ ...p, squad_id: s.id }))}
                      >
                        <Text style={[styles.typeChipText, form.squad_id === s.id && styles.typeChipTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput style={[styles.input, { minHeight: 80 }]} value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Optional notes" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editEvent ? 'Save' : 'Create'}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingBottom: spacing.sm, gap: 10 },
  filterRow: { flex: 1, flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  filterText: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.primary },
  addBtn: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, paddingTop: 0 },
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dateBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  dateDay: { fontSize: font.md, fontWeight: '800', color: colors.primary, lineHeight: 20 },
  dateMon: { fontSize: 10, fontWeight: '600', color: colors.primary, textTransform: 'uppercase' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  cardTime: { fontSize: font.sm, color: colors.primary, marginTop: 2 },
  cardMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  actionRow: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  rsvpRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  rsvpText: { fontSize: font.xs, color: colors.textMuted },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  modalBody: { padding: spacing.md },
  fieldLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: font.base, color: colors.text, backgroundColor: '#fafafa', marginBottom: spacing.sm },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  typeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeChipText: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted },
  typeChipTextActive: { color: colors.primary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg, paddingBottom: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.base },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },
})
