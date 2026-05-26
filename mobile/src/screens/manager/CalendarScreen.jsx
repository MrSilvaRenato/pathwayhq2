import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView,
  Alert, Pressable, Dimensions,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'

// ── Config ─────────────────────────────────────────────────────────────────────
const TYPE_META = {
  training: { label: 'Training', color: '#2563eb', light: '#dbeafe', text: '#1e3a8a', dot: '#2563eb' },
  match:    { label: 'Match',    color: '#059669', light: '#d1fae5', text: '#065f46', dot: '#059669' },
  camp:     { label: 'Camp',     color: '#7c3aed', light: '#ede9fe', text: '#4c1d95', dot: '#7c3aed' },
  other:    { label: 'Other',    color: '#64748b', light: '#f1f5f9', text: '#334155', dot: '#94a3b8' },
}
const tm = t => TYPE_META[t] ?? TYPE_META.other

const TYPE_OPTIONS = [
  { value: 'training', label: '💪  Training' },
  { value: 'match',    label: '⚽  Match'    },
  { value: 'camp',     label: '🏕️  Camp'     },
  { value: 'other',    label: '📋  Other'    },
]
const RECURRENCE_OPTIONS = [
  { value: 'none',     label: 'No repeat'      },
  { value: 'daily',    label: 'Daily'           },
  { value: 'weekly',   label: 'Weekly'          },
  { value: 'biweekly', label: 'Every 2 weeks'   },
  { value: 'monthly',  label: 'Monthly'         },
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS = ['S','M','T','W','T','F','S']

const SCREEN_W = Dimensions.get('window').width
const CELL_W = Math.floor((SCREEN_W - spacing.md * 2) / 7)

const BLANK_FORM = {
  title: '', description: '', location: '',
  start_time: '', end_time: '', event_type: 'training', squad_id: '',
  recurrence: 'none', repeat_until: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function toKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
function fmtTime(str) {
  if (!str) return ''
  return new Date(str).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function fmtDateDisplay(d) {
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}
function toLocalISO(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
function toDateOnly(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
}
function daysUntilLabel(start) {
  const today = new Date(); today.setHours(0,0,0,0)
  const ev = new Date(start); ev.setHours(0,0,0,0)
  const diff = Math.round((ev - today) / 86400000)
  if (diff === 0) return { label: 'Today', past: false }
  if (diff === 1) return { label: 'Tomorrow', past: false }
  if (diff > 1)  return { label: `In ${diff} days`, past: false }
  if (diff === -1) return { label: 'Yesterday', past: true }
  return { label: `${Math.abs(diff)} days ago`, past: true }
}
function countOccurrences(startISO, repeatUntil, recurrence) {
  let count = 0, cur = new Date(startISO), until = new Date(repeatUntil)
  while (cur <= until && count < 104) {
    count++
    if (recurrence === 'daily') cur.setDate(cur.getDate()+1)
    else if (recurrence === 'weekly') cur.setDate(cur.getDate()+7)
    else if (recurrence === 'biweekly') cur.setDate(cur.getDate()+14)
    else if (recurrence === 'monthly') cur.setMonth(cur.getMonth()+1)
    else break
  }
  return count
}
function defaultRepeatUntil(startISO, recurrence) {
  const d = new Date(startISO)
  if (recurrence === 'daily')    d.setMonth(d.getMonth()+1)
  else if (recurrence === 'weekly')   d.setMonth(d.getMonth()+3)
  else if (recurrence === 'biweekly') d.setMonth(d.getMonth()+3)
  else if (recurrence === 'monthly')  d.setMonth(d.getMonth()+6)
  return toDateOnly(d)
}

// ── Dropdown ───────────────────────────────────────────────────────────────────
function Dropdown({ options, value, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const sel = options.find(o => o.value === value)
  return (
    <>
      <TouchableOpacity style={styles.dropBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[styles.dropBtnText, !sel && { color: colors.textMuted }]} numberOfLines={1}>
          {sel?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={15} color={colors.textMuted} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sheetItem, opt.value === value && styles.sheetItemSel]}
              onPress={() => { onChange(opt.value); setOpen(false) }}
            >
              <Text style={[styles.sheetItemText, opt.value === value && styles.sheetItemTextSel]}>
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

// ── DateTime field ─────────────────────────────────────────────────────────────
function DateTimeField({ label, value, onChange, required }) {
  const [pickDate, setPickDate] = useState(false)
  const [pickTime, setPickTime] = useState(false)
  const dt = value ? new Date(value) : new Date()

  function onDateChange(e, selected) {
    if (Platform.OS === 'android') setPickDate(false)
    if (!selected) return
    const merged = value ? new Date(value) : new Date()
    merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
    onChange(toLocalISO(merged))
    if (Platform.OS === 'android') setPickTime(true)
  }

  function onTimeChange(e, selected) {
    if (Platform.OS === 'android') setPickTime(false)
    if (!selected) return
    const merged = value ? new Date(value) : new Date()
    merged.setHours(selected.getHours(), selected.getMinutes())
    onChange(toLocalISO(merged))
  }

  const datePart = value ? new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const timePart = value ? fmtTime(value) : null

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}{required ? ' *' : ''}</Text>
      <View style={styles.dtRow}>
        <TouchableOpacity style={[styles.dtBtn, { flex: 3 }]} onPress={() => setPickDate(true)} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.dtBtnText, !datePart && { color: colors.textMuted }]} numberOfLines={1}>
            {datePart ?? 'Date'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dtBtn, { flex: 2 }]} onPress={() => setPickTime(true)} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.dtBtnText, !timePart && { color: colors.textMuted }]} numberOfLines={1}>
            {timePart ?? 'Time'}
          </Text>
        </TouchableOpacity>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} style={{ padding: 6 }} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {pickDate && (
        <DateTimePicker value={dt} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange} />
      )}
      {pickTime && (
        <DateTimePicker value={dt} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange} />
      )}
    </View>
  )
}

