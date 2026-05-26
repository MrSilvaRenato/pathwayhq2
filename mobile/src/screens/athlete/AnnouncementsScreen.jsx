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

const CATEGORIES = [
  { value: 'general',   label: 'General'   },
  { value: 'match_day', label: 'Match Day' },
  { value: 'training',  label: 'Training'  },
  { value: 'club_news', label: 'Club News' },
  { value: 'camp',      label: 'Camp'      },
  { value: 'urgent',    label: 'Urgent'    },
]

function catColor(cat) {
  const map = { urgent: 'red', match_day: 'green', training: 'blue', camp: 'blue', club_news: 'blue', general: 'slate' }
  return map[cat] ?? 'slate'
}

function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

const BLANK = { title: '', body: '', category: 'general', pinned: false }

function AnnouncementCard({ item, isManager, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const body = item.body ?? item.content ?? ''
  const isLong = body.length > 180

  return (
    <View style={[styles.card, item.pinned && styles.cardPinned]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          {item.pinned ? <Ionicons name="pin" size={13} color={colors.primary} style={{ marginRight: 4, marginTop: 2 }} /> : null}
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {item.category ? <Badge label={CATEGORIES.find(c => c.value === item.category)?.label ?? item.category} color={catColor(item.category)} /> : null}
          {isManager && (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}>
                <Ionicons name="pencil-outline" size={14} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={14} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => isLong && setExpanded(v => !v)} activeOpacity={isLong ? 0.8 : 1}>
        <Text style={styles.cardBody} numberOfLines={expanded ? undefined : 3}>{body}</Text>
      </TouchableOpacity>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{formatDate(item.posted_at ?? item.created_at)}</Text>
        {item.author_name ? <Text style={styles.cardAuthor}>{item.author_name}</Text> : null}
        {isLong ? <Text style={styles.expandLink}>{expanded ? 'Show less' : 'Read more'}</Text> : null}
      </View>
    </View>
  )
}

export default function AnnouncementsScreen() {
  const { user } = useAuth()
  const isManager = user?.role === 'club_admin' || user?.role === 'coach'
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  async function fetchAnnouncements() {
    try {
      const r = await api.get('/announcements')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setAnnouncements(list)
    } catch {
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAnnouncements() }, [])
  const onRefresh = useCallback(() => { setRefreshing(true); fetchAnnouncements() }, [])

  function openAdd() {
    setForm(BLANK)
    setEditItem(null)
    setShowModal(true)
  }

  function openEdit(item) {
    setForm({
      title: item.title ?? '',
      body: item.body ?? item.content ?? '',
      category: item.category ?? 'general',
      pinned: !!item.pinned,
    })
    setEditItem(item)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Required', 'Title and message are required.')
      return
    }
    setSaving(true)
    try {
      if (editItem) {
        const { data } = await api.put(`/announcements/${editItem.id}`, form)
        setAnnouncements(p => p.map(a => a.id === editItem.id ? { ...a, ...data } : a))
      } else {
        const { data } = await api.post('/announcements', form)
        setAnnouncements(p => [data, ...p])
      }
      setShowModal(false)
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(item) {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/announcements/${item.id}`)
          setAnnouncements(p => p.filter(a => a.id !== item.id))
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.message ?? 'Failed.')
        }
      }},
    ])
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {isManager && (
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>New Post</Text>
          </TouchableOpacity>
        </View>
      )}

      {announcements.length === 0 ? (
        <EmptyState iconName="megaphone-outline" title="No announcements" subtitle={isManager ? 'Tap "New Post" to create your first announcement.' : 'Your club hasn\'t posted any announcements yet.'} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <AnnouncementCard item={item} isManager={isManager} onEdit={openEdit} onDelete={handleDelete} />
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editItem ? 'Edit Post' : 'New Post'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Announcement title" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c.value}
                    style={[styles.chip, form.category === c.value && styles.chipActive]}
                    onPress={() => setForm(p => ({ ...p, category: c.value }))}
                  >
                    <Text style={[styles.chipText, form.category === c.value && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Message *</Text>
              <TextInput
                style={[styles.input, { minHeight: 120 }]}
                value={form.body}
                onChangeText={v => setForm(p => ({ ...p, body: v }))}
                placeholder="Write your announcement…"
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.pinRow} onPress={() => setForm(p => ({ ...p, pinned: !p.pinned }))}>
                <View style={[styles.toggle, form.pinned && styles.toggleOn]}>
                  <View style={[styles.toggleThumb, form.pinned && styles.toggleThumbOn]} />
                </View>
                <Text style={styles.toggleLabel}>Pin to top</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editItem ? 'Save' : 'Post'}</Text>}
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
  topBar: { padding: spacing.md, paddingBottom: spacing.sm, alignItems: 'flex-end' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  content: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md,
    marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardPinned: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { flex: 1, fontSize: font.base, fontWeight: '700', color: colors.text },
  actionsRow: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  cardBody: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 21 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  cardDate: { fontSize: font.xs, color: colors.textMuted },
  cardAuthor: { fontSize: font.xs, color: colors.textMuted },
  expandLink: { fontSize: font.xs, color: colors.primary, fontWeight: '600', marginLeft: 'auto' },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  modalBody: { padding: spacing.md },
  fieldLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: font.base, color: colors.text, backgroundColor: '#fafafa', marginBottom: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.sm, marginBottom: spacing.md },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg, paddingBottom: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.base },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },
})
