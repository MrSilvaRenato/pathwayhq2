import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Pressable,
  TextInput, Switch, Image, Alert, ActivityIndicator,
  StyleSheet, RefreshControl, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'

const CATEGORIES = [
  { value: 'competition', label: 'Competition',    emoji: '🏆', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  { value: 'award',       label: 'Award',          emoji: '⭐', bg: '#fefce8', border: '#fef08a', text: '#713f12' },
  { value: 'sponsorship', label: 'Sponsorship',    emoji: '🤝', bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  { value: 'facility',    label: 'Facility',       emoji: '🏗️', bg: '#f8fafc', border: '#e2e8f0', text: '#334155' },
  { value: 'milestone',   label: 'Club Milestone', emoji: '🎯', bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  { value: 'other',       label: 'Other',          emoji: '📌', bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
]

const catMeta = (val) => CATEGORIES.find(c => c.value === val) ?? CATEGORIES[CATEGORIES.length - 1]

const BLANK = { title: '', description: '', category: 'competition', achieved_at: '', image_url: '', is_public: true }

function fmtMonthYear(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

function TrophyCard({ trophy, isManager, onEdit, onDelete, onTogglePublic }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling] = useState(false)
  const cat = catMeta(trophy.category)

  async function handleToggle() {
    setToggling(true)
    await onTogglePublic(trophy.id, !trophy.is_public)
    setToggling(false)
  }

  return (
    <View style={[styles.card, { backgroundColor: cat.bg, borderColor: cat.border }]}>
      {trophy.image_url ? (
        <View style={styles.cardImageWrap}>
          <Image source={{ uri: trophy.image_url }} style={styles.cardImage} resizeMode="contain" />
        </View>
      ) : null}

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardCatRow}>
            <Text style={styles.cardEmoji}>{cat.emoji}</Text>
            <Text style={[styles.cardCatLabel, { color: cat.text }]}>{cat.label.toUpperCase()}</Text>
          </View>
          {isManager && !confirmDelete ? (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.publicChip, trophy.is_public ? styles.publicChipOn : styles.publicChipOff]}
                onPress={handleToggle}
                disabled={toggling}
                activeOpacity={0.7}
              >
                {toggling
                  ? <ActivityIndicator size="small" color={trophy.is_public ? '#059669' : '#94a3b8'} />
                  : <>
                    <Ionicons name={trophy.is_public ? 'globe-outline' : 'lock-closed-outline'} size={11} color={trophy.is_public ? '#059669' : '#94a3b8'} />
                    <Text style={[styles.publicChipText, { color: trophy.is_public ? '#059669' : '#94a3b8' }]}>
                      {trophy.is_public ? 'Public' : 'Private'}
                    </Text>
                  </>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(trophy)} activeOpacity={0.7}>
                <Ionicons name="pencil-outline" size={15} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setConfirmDelete(true)} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={15} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Text style={styles.cardTitle}>{trophy.title}</Text>
        {trophy.description ? (
          <Text style={styles.cardDesc} numberOfLines={3}>{trophy.description}</Text>
        ) : null}
        {trophy.achieved_at ? (
          <Text style={styles.cardDate}>{fmtMonthYear(trophy.achieved_at)}</Text>
        ) : null}

        {isManager && confirmDelete ? (
          <View style={styles.deleteConfirm}>
            <Text style={styles.deleteConfirmText}>Delete this trophy?</Text>
            <View style={styles.deleteConfirmBtns}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setConfirmDelete(false)}>
                <Text style={styles.deleteCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteYesBtn} onPress={() => { setConfirmDelete(false); onDelete(trophy.id) }}>
                <Text style={styles.deleteYesText}>Yes, delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  )
}

function TrophyModal({ trophy, onClose, onSaved }) {
  const isEdit = !!trophy
  const [form, setForm] = useState(
    trophy
      ? { ...trophy, achieved_at: trophy.achieved_at ? trophy.achieved_at.slice(0, 10) : '' }
      : { ...BLANK }
  )
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dateValue = form.achieved_at ? new Date(form.achieved_at) : new Date()

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to upload images.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', { uri: asset.uri, name: asset.fileName ?? 'photo.jpg', type: asset.mimeType ?? 'image/jpeg' })
      fd.append('folder', 'trophies')
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(p => ({ ...p, image_url: data.url }))
    } catch {
      Alert.alert('Upload failed', 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) { Alert.alert('Required', 'Please enter a title.'); return }
    setSaving(true)
    const payload = { ...form, achieved_at: form.achieved_at || null }
    try {
      if (isEdit) {
        await api.put(`/club-trophies/${trophy.id}`, payload)
      } else {
        await api.post('/club-trophies', payload)
      }
      onSaved()
    } catch {
      Alert.alert('Error', 'Failed to save trophy.')
      setSaving(false)
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{isEdit ? 'Edit trophy' : 'Add achievement'}</Text>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.catBtn, form.category === c.value && styles.catBtnActive]}
                onPress={() => setForm(p => ({ ...p, category: c.value }))}
                activeOpacity={0.7}
              >
                <Text style={styles.catBtnEmoji}>{c.emoji}</Text>
                <Text style={[styles.catBtnLabel, form.category === c.value && styles.catBtnLabelActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={v => setForm(p => ({ ...p, title: v }))}
            placeholder="e.g. State League Champions 2024"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.description}
            onChangeText={v => setForm(p => ({ ...p, description: v }))}
            placeholder="Tell the story of this achievement…"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>Month & Year</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.dateBtnText, !form.achieved_at && { color: colors.textMuted }]}>
              {form.achieved_at ? fmtMonthYear(form.achieved_at) : 'Select month & year'}
            </Text>
            {form.achieved_at ? (
              <TouchableOpacity onPress={() => setForm(p => ({ ...p, achieved_at: '' }))} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, selected) => {
                if (Platform.OS === 'android') setShowDatePicker(false)
                if (selected) setForm(p => ({ ...p, achieved_at: selected.toISOString().slice(0, 10) }))
              }}
            />
          )}

          <Text style={styles.fieldLabel}>Photo</Text>
          {form.image_url ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: form.image_url }} style={styles.previewImg} resizeMode="contain" />
              <TouchableOpacity style={styles.removeImgBtn} onPress={() => setForm(p => ({ ...p, image_url: '' }))}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadZone} onPress={pickImage} disabled={uploading} activeOpacity={0.7}>
              {uploading
                ? <ActivityIndicator color={colors.textMuted} />
                : <Ionicons name="image-outline" size={24} color={colors.textMuted} />
              }
              <Text style={styles.uploadZoneText}>{uploading ? 'Uploading…' : 'Tap to upload photo'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.publicRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.publicLabel}>Show on public club profile</Text>
              <Text style={styles.publicSub}>Displays in your club's trophy cabinet for visitors</Text>
            </View>
            <Switch
              value={form.is_public}
              onValueChange={v => setForm(p => ({ ...p, is_public: v }))}
              trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
              thumbColor={form.is_public ? colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>{isEdit ? 'Save changes' : 'Add to cabinet'}</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

export default function TrophyCabinetScreen() {
  const { user } = useAuth()
  const isManager = user?.role === 'club_admin' || user?.role === 'coach'

  const [trophies, setTrophies] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    try {
      const { data } = await api.get('/club-trophies')
      setTrophies(Array.isArray(data) ? data : [])
    } catch {
      Alert.alert('Error', 'Failed to load trophies.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const onRefresh = useCallback(() => { setRefreshing(true); load() }, [])

  async function handleDelete(id) {
    try {
      await api.delete(`/club-trophies/${id}`)
      setTrophies(p => p.filter(t => t.id !== id))
    } catch {
      Alert.alert('Error', 'Failed to delete.')
    }
  }

  async function handleTogglePublic(id, value) {
    const t = trophies.find(x => x.id === id)
    if (!t) return
    try {
      await api.put(`/club-trophies/${id}`, { ...t, is_public: value })
      setTrophies(p => p.map(x => x.id === id ? { ...x, is_public: value } : x))
    } catch {
      Alert.alert('Error', 'Failed to update.')
    }
  }

  async function handleSaved() {
    setShowModal(false)
    setEditing(null)
    setLoading(true)
    await load()
  }

  const grouped = CATEGORIES.map(c => ({
    ...c,
    items: trophies.filter(t => t.category === c.value),
  })).filter(g => g.items.length > 0)

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Trophy Cabinet</Text>
            <Text style={styles.pageSub}>{trophies.length} achievement{trophies.length !== 1 ? 's' : ''} · club history</Text>
          </View>
          {isManager ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => { setEditing(null); setShowModal(true) }} activeOpacity={0.8}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {trophies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>No achievements yet</Text>
            <Text style={styles.emptyDesc}>Add competition wins, sponsorships, facility upgrades and more.</Text>
            {isManager ? (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add first achievement</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          grouped.map(group => (
            <View key={group.value} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupEmoji}>{group.emoji}</Text>
                <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
                <Text style={styles.groupCount}>({group.items.length})</Text>
              </View>
              {group.items.map(t => (
                <TrophyCard
                  key={t.id}
                  trophy={t}
                  isManager={isManager}
                  onEdit={t => { setEditing(t); setShowModal(true) }}
                  onDelete={handleDelete}
                  onTogglePublic={handleTogglePublic}
                />
              ))}
            </View>
          ))
        )}

        <View style={{ height: spacing.xl * 2 }} />
      </ScrollView>

      {showModal ? (
        <TrophyModal
          trophy={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md },

  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  pageTitle: { fontSize: font.xl, fontWeight: '900', color: colors.text },
  pageSub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },

  emptyState: { alignItems: 'center', paddingVertical: 48, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radius.xl, marginTop: spacing.md },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: font.lg, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  emptyDesc: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md, lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },

  group: { marginBottom: spacing.lg },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  groupEmoji: { fontSize: 18 },
  groupLabel: { fontSize: font.xs, fontWeight: '900', color: '#475569', letterSpacing: 1 },
  groupCount: { fontSize: font.xs, color: colors.textMuted, fontWeight: '600' },

  card: { borderWidth: 1.5, borderRadius: radius.lg, marginBottom: spacing.sm, overflow: 'hidden' },
  cardImageWrap: { height: 160, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: '100%', height: '100%' },
  cardBody: { padding: spacing.md },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  cardCatRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardEmoji: { fontSize: 18 },
  cardCatLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  publicChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 28, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1,
  },
  publicChipOn: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  publicChipOff: { backgroundColor: '#fff', borderColor: colors.border },
  publicChipText: { fontSize: 10, fontWeight: '700' },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.7)' },
  cardTitle: { fontSize: font.base, fontWeight: '900', color: colors.text, marginBottom: 4 },
  cardDesc: { fontSize: font.sm, color: '#64748b', lineHeight: 19, marginBottom: 4 },
  cardDate: { fontSize: font.xs, color: '#94a3b8', fontWeight: '600', marginTop: 4 },
  deleteConfirm: { marginTop: spacing.sm, borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, backgroundColor: '#fef2f2', padding: spacing.sm },
  deleteConfirmText: { fontSize: font.sm, fontWeight: '700', color: '#b91c1c', marginBottom: 8 },
  deleteConfirmBtns: { flexDirection: 'row', gap: 8 },
  deleteCancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  deleteCancelText: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  deleteYesBtn: { flex: 1, backgroundColor: colors.error, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteYesText: { fontSize: font.xs, fontWeight: '700', color: '#fff' },

  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: font.lg, fontWeight: '900', color: colors.text },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: spacing.md },
  modalFooter: {
    flexDirection: 'row', gap: 12, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.base },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },

  fieldLabel: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: spacing.sm, marginTop: spacing.md,
  },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: font.base, color: colors.text, backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  catBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 10, backgroundColor: colors.surface,
  },
  catBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  catBtnEmoji: { fontSize: 18 },
  catBtnLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, flex: 1 },
  catBtnLabelActive: { color: colors.primaryDark },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  dateBtnText: { flex: 1, fontSize: font.base, color: colors.text },

  imagePreview: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm, position: 'relative' },
  previewImg: { width: '100%', height: 180, backgroundColor: '#0f172a' },
  removeImgBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadZone: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radius.md,
    height: 112, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#f8fafc', marginBottom: spacing.sm,
  },
  uploadZoneText: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },

  publicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  publicLabel: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  publicSub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
})