// ── Date-only field ────────────────────────────────────────────────────────────
function DateField({ label, value, onChange }) {
  const [show, setShow] = useState(false)
  const d = value ? new Date(value) : new Date()
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropBtn} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
        <Text style={[styles.dropBtnText, !value && { color: colors.textMuted }]} numberOfLines={1}>
          {value ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Set date'}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {show && (
        <DateTimePicker value={d} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, sel) => { setShow(Platform.OS === 'ios'); if (sel) onChange(toDateOnly(sel)) }} />
      )}
    </View>
  )
}

// ── Event card ─────────────────────────────────────────────────────────────────
function EventCard({ ev, isManager, rsvping, onRsvp, onEdit, onDelete }) {
  const [delConfirm, setDelConfirm] = useState(false)
  const meta = tm(ev.event_type)
  const start = new Date(ev.start_time)
  const end = ev.end_time ? new Date(ev.end_time) : null
  const { label: daysLabel, past } = daysUntilLabel(ev.start_time)
  const counts = ev.rsvp_counts ?? { yes: 0, maybe: 0, no: 0 }
  const totalRsvp = counts.yes + counts.maybe + counts.no
  const myStatus = ev.my_rsvp_status
  const duration = end ? Math.round((end - start) / 60000) : null

  return (
    <View style={[styles.eventCard, past && { opacity: 0.65 }]}>
      {/* Colored stripe */}
      <View style={[styles.eventStripe, { backgroundColor: meta.color }]} />

      <View style={styles.eventBody}>
        {/* Top row: badges + days chip */}
        <View style={styles.eventTopRow}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 }}>
            <View style={[styles.typeBadge, { backgroundColor: meta.light }]}>
              <Text style={[styles.typeBadgeText, { color: meta.text }]}>{meta.label}</Text>
            </View>
            {ev.squad_name && (
              <View style={styles.squadBadge}>
                <Ionicons name="people-outline" size={10} color={colors.textSecondary} />
                <Text style={styles.squadBadgeText}>{ev.squad_name}</Text>
              </View>
            )}
            {ev.series_id && (
              <View style={styles.seriesBadge}>
                <Ionicons name="repeat-outline" size={10} color="#7c3aed" />
                <Text style={styles.seriesBadgeText}>Series</Text>
              </View>
            )}
          </View>
          <View style={[styles.daysChip,
            !past && daysLabel === 'Today' ? { backgroundColor: colors.primaryLight } :
            past ? { backgroundColor: colors.borderLight } :
            { backgroundColor: colors.borderLight }
          ]}>
            <Text style={[styles.daysChipText,
              daysLabel === 'Today' ? { color: colors.primaryDark } : { color: colors.textMuted }
            ]}>{daysLabel}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.eventTitle}>{ev.title}</Text>

        {/* Time block */}
        <View style={[styles.timeBlock, { backgroundColor: meta.light }]}>
          <Ionicons name="time-outline" size={16} color={meta.color} />
          <View>
            <Text style={[styles.timeText, { color: meta.text }]}>
              {fmtTime(ev.start_time)}{end ? ` — ${fmtTime(ev.end_time)}` : ''}
            </Text>
            {duration ? <Text style={styles.durationText}>{duration} min session</Text> : null}
          </View>
        </View>

        {/* Location */}
        {ev.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.locationText}>{ev.location}</Text>
          </View>
        ) : null}

        {/* Description */}
        {ev.description ? (
          <View style={styles.locationRow}>
            <Ionicons name="document-text-outline" size={13} color={colors.textMuted} />
            <Text style={styles.locationText}>{ev.description}</Text>
          </View>
        ) : null}

        {/* Attendance */}
        {(isManager || totalRsvp > 0) && (
          <View style={styles.attendanceWrap}>
            <View style={styles.attendanceHeader}>
              <Text style={styles.attendanceLabel}>Attendance</Text>
              <Text style={styles.attendanceCount}>{counts.yes + counts.maybe} / {totalRsvp} responded</Text>
            </View>
            <View style={styles.rsvpCounts}>
              <View style={styles.rsvpCountItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={[styles.rsvpCountNum, { color: '#059669' }]}>{counts.yes}</Text>
                <Text style={styles.rsvpCountLabel}>going</Text>
              </View>
              <View style={styles.rsvpCountItem}>
                <Ionicons name="help-circle" size={14} color="#f59e0b" />
                <Text style={[styles.rsvpCountNum, { color: '#d97706' }]}>{counts.maybe}</Text>
                <Text style={styles.rsvpCountLabel}>maybe</Text>
              </View>
              <View style={styles.rsvpCountItem}>
                <Ionicons name="close-circle" size={14} color="#ef4444" />
                <Text style={[styles.rsvpCountNum, { color: '#dc2626' }]}>{counts.no}</Text>
                <Text style={styles.rsvpCountLabel}>no</Text>
              </View>
            </View>
            {totalRsvp > 0 && (
              <View style={styles.rsvpBar}>
                {counts.yes   > 0 && <View style={[styles.rsvpBarFill, { flex: counts.yes,   backgroundColor: '#10b981' }]} />}
                {counts.maybe > 0 && <View style={[styles.rsvpBarFill, { flex: counts.maybe, backgroundColor: '#f59e0b' }]} />}
                {counts.no    > 0 && <View style={[styles.rsvpBarFill, { flex: counts.no,    backgroundColor: '#ef4444' }]} />}
              </View>
            )}
          </View>
        )}

        {/* Manager: edit/delete */}
        {isManager ? (
          delConfirm ? (
            <View style={styles.delConfirm}>
              {ev.series_id ? (
                <>
                  <Text style={styles.delConfirmText}>Delete which sessions?</Text>
                  <View style={styles.delConfirmBtns}>
                    <TouchableOpacity style={styles.delBtnOrange} onPress={() => { setDelConfirm(false); onDelete(ev.id, false) }}>
                      <Text style={styles.delBtnText}>This only</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.delBtnRed} onPress={() => { setDelConfirm(false); onDelete(ev.id, true) }}>
                      <Text style={styles.delBtnText}>All series</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.delBtnCancel} onPress={() => setDelConfirm(false)}>
                      <Text style={styles.delBtnCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.delConfirmText}>Delete this event?</Text>
                  <View style={styles.delConfirmBtns}>
                    <TouchableOpacity style={styles.delBtnRed} onPress={() => { setDelConfirm(false); onDelete(ev.id, false) }}>
                      <Text style={styles.delBtnText}>Yes, delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.delBtnCancel} onPress={() => setDelConfirm(false)}>
                      <Text style={styles.delBtnCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ) : (
            <View style={styles.managerActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(ev)}>
                <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => setDelConfirm(true)}>
                <Ionicons name="trash-outline" size={14} color={colors.error} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          // RSVP buttons for athletes
          <View>
            {myStatus && (
              <View style={[styles.myRsvpBanner,
                myStatus === 'yes' ? { backgroundColor: '#f0fdf4' } :
                myStatus === 'maybe' ? { backgroundColor: '#fffbeb' } :
                { backgroundColor: '#fef2f2' }
              ]}>
                <Ionicons
                  name={myStatus === 'yes' ? 'checkmark-circle' : myStatus === 'maybe' ? 'help-circle' : 'close-circle'}
                  size={16}
                  color={myStatus === 'yes' ? '#059669' : myStatus === 'maybe' ? '#d97706' : '#dc2626'}
                />
                <Text style={[styles.myRsvpText, { color: myStatus === 'yes' ? '#065f46' : myStatus === 'maybe' ? '#92400e' : '#7f1d1d' }]}>
                  You said: <Text style={{ fontWeight: '800' }}>{myStatus === 'yes' ? 'Going' : myStatus === 'maybe' ? 'Maybe' : "Can't make it"}</Text>
                </Text>
                <Text style={styles.tapToChange}>Tap to change</Text>
              </View>
            )}
            <View style={styles.rsvpBtns}>
              {[
                { s: 'yes',   label: '✓ Going', active: '#10b981' },
                { s: 'maybe', label: '? Maybe',  active: '#f59e0b' },
                { s: 'no',    label: '✗ No',     active: '#ef4444' },
              ].map(({ s, label, active }) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.rsvpBtn, myStatus === s && { backgroundColor: active, borderColor: active }]}
                  disabled={rsvping[ev.id] != null}
                  onPress={() => onRsvp(ev.id, s)}
                >
                  <Text style={[styles.rsvpBtnText, myStatus === s && { color: '#fff' }]}>
                    {rsvping[ev.id] === s ? '…' : label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

// ── Event form modal ───────────────────────────────────────────────────────────
function EventFormModal({ initial, editScope, squads, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? { ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const isEditing = !!initial
  const isSeries = editScope === 'series'

  const occCount = (() => {
    if (!form.recurrence || form.recurrence === 'none') return 1
    if (!form.repeat_until || !form.start_time) return 1
    return countOccurrences(form.start_time, form.repeat_until, form.recurrence)
  })()

  function onRecurrenceChange(val) {
    const until = val !== 'none' && form.start_time ? defaultRepeatUntil(form.start_time, val) : ''
    setForm(p => ({ ...p, recurrence: val, repeat_until: until }))
  }

  async function handleSubmit() {
    if (!form.title.trim()) { Alert.alert('Required', 'Title is required.'); return }
    if (!isSeries && !form.start_time) { Alert.alert('Required', 'Start time is required.'); return }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const squadOptions = [{ value: '', label: 'All squads' }, ...squads.map(s => ({ value: String(s.id), label: s.name }))]

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>
                {isEditing ? (isSeries ? 'Edit all sessions' : 'Edit event') : 'Add event'}
              </Text>
              {isSeries && (
                <Text style={styles.modalSubtitle}>Date & time fields are hidden — each session keeps its own schedule</Text>
              )}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
              placeholder="e.g. Tuesday Training"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <Dropdown options={TYPE_OPTIONS} value={form.event_type} onChange={v => setForm(p => ({ ...p, event_type: v }))} />

            <Text style={styles.fieldLabel}>Squad</Text>
            <Dropdown options={squadOptions} value={String(form.squad_id ?? '')} onChange={v => setForm(p => ({ ...p, squad_id: v }))} />

            {!isSeries && (
              <>
                <DateTimeField label="Start" value={form.start_time} onChange={v => setForm(p => ({ ...p, start_time: v }))} required />
                <DateTimeField label="End" value={form.end_time} onChange={v => setForm(p => ({ ...p, end_time: v }))} />

                {!isEditing && (
                  <>
                    <Text style={styles.fieldLabel}>Repeat</Text>
                    <Dropdown options={RECURRENCE_OPTIONS} value={form.recurrence} onChange={onRecurrenceChange} />

                    {form.recurrence !== 'none' && (
                      <>
                        <DateField
                          label="Repeat until"
                          value={form.repeat_until}
                          onChange={v => setForm(p => ({ ...p, repeat_until: v }))}
                        />
                        {occCount > 1 && (
                          <Text style={styles.occCount}>Will create {occCount} sessions</Text>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={v => setForm(p => ({ ...p, location: v }))}
              placeholder="Venue or address"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              placeholder="Optional notes…"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.6 }, isSeries && { backgroundColor: '#7c3aed' }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={styles.primaryBtnText}>
                  {isEditing
                    ? (isSeries ? 'Update all sessions' : 'Save changes')
                    : (occCount > 1 ? `Add ${occCount} sessions` : 'Add event')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { user, isAdmin } = useAuth()
  const isManager = user?.role === 'club_admin' || user?.role === 'coach'

  const today = new Date()
  const [events, setEvents]         = useState([])
  const [squads, setSquads]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [showDay, setShowDay]       = useState(false)
  const [rsvping, setRsvping]       = useState({})

  // Modal state
  const [showAdd, setShowAdd]           = useState(false)
  const [editingEv, setEditingEv]       = useState(null)
  const [editScope, setEditScope]       = useState('one')
  const [showScopeSheet, setShowScopeSheet]   = useState(false)
  const [showSeriesSheet, setShowSeriesSheet] = useState(false)
  const [seriesConfirm, setSeriesConfirm]     = useState(null) // 'one' | 'all' | null

  const year  = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  async function load() {
    try {
      const [ev, sq] = await Promise.allSettled([api.get('/events'), api.get('/squads')])
      if (ev.status === 'fulfilled') setEvents(Array.isArray(ev.value.data) ? ev.value.data : [])
      if (sq.status === 'fulfilled') setSquads(Array.isArray(sq.value.data) ? sq.value.data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Build event map by day key
  const eventsByDay = {}
  for (const ev of events) {
    const d = new Date(ev.start_time)
    const k = toKey(d)
    if (!eventsByDay[k]) eventsByDay[k] = []
    eventsByDay[k].push(ev)
  }

  const selectedKey = toKey(selectedDate)
  const selectedEvents = (eventsByDay[selectedKey] ?? []).slice().sort((a,b) => new Date(a.start_time) - new Date(b.start_time))

  function prevMonth() { setCurrentMonth(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentMonth(new Date(year, month + 1, 1)) }
  function goToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
    setShowDay(true)
  }

  function selectDay(day) {
    setSelectedDate(new Date(year, month, day))
    setShowDay(true)
  }

  async function handleRsvp(eventId, status) {
    setRsvping(p => ({ ...p, [eventId]: status }))
    try {
      await api.post(`/events/${eventId}/rsvp`, { status })
      await load()
    } catch {
      Alert.alert('Error', 'Failed to save RSVP.')
    } finally {
      setRsvping(p => ({ ...p, [eventId]: null }))
    }
  }

  function openEdit(ev) {
    setEditingEv(ev)
    setSeriesConfirm(null)
    if (ev.series_id) {
      setEditScope('one')
      setShowScopeSheet(true)
    } else {
      setEditScope('one')
    }
  }

  function recurrenceLabel(r) {
    if (!r || r === 'none') return ''
    if (r === 'daily')    return 'Repeats daily'
    if (r === 'weekly')   return 'Repeats weekly'
    if (r === 'biweekly') return 'Repeats every 2 weeks'
    if (r === 'monthly')  return 'Repeats monthly'
    return ''
  }

  function closeScopeSheet() {
    setShowScopeSheet(false)
    setShowSeriesSheet(false)
    setSeriesConfirm(null)
    setEditingEv(null)
  }

  async function handleDeleteFromSheet(seriesMode) {
    if (!editingEv) return
    setShowScopeSheet(false)
    setSeriesConfirm(null)
    await handleDelete(editingEv.id, seriesMode)
    setEditingEv(null)
  }

  async function handleSave(form) {
    try {
      if (editingEv) {
        const isSeries = editScope === 'series'
        const url = isSeries ? `/events/${editingEv.id}?series=true` : `/events/${editingEv.id}`
        const payload = isSeries
          ? { title: form.title, description: form.description || null, location: form.location || null, event_type: form.event_type, squad_id: form.squad_id || null }
          : { ...form, squad_id: form.squad_id || null }
        await api.put(url, payload)
      } else {
        await api.post('/events', {
          ...form,
          squad_id:     form.squad_id || null,
          recurrence:   form.recurrence || 'none',
          repeat_until: form.recurrence !== 'none' ? form.repeat_until || null : null,
        })
      }
      setShowAdd(false)
      setEditingEv(null)
      setShowScopeSheet(false)
      setShowSeriesSheet(false)
      setSeriesConfirm(null)
      load()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save.')
      throw e
    }
  }

  async function handleDelete(id, seriesMode) {
    try {
      const url = seriesMode ? `/events/${id}?series=true` : `/events/${id}`
      await api.delete(url)
      if (seriesMode) {
        const ev = events.find(e => e.id === id)
        setEvents(p => p.filter(e => e.series_id !== ev?.series_id))
      } else {
        setEvents(p => p.filter(e => e.id !== id))
      }
    } catch {
      Alert.alert('Error', 'Failed to delete.')
    }
  }

  const defaultForm = () => {
    const start = new Date(selectedDate)
    start.setHours(9, 0, 0, 0)
    const end = new Date(selectedDate)
    end.setHours(10, 0, 0, 0)
    return { ...BLANK_FORM, start_time: toLocalISO(start), end_time: toLocalISO(end) }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Calendar</Text>
            <Text style={styles.headerSub}>{events.length} event{events.length !== 1 ? 's' : ''} total</Text>
          </View>
          {isManager && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add event</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Month nav */}
        <View style={styles.monthNav}>
          <View>
            <Text style={styles.monthName}>{MONTHS[month]}</Text>
            <Text style={styles.yearText}>{year}</Text>
          </View>
          <View style={styles.monthNavBtns}>
            <TouchableOpacity style={styles.todayBtn} onPress={goToday}>
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
            <View style={styles.arrowBtns}>
              <TouchableOpacity style={styles.arrowBtn} onPress={prevMonth}>
                <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowBtn} onPress={nextMonth}>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Day-of-week labels */}
        <View style={styles.dowRow}>
          {DAY_LABELS.map((d, i) => (
            <View key={i} style={styles.dowCell}>
              <Text style={[styles.dowText, (i === 0 || i === 6) && { color: colors.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.gridWrap}>
          {cells.map((day, idx) => {
            if (day === null) {
              return <View key={`e-${idx}`} style={styles.emptyCell} />
            }
            const cellDate = new Date(year, month, day)
            const dayKey = toKey(cellDate)
            const dayEvs = eventsByDay[dayKey] ?? []
            const isToday = isSameDay(cellDate, today)
            const isSel   = isSameDay(cellDate, selectedDate)

            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayCell, isSel && !isToday && styles.dayCellSelected, isSel && isToday && styles.dayCellToday]}
                onPress={() => selectDay(day)}
                activeOpacity={0.7}
              >
                <View style={[styles.dayNum, isToday && styles.dayNumToday]}>
                  <Text style={[styles.dayNumText, isToday && styles.dayNumTextToday, isSel && !isToday && { color: colors.primary, fontWeight: '800' }]}>
                    {day}
                  </Text>
                </View>
                {dayEvs.length > 0 && (
                  <View style={styles.dotRow}>
                    {dayEvs.slice(0, 3).map(ev => (
                      <View key={ev.id} style={[styles.dot, { backgroundColor: tm(ev.event_type).dot }]} />
                    ))}
                    {dayEvs.length > 3 && <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {Object.entries(TYPE_META).map(([type, meta]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: meta.dot }]} />
              <Text style={styles.legendText}>{meta.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: spacing.xl * 2 }} />
      </ScrollView>

      {/* Day detail bottom sheet */}
      <Modal visible={showDay} transparent animationType="slide" onRequestClose={() => setShowDay(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowDay(false)} />
        <View style={styles.daySheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.daySheetHeader}>
            <View>
              <Text style={styles.daySheetDate}>{fmtDateDisplay(selectedDate)}</Text>
              <Text style={styles.daySheetCount}>
                {selectedEvents.length === 0 ? 'No events' : `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDay(false)}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.daySheetBody} showsVerticalScrollIndicator={false}>
            {selectedEvents.length === 0 ? (
              <View style={styles.noEvents}>
                <Text style={styles.noEventsText}>No events this day</Text>
                {isManager && (
                  <TouchableOpacity style={[styles.addBtn, { marginTop: spacing.md }]}
                    onPress={() => { setShowDay(false); setShowAdd(true) }}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addBtnText}>Add event</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              selectedEvents.map(ev => (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  isManager={isManager}
                  rsvping={rsvping}
                  onRsvp={handleRsvp}
                  onEdit={ev => { setShowDay(false); openEdit(ev) }}
                  onDelete={handleDelete}
                />
              ))
            )}
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Series action sheet */}
      {editingEv && showScopeSheet && !showSeriesSheet && (
        <Modal visible transparent animationType="slide" onRequestClose={closeScopeSheet}>
          <Pressable style={styles.overlay} onPress={closeScopeSheet} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={{ padding: spacing.md }}>
              {/* Header */}
              <View style={styles.seriesSheetHeader}>
                <View style={styles.seriesSheetIcon}>
                  <Ionicons name="repeat-outline" size={22} color="#7c3aed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scopeTitle} numberOfLines={1}>{editingEv.title}</Text>
                  <Text style={styles.seriesSheetSub}>{recurrenceLabel(editingEv.recurrence)}</Text>
                </View>
              </View>

              {seriesConfirm ? (
                /* Confirm delete panel */
                <View style={styles.seriesConfirmBox}>
                  <Text style={styles.seriesConfirmTitle}>
                    {seriesConfirm === 'all' ? 'Cancel all sessions?' : 'Cancel this session?'}
                  </Text>
                  <Text style={styles.seriesConfirmDesc}>
                    {seriesConfirm === 'all'
                      ? 'This will permanently delete every event in this series.'
                      : 'This will permanently delete just this one occurrence.'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.sm }}>
                    <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setSeriesConfirm(null)}>
                      <Text style={styles.confirmCancelText}>Go back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmDeleteBtn}
                      onPress={() => handleDeleteFromSheet(seriesConfirm === 'all')}
                    >
                      <Ionicons name="trash-outline" size={14} color="#fff" />
                      <Text style={styles.confirmDeleteText}>
                        {seriesConfirm === 'all' ? 'Delete all' : 'Delete this'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* View series */}
                  <TouchableOpacity style={styles.scopeOption} onPress={() => setShowSeriesSheet(true)}>
                    <View style={[styles.scopeIcon, { backgroundColor: '#f0fdf4' }]}>
                      <Ionicons name="list-outline" size={20} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scopeOptionTitle}>View series</Text>
                      <Text style={styles.scopeOptionDesc}>See all upcoming sessions in this series.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Edit this session */}
                  <TouchableOpacity style={styles.scopeOption} onPress={() => { setEditScope('one'); setShowScopeSheet(false) }}>
                    <View style={[styles.scopeIcon, { backgroundColor: '#dbeafe' }]}>
                      <Ionicons name="calendar-outline" size={20} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scopeOptionTitle}>Edit this session</Text>
                      <Text style={styles.scopeOptionDesc}>Change date, time, or details for this occurrence only.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Edit all sessions */}
                  <TouchableOpacity style={styles.scopeOption} onPress={() => { setEditScope('series'); setShowScopeSheet(false) }}>
                    <View style={[styles.scopeIcon, { backgroundColor: '#ede9fe' }]}>
                      <Ionicons name="repeat-outline" size={20} color="#7c3aed" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scopeOptionTitle}>Update all sessions</Text>
                      <Text style={styles.scopeOptionDesc}>Apply title, type, squad, or location to every session.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Cancel this session */}
                  <TouchableOpacity style={[styles.scopeOption, styles.scopeOptionDanger]} onPress={() => setSeriesConfirm('one')}>
                    <View style={[styles.scopeIcon, { backgroundColor: '#fef2f2' }]}>
                      <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeOptionTitle, { color: '#b91c1c' }]}>Cancel this session</Text>
                      <Text style={styles.scopeOptionDesc}>Remove only this occurrence from the calendar.</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Cancel all sessions */}
                  <TouchableOpacity style={[styles.scopeOption, styles.scopeOptionDanger, { marginBottom: 0 }]} onPress={() => setSeriesConfirm('all')}>
                    <View style={[styles.scopeIcon, { backgroundColor: '#fef2f2' }]}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeOptionTitle, { color: '#b91c1c' }]}>Cancel all sessions</Text>
                      <Text style={styles.scopeOptionDesc}>Delete every event in this repeating series.</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <View style={{ height: spacing.xl }} />
          </View>
        </Modal>
      )}

      {/* Series list sheet */}
      {editingEv && showScopeSheet && showSeriesSheet && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowSeriesSheet(false)}>
          <Pressable style={styles.overlay} onPress={() => setShowSeriesSheet(false)} />
          <View style={[styles.sheet, { maxHeight: '80%' }]}>
            <View style={styles.sheetHandle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 4 }}>
              <TouchableOpacity onPress={() => setShowSeriesSheet(false)} style={{ marginRight: 10 }}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.scopeTitle} numberOfLines={1}>{editingEv.title}</Text>
                <Text style={styles.seriesSheetSub}>
                  {recurrenceLabel(editingEv.recurrence)} · {events.filter(e => e.series_id === editingEv.series_id).length} sessions
                </Text>
              </View>
            </View>
            <ScrollView style={{ paddingHorizontal: spacing.md }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
              {events
                .filter(e => e.series_id === editingEv.series_id)
                .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                .map(ev => {
                  const isThis = ev.id === editingEv.id
                  const d = new Date(ev.start_time)
                  const isPast = d < new Date()
                  return (
                    <View key={ev.id} style={[styles.seriesListRow, isThis && styles.seriesListRowActive, isPast && { opacity: 0.45 }]}>
                      <View style={[styles.seriesListDot, { backgroundColor: isThis ? '#7c3aed' : colors.textMuted }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.seriesListDate, isThis && { color: '#7c3aed', fontWeight: '900' }]}>
                          {d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {isThis ? '  ← this session' : ''}
                        </Text>
                        <Text style={styles.seriesListTime}>{fmtTime(ev.start_time)}{ev.end_time ? ` – ${fmtTime(ev.end_time)}` : ''}</Text>
                      </View>
                      {isPast && <Text style={styles.seriesListPast}>Past</Text>}
                    </View>
                  )
                })}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Add event modal */}
      {showAdd && (
        <EventFormModal
          initial={defaultForm()}
          editScope="one"
          squads={squads}
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
        />
      )}

      {/* Edit event modal */}
      {editingEv && !showScopeSheet && (
        <EventFormModal
          initial={{
            title:        editingEv.title        ?? '',
            description:  editingEv.description  ?? '',
            location:     editingEv.location     ?? '',
            start_time:   editingEv.start_time   ? editingEv.start_time.slice(0, 16) : '',
            end_time:     editingEv.end_time      ? editingEv.end_time.slice(0, 16)  : '',
            event_type:   editingEv.event_type   ?? 'training',
            squad_id:     editingEv.squad_id      ? String(editingEv.squad_id) : '',
            recurrence:   editingEv.recurrence   ?? 'none',
            repeat_until: '',
          }}
          editScope={editScope}
          squads={squads}
          onClose={() => setEditingEv(null)}
          onSave={handleSave}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: font.xl, fontWeight: '900', color: colors.text },
  headerSub: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  monthName: { fontSize: font.xl, fontWeight: '900', color: colors.text },
  yearText: { fontSize: font.sm, color: colors.textMuted, marginTop: 1 },
  monthNavBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  todayBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  arrowBtns: {
    flexDirection: 'row', borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, overflow: 'hidden',
  },
  arrowBtn: {
    width: 34, height: 34, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surface,
  },

  dowRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md, marginBottom: 4,
  },
  dowCell: { width: CELL_W, alignItems: 'center' },
  dowText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },

  gridWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.border, gap: 1,
    borderRadius: 16, overflow: 'hidden',
  },
  emptyCell: { width: CELL_W, height: CELL_W * 0.9, backgroundColor: '#f8fafc' },
  dayCell: {
    width: CELL_W, height: CELL_W * 0.9,
    backgroundColor: colors.surface,
    padding: 4, alignItems: 'center',
  },
  dayCellSelected: { backgroundColor: '#f0fdf4' },
  dayCellToday: { backgroundColor: '#f0fdf4' },
  dayNum: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  dayNumToday: { backgroundColor: colors.primary },
  dayNumText: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  dayNumTextToday: { color: '#fff', fontWeight: '900' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },

  legend: {
    flexDirection: 'row', gap: 16, paddingHorizontal: spacing.md,
    paddingTop: spacing.sm, flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: font.xs, color: colors.textMuted, fontWeight: '600' },

  // Overlay + sheets
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
  sheetItemSel: { backgroundColor: colors.primaryLight },
  sheetItemText: { fontSize: font.base, color: colors.text, flex: 1, marginRight: 8 },
  sheetItemTextSel: { color: colors.primary, fontWeight: '700' },

  // Day sheet
  daySheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 24,
  },
  daySheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: spacing.sm,
  },
  daySheetDate: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary },
  daySheetCount: { fontSize: font.base, fontWeight: '900', color: colors.text, marginTop: 1 },
  daySheetBody: { padding: spacing.md },

  noEvents: { alignItems: 'center', paddingVertical: spacing.xl },
  noEventsText: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },

  // Event card
  eventCard: {
    backgroundColor: colors.surface, borderRadius: 16, marginBottom: spacing.sm,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  eventStripe: { height: 5, width: '100%' },
  eventBody: { padding: spacing.md },
  eventTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  typeBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: font.xs, fontWeight: '700' },
  squadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.borderLight, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  squadBadgeText: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  seriesBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ede9fe', borderWidth: 1, borderColor: '#c4b5fd',
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  seriesBadgeText: { fontSize: font.xs, fontWeight: '700', color: '#7c3aed' },
  daysChip: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  daysChipText: { fontSize: font.xs, fontWeight: '700' },
  eventTitle: { fontSize: font.base, fontWeight: '900', color: colors.text, marginBottom: 8 },
  timeBlock: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  timeText: { fontSize: font.sm, fontWeight: '900' },
  durationText: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  locationText: { fontSize: font.xs, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  attendanceWrap: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  attendanceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  attendanceLabel: { fontSize: font.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  attendanceCount: { fontSize: font.xs, color: colors.textMuted },
  rsvpCounts: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  rsvpCountItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rsvpCountNum: { fontSize: font.sm, fontWeight: '900' },
  rsvpCountLabel: { fontSize: font.xs, color: colors.textMuted },
  rsvpBar: { height: 6, borderRadius: 3, backgroundColor: colors.borderLight, flexDirection: 'row', overflow: 'hidden' },
  rsvpBarFill: { height: '100%' },
  managerActions: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingVertical: 10, backgroundColor: colors.surface,
  },
  editBtnText: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderColor: '#fecaca', borderRadius: 10,
    paddingVertical: 10, backgroundColor: '#fef2f2',
  },
  deleteBtnText: { fontSize: font.sm, fontWeight: '700', color: colors.error },
  delConfirm: {
    marginTop: spacing.sm, backgroundColor: '#fef2f2', borderRadius: 10,
    padding: spacing.sm + 4, borderWidth: 1, borderColor: '#fecaca',
  },
  delConfirmText: { fontSize: font.sm, fontWeight: '700', color: '#b91c1c', marginBottom: 8 },
  delConfirmBtns: { flexDirection: 'row', gap: 8 },
  delBtnRed: { flex: 1, backgroundColor: colors.error, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  delBtnOrange: { flex: 1, backgroundColor: '#f97316', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  delBtnText: { color: '#fff', fontSize: font.xs, fontWeight: '700' },
  delBtnCancel: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  delBtnCancelText: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  myRsvpBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
  },
  myRsvpText: { flex: 1, fontSize: font.xs },
  tapToChange: { fontSize: 10, color: colors.textMuted },
  rsvpBtns: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  rsvpBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  rsvpBtnText: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary },

  // Scope / series sheet
  seriesSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  seriesSheetIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  seriesSheetSub: { fontSize: font.xs, color: '#7c3aed', marginTop: 2, fontWeight: '600' },
  scopeTitle: { fontSize: font.lg, fontWeight: '900', color: colors.text },
  scopeSubtitle: { fontSize: font.sm, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
  scopeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 14,
    padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface,
  },
  scopeOptionDanger: { borderColor: '#fecaca', backgroundColor: '#fff5f5' },
  scopeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scopeOptionTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  scopeOptionDesc: { fontSize: font.xs, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  seriesConfirmBox: {
    borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 14,
    backgroundColor: '#fff5f5', padding: spacing.md,
  },
  seriesConfirmTitle: { fontSize: font.base, fontWeight: '900', color: '#b91c1c', marginBottom: 6 },
  seriesConfirmDesc: { fontSize: font.sm, color: '#ef4444', lineHeight: 18 },
  confirmCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center', backgroundColor: colors.surface,
  },
  confirmCancelText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },
  confirmDeleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 11,
  },
  confirmDeleteText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
  seriesListRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  seriesListRowActive: { backgroundColor: '#faf5ff', marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, borderRadius: 10 },
  seriesListDot: { width: 10, height: 10, borderRadius: 5 },
  seriesListDate: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  seriesListTime: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  seriesListPast: { fontSize: 10, color: colors.textMuted, fontWeight: '600', backgroundColor: colors.borderLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: font.lg, fontWeight: '900', color: colors.text },
  modalSubtitle: { fontSize: font.xs, color: '#7c3aed', marginTop: 3, lineHeight: 16 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { padding: spacing.md },
  modalFooter: {
    flexDirection: 'row', gap: 12, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
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

  fieldLabel: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: spacing.sm, marginTop: spacing.md,
  },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: font.base, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: spacing.sm },

  dropBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  dropBtnText: { flex: 1, fontSize: font.base, color: colors.text },

  dtRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.sm, alignItems: 'center' },
  dtBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 12, backgroundColor: colors.surface,
  },
  dtBtnText: { fontSize: font.sm, color: colors.text, flex: 1 },

  occCount: { fontSize: font.sm, color: colors.primary, fontWeight: '700', marginBottom: spacing.sm },
})
