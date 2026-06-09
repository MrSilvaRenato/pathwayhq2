import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import ImageUpload from '../../components/ImageUpload'
import UpgradeSheet, { parseUpgradeError } from '../../components/UpgradeSheet'

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES = {
  match:    { label: 'Match Day',   emoji: '⚽', color: '#059669', light: '#d1fae5', text: '#065f46' },
  training: { label: 'Training',    emoji: '💪', color: '#2563eb', light: '#dbeafe', text: '#1e3a8a' },
  news:     { label: 'Club News',   emoji: '📰', color: '#7c3aed', light: '#ede9fe', text: '#4c1d95' },
  camp:     { label: 'Camp / Trip', emoji: '🏕️', color: '#d97706', light: '#fef3c7', text: '#92400e' },
  urgent:   { label: 'Urgent',      emoji: '🚨', color: '#dc2626', light: '#fee2e2', text: '#7f1d1d' },
  general:  { label: 'General',     emoji: '📢', color: '#475569', light: '#f1f5f9', text: '#1e293b' },
}

const QUICK_EMOJIS = [
  '⚽','🏆','🥇','💪','🔥','🎯','🎉','🌟',
  '🏃','👊','🏅','🎊','📢','🚨','🏕️','📰',
  '👏','✅','❤️','⚡','🤝','💬','📅','🎽',
]

const BLANK_FORM = { title: '', body: '', category: 'general', emoji: '', image_url: '', pinned: false }

const FILTER_OPTIONS = [
  { value: 'all',      label: 'All categories' },
  { value: 'match',    label: '⚽  Match Day' },
  { value: 'training', label: '💪  Training' },
  { value: 'news',     label: '📰  Club News' },
  { value: 'camp',     label: '🏕️  Camp / Trip' },
  { value: 'urgent',   label: '🚨  Urgent' },
  { value: 'general',  label: '📢  General' },
]

function fmtDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const diffDays = Math.floor((Date.now() - d) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return `${diffDays} days ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

// ── Filter dropdown ────────────────────────────────────────────────────────────
function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const selected = FILTER_OPTIONS.find(o => o.value === value)
  return (
    <>
      <TouchableOpacity style={styles.filterBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.filterBtnText}>{selected?.label ?? 'All categories'}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent statusBarTranslucent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom || 16 }]}>
          <View style={styles.sheetHandle} />
          {FILTER_OPTIONS.map(opt => {
            const isSelected = opt.value === value
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sheetItem, isSelected && styles.sheetItemSelected]}
                onPress={() => { onChange(opt.value); setOpen(false) }}
              >
                <Text style={[styles.sheetItemText, isSelected && styles.sheetItemTextSelected]}>
                  {opt.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </Modal>
    </>
  )
}

// ── Announcement card ──────────────────────────────────────────────────────────
function AnnouncementCard({ item, isManager, onEdit, onDelete, onTogglePin }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cat = CATEGORIES[item.category] ?? CATEGORIES.general
  const emoji = item.emoji || cat.emoji
  const body = item.body ?? item.content ?? ''
  const BODY_LIMIT = 280
  const bodyLong = body.length > BODY_LIMIT
  const bodyText = bodyLong && !expanded ? body.slice(0, BODY_LIMIT).trimEnd() + '…' : body

  return (
    <View style={[styles.card, item.pinned && styles.cardPinned]}>

      {/* Coloured header */}
      <View style={[styles.cardHeader, { backgroundColor: cat.color }]}>
        <View style={styles.cardHeaderCircle} />

        {/* Top row: badge + admin actions */}
        <View style={styles.cardHeaderTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{emoji}  {cat.label}</Text>
            </View>
            {item.pinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={10} color="#fff" />
                <Text style={styles.pinnedBadgeText}>Pinned</Text>
              </View>
            )}
          </View>
          {isManager && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => onTogglePin(item)}>
                <Ionicons name={item.pinned ? 'pin' : 'pin-outline'} size={14} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => onEdit(item)}>
                <Ionicons name="pencil-outline" size={14} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: 'rgba(220,38,38,0.5)' }]}
                onPress={() => setConfirmDelete(true)}
              >
                <Ionicons name="trash-outline" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Emoji + title + meta */}
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>
          {item.author_name ? `${item.author_name} · ` : ''}{fmtDate(item.posted_at ?? item.created_at)}
        </Text>
      </View>

      {/* Body */}
      {(body || confirmDelete) ? (
        <View style={styles.cardBody}>
          {body ? (
            <>
              <TouchableOpacity onPress={() => bodyLong && setExpanded(v => !v)} activeOpacity={bodyLong ? 0.7 : 1}>
                <Text style={styles.cardBodyText}>{bodyText}</Text>
              </TouchableOpacity>
              {bodyLong && (
                <TouchableOpacity onPress={() => setExpanded(v => !v)} style={styles.readMoreBtn}>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={colors.primary} />
                  <Text style={styles.readMoreText}>{expanded ? 'Show less' : 'Read more'}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}

          {confirmDelete && (
            <View style={styles.deleteConfirm}>
              <Text style={styles.deleteConfirmText}>Delete this post?</Text>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setConfirmDelete(false)}>
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={() => { setConfirmDelete(false); onDelete(item.id) }}
              >
                <Text style={styles.deleteConfirmBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}
    </View>
  )
}

// ── Compose / Edit modal ───────────────────────────────────────────────────────
function ComposeModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? { ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showImage, setShowImage] = useState(!!(initial?.image_url))
  const isEditing = !!initial

  const cat = CATEGORIES[form.category] ?? CATEGORIES.general
  const displayEmoji = form.emoji || cat.emoji
  const previewReady = form.title.trim() || form.body.trim()

  async function handleSubmit() {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Required', 'Title and message are required.')
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, emoji: form.emoji || null, image_url: form.image_url || null })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.modalSafe}>

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit post' : 'New announcement'}</Text>
              <Text style={styles.modalSubtitle}>Share news with your club members</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* Category grid 3×2 */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {Object.entries(CATEGORIES).map(([key, meta]) => {
                const isActive = form.category === key
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryCell,
                      isActive && { borderColor: meta.color, backgroundColor: meta.light },
                    ]}
                    onPress={() => setForm(p => ({ ...p, category: key }))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryCellEmoji}>{meta.emoji}</Text>
                    <Text style={[styles.categoryCellLabel, isActive && { color: meta.text }]}>
                      {meta.label}
                    </Text>
                    {isActive && (
                      <View style={[styles.categoryCellCheck, { backgroundColor: meta.color }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Emoji */}
            <View style={styles.emojiRow}>
              <Text style={styles.fieldLabel}>Emoji</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 26 }}>{displayEmoji}</Text>
                <TouchableOpacity onPress={() => setShowEmoji(v => !v)}>
                  <Text style={styles.emojiChangeBtn}>{showEmoji ? 'Close' : 'Change'}</Text>
                </TouchableOpacity>
                {form.emoji ? (
                  <TouchableOpacity onPress={() => setForm(p => ({ ...p, emoji: '' }))}>
                    <Text style={styles.emojiResetBtn}>Reset</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {showEmoji && (
              <View style={styles.emojiGrid}>
                {QUICK_EMOJIS.map(em => (
                  <TouchableOpacity
                    key={em}
                    style={[styles.emojiCell, form.emoji === em && styles.emojiCellActive]}
                    onPress={() => { setForm(p => ({ ...p, emoji: em })); setShowEmoji(false) }}
                  >
                    <Text style={{ fontSize: 22 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Title */}
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
              placeholder='e.g. "Match Day vs North Shore FC 🔥"'
              placeholderTextColor={colors.textMuted}
            />

            {/* Body */}
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.body}
              onChangeText={v => setForm(p => ({ ...p, body: v }))}
              multiline
              textAlignVertical="top"
              placeholder="Write your announcement here… Share details, hype up the team, or give an update."
              placeholderTextColor={colors.textMuted}
            />

            {/* Hero image upload */}
            <TouchableOpacity style={styles.imageToggleRow} onPress={() => setShowImage(v => !v)}>
              <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.imageToggleText}>
                {showImage ? 'Hide hero image' : 'Add hero image'}
              </Text>
              <Ionicons name={showImage ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
            </TouchableOpacity>
            {showImage && (
              <ImageUpload
                type="announcement"
                value={form.image_url || null}
                onChange={url => setForm(p => ({ ...p, image_url: url ?? '' }))}
              />
            )}

            {/* Pin toggle */}
            <TouchableOpacity
              style={styles.pinRow}
              onPress={() => setForm(p => ({ ...p, pinned: !p.pinned }))}
              activeOpacity={0.8}
            >
              <View style={[styles.toggle, form.pinned && styles.toggleOn]}>
                <View style={[styles.toggleThumb, form.pinned && styles.toggleThumbOn]} />
              </View>
              <View>
                <Text style={styles.pinLabel}>📌  Pin to top</Text>
                <Text style={styles.pinDesc}>Pinned posts always appear first</Text>
              </View>
            </TouchableOpacity>

            {/* Live preview */}
            {previewReady ? (
              <View>
                <Text style={styles.fieldLabel}>Preview</Text>
                <View style={[styles.previewCard, { borderColor: form.pinned ? '#f59e0b' : colors.border }]}>
                  <View style={[styles.previewHeader, { backgroundColor: cat.color }]}>
                    <View style={styles.previewCircle} />
                    <Text style={styles.previewCatLabel}>{cat.label}</Text>
                    {form.pinned && <Text style={styles.previewPinned}>📌 Pinned</Text>}
                    <Text style={{ fontSize: 28, marginTop: 6 }}>{displayEmoji}</Text>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {form.title || 'Your title…'}
                    </Text>
                  </View>
                  {form.body ? (
                    <View style={styles.previewBody}>
                      <Text style={styles.previewBodyText} numberOfLines={2}>{form.body}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postBtn, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.postBtnText}>
                  {isEditing ? 'Save changes' : '📣  Post'}
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
export default function AnnouncementsScreen() {
  const { user } = useAuth()
  const isManager = user?.role === 'club_admin' || user?.role === 'coach'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [upgrade, setUpgrade] = useState(null)

  async function load() {
    try {
      const r = await api.get('/announcements')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setItems(list)
    } catch {
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  const onRefresh = useCallback(() => { setRefreshing(true); load() }, [])

  async function handleSave(form) {
    try {
      if (editItem) {
        await api.put(`/announcements/${editItem.id}`, form)
      } else {
        await api.post('/announcements', form)
      }
      setShowModal(false)
      setEditItem(null)
      load()
    } catch (e) {
      const up = parseUpgradeError(e)
      if (up) {
        setShowModal(false)
        setEditItem(null)
        setUpgrade(up)
      } else {
        Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save.')
      }
      throw e
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/announcements/${id}`)
      setItems(p => p.filter(a => a.id !== id))
    } catch {
      Alert.alert('Error', 'Failed to delete.')
    }
  }

  async function handleTogglePin(item) {
    try {
      await api.put(`/announcements/${item.id}`, {
        title: item.title, body: item.body,
        category: item.category, emoji: item.emoji,
        image_url: item.image_url, pinned: !item.pinned,
      })
      setItems(p =>
        p.map(x => x.id === item.id ? { ...x, pinned: !x.pinned } : x)
          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      )
    } catch {
      Alert.alert('Error', 'Failed to update pin.')
    }
  }

  function openEdit(item) {
    setEditItem(item)
    setShowModal(true)
  }

  const visible = filter === 'all' ? items : items.filter(a => a.category === filter)

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Text style={styles.headerCount}>{items.length} post{items.length !== 1 ? 's' : ''}</Text>
        </View>
        {isManager && (
          <TouchableOpacity style={styles.newBtn} onPress={() => { setEditItem(null); setShowModal(true) }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.newBtnText}>New post</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter dropdown */}
      {items.length > 0 && (
        <View style={styles.filterRow}>
          <FilterDropdown value={filter} onChange={setFilter} />
          {filter !== 'all' && (
            <TouchableOpacity onPress={() => setFilter('all')} style={styles.clearFilter}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List / empty */}
      {visible.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="megaphone-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>
            {filter !== 'all'
              ? `No ${CATEGORIES[filter]?.label ?? filter} posts yet`
              : 'No announcements yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isManager
              ? 'Post your first announcement to keep the club in the loop.'
              : "Your club hasn't posted anything yet — check back soon!"}
          </Text>
          {isManager && filter === 'all' && (
            <TouchableOpacity
              style={[styles.newBtn, { marginTop: spacing.md }]}
              onPress={() => { setEditItem(null); setShowModal(true) }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.newBtnText}>Write first post</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <AnnouncementCard
              item={item}
              isManager={isManager}
              onEdit={openEdit}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          )}
        />
      )}

      {/* Compose modal */}
      {showModal && (
        <ComposeModal
          initial={editItem ? {
            title:     editItem.title     ?? '',
            body:      editItem.body      ?? editItem.content ?? '',
            category:  editItem.category  ?? 'general',
            emoji:     editItem.emoji     ?? '',
            image_url: editItem.image_url ?? '',
            pinned:    editItem.pinned    ?? false,
          } : null}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: font.xl, fontWeight: '900', color: colors.text },
  headerCount: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },

  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: 8,
  },
  filterBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10,
  },
  filterBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  clearFilter: { padding: 4 },

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
  sheetItemText: { fontSize: font.base, color: colors.text },
  sheetItemTextSelected: { color: colors.primary, fontWeight: '700' },

  listContent: { padding: spacing.md, paddingTop: 4, paddingBottom: spacing.xl },

  // Card
  card: {
    backgroundColor: colors.surface, borderRadius: 20,
    marginBottom: spacing.sm, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  cardPinned: { borderColor: '#f59e0b', borderWidth: 1.5 },
  cardHeader: { padding: spacing.md, overflow: 'hidden', position: 'relative' },
  cardHeaderCircle: {
    position: 'absolute', right: -16, top: -24,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardHeaderTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  catBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  catBadgeText: { fontSize: font.xs, fontWeight: '700', color: '#fff' },
  pinnedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#f59e0b', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pinnedBadgeText: { fontSize: font.xs, fontWeight: '700', color: '#fff' },
  headerIconBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardEmoji: { fontSize: 36, marginBottom: 4 },
  cardTitle: { fontSize: font.lg, fontWeight: '900', color: '#fff', lineHeight: 24 },
  cardMeta: { fontSize: font.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  cardBody: { padding: spacing.md },
  cardBodyText: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 20 },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  readMoreText: { fontSize: font.xs, color: colors.primary, fontWeight: '700' },

  deleteConfirm: {
    marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    backgroundColor: '#fef2f2', borderRadius: 12, padding: spacing.sm + 4,
    gap: 8, borderWidth: 1, borderColor: '#fecaca',
  },
  deleteConfirmText: { flex: 1, fontSize: font.sm, fontWeight: '600', color: '#b91c1c', minWidth: 120 },
  deleteCancelBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff',
  },
  deleteCancelText: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  deleteConfirmBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.error,
  },
  deleteConfirmBtnText: { fontSize: font.xs, fontWeight: '700', color: '#fff' },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, marginTop: spacing.xl,
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: font.lg, fontWeight: '900', color: colors.text },
  modalSubtitle: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { padding: spacing.md, paddingBottom: spacing.xl },

  fieldLabel: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: spacing.sm, marginTop: spacing.md,
  },

  // 3×2 category grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCell: {
    width: '31%', borderRadius: 12, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: '#f8fafc',
    padding: 10, alignItems: 'flex-start', position: 'relative',
  },
  categoryCellEmoji: { fontSize: 20, marginBottom: 4 },
  categoryCellLabel: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  categoryCellCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },

  emojiRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: spacing.md,
  },
  emojiChangeBtn: { fontSize: font.sm, color: colors.primary, fontWeight: '700' },
  emojiResetBtn: { fontSize: font.sm, color: colors.textMuted },
  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    backgroundColor: colors.background, borderRadius: 12,
    padding: spacing.sm, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  emojiCell: {
    width: 44, height: 44, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  emojiCellActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2, borderColor: colors.primary,
  },

  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: font.base, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },

  imageToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: spacing.sm, marginBottom: spacing.sm,
  },
  imageToggleText: { flex: 1, fontSize: font.sm, fontWeight: '700', color: colors.textSecondary },

  pinRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginTop: spacing.sm, marginBottom: spacing.sm,
  },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: '#f59e0b' },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  pinLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  pinDesc: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },

  previewCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5 },
  previewHeader: { padding: spacing.md, overflow: 'hidden', position: 'relative' },
  previewCircle: {
    position: 'absolute', right: -8, top: -16,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  previewCatLabel: { fontSize: font.xs, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  previewPinned: { fontSize: font.xs, color: '#fde68a', marginBottom: 2 },
  previewTitle: { fontSize: font.sm, fontWeight: '900', color: '#fff', marginTop: 4, lineHeight: 18 },
  previewBody: { backgroundColor: colors.surface, padding: spacing.sm + 4 },
  previewBodyText: { fontSize: font.xs, color: colors.textSecondary, lineHeight: 18 },

  modalFooter: {
    flexDirection: 'row', gap: 12, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.base },
  postBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },
})
