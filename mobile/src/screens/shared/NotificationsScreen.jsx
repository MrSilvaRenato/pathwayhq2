import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert, Modal,
  ScrollView, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { colors, font, spacing, radius } from '../../lib/theme'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(str) {
  if (!str) return ''
  const d = new Date(str)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function iconForNotification(n) {
  if (n.type === 'broadcast') return { name: 'megaphone', color: '#10b981' }
  const link = n.link ?? ''
  if (link.includes('milestone') || link.includes('award'))
    return { name: 'trophy-outline', color: '#f59e0b' }
  if (link.includes('calendar') || link.includes('event'))
    return { name: 'calendar-outline', color: '#6366f1' }
  if (link.includes('join-request'))
    return { name: 'person-add-outline', color: '#3b82f6' }
  if (link.includes('squad'))
    return { name: 'layers-outline', color: '#8b5cf6' }
  if (link.includes('season') || link.includes('registr'))
    return { name: 'card-outline', color: '#06b6d4' }
  if (link.includes('announcement'))
    return { name: 'megaphone-outline', color: '#f97316' }
  if (link.includes('dashboard'))
    return { name: 'grid-outline', color: colors.primary }
  if (link.includes('athlete'))
    return { name: 'people-outline', color: '#3b82f6' }
  return { name: 'notifications-outline', color: colors.textMuted }
}

function navigateFromLink(link, navigation, user) {
  if (!link) return
  const role = user?.role
  const isManager = role === 'club_admin' || role === 'coach'
  const path = link.split('?')[0].replace(/\/$/, '')
  // Tab navigator is one level up from the screen's stack
  const parent = navigation.getParent?.()

  if (path === '/dashboard') {
    if (isManager) parent?.navigate('ManagerDash')
    else parent?.navigate('Dashboard')
  } else if (path === '/athletes') {
    if (isManager) parent?.navigate('Athletes')
  } else if (path === '/calendar') {
    if (isManager) parent?.navigate('Calendar')
  } else if (path === '/milestones') {
    if (isManager) parent?.navigate('Awards')
    else parent?.navigate('Milestones')
  } else if (path === '/announcements') {
    if (isManager) parent?.navigate('More', { screen: 'AnnouncementsList' })
    else parent?.navigate('Announcements')
  } else if (path === '/join-requests') {
    if (isManager) parent?.navigate('More', { screen: 'JoinRequestsList' })
  } else if (path === '/squad') {
    if (isManager) parent?.navigate('More', { screen: 'SquadsList' })
  } else if (path.startsWith('/seasons')) {
    if (isManager) parent?.navigate('More', { screen: 'SeasonsList' })
  } else if (path === '/my-registrations') {
    parent?.navigate('Registrations')
  } else if (path === '/clubs') {
    if (isManager) parent?.navigate('ManagerDash')
    else parent?.navigate('Dashboard')
  }
}

// ── BroadcastModal ────────────────────────────────────────────────────────────

function BroadcastModal({ notification, visible, onClose }) {
  const isExternal = notification?.link && (
    notification.link.startsWith('http://') || notification.link.startsWith('https://')
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <View style={s.broadcastCard}>
          {/* Green header */}
          <View style={s.broadcastHeader}>
            <View style={s.broadcastHeaderTop}>
              <View style={s.broadcastIconRow}>
                <View style={s.broadcastIconBox}>
                  <Ionicons name="megaphone" size={16} color="#fff" />
                </View>
                <Text style={s.broadcastLabel}>Platform Announcement</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={s.broadcastClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            </View>
            <Text style={s.broadcastTitle}>{notification?.title}</Text>
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={s.broadcastBody}
            contentContainerStyle={s.broadcastBodyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.broadcastBodyText} selectable>
              {notification?.body}
            </Text>
          </ScrollView>

          {/* Footer */}
          <View style={s.broadcastFooter}>
            {!!isExternal && (
              <TouchableOpacity
                style={s.broadcastLinkBtn}
                onPress={() => Linking.openURL(notification.link)}
                activeOpacity={0.8}
              >
                <Ionicons name="open-outline" size={14} color={colors.primary} />
                <Text style={s.broadcastLinkBtnText}>Learn more</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.broadcastDismissBtn, !isExternal && { flex: 1 }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={s.broadcastDismissBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ── NotificationRow ───────────────────────────────────────────────────────────

function NotificationRow({ n, onPress }) {
  const isUnread = !n.is_read
  const icon = iconForNotification(n)
  const hasAction = n.type === 'broadcast' || !!n.link

  return (
    <TouchableOpacity
      style={[s.row, isUnread && s.rowUnread]}
      onPress={() => onPress(n)}
      activeOpacity={hasAction ? 0.75 : 1}
      disabled={!hasAction}
    >
      {isUnread && <View style={s.unreadBar} />}

      <View style={[s.iconBox, isUnread && s.iconBoxUnread]}>
        <Ionicons
          name={icon.name}
          size={18}
          color={isUnread ? icon.color : colors.textMuted}
        />
      </View>

      <View style={s.rowContent}>
        <View style={s.rowTitleRow}>
          <Text
            style={[s.rowTitle, isUnread && s.rowTitleUnread]}
            numberOfLines={2}
          >
            {n.title}
          </Text>
          {isUnread && <View style={s.unreadDot} />}
        </View>

        {!!n.body && (
          <Text style={s.rowBody} numberOfLines={2}>{n.body}</Text>
        )}

        <View style={s.rowMeta}>
          <Text style={s.rowTime}>{formatTime(n.at)}</Text>
          {(n.type === 'broadcast' || !!n.link) && (
            <View style={s.rowChevron}>
              <Ionicons
                name={n.type === 'broadcast' ? 'expand-outline' : 'chevron-forward'}
                size={12}
                color={colors.textMuted}
              />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [markingAll, setMarkingAll]       = useState(false)
  const [clearing, setClearing]           = useState(false)
  const [broadcastModal, setBroadcastModal] = useState(null)

  const unreadCount   = notifications.filter(n => !n.is_read).length
  const hasAny        = notifications.length > 0

  async function fetchNotifications() {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchNotifications() }, [])

  // Keep header buttons in sync with state
  useEffect(() => {
    navigation?.setOptions({
      headerRight: () => (
        <View style={s.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} disabled={markingAll} style={s.headerBtn}>
              {markingAll
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={s.headerBtnText}>Mark all read</Text>}
            </TouchableOpacity>
          )}
          {hasAny && (
            <TouchableOpacity onPress={handleClearAll} disabled={clearing} style={s.headerIconBtn}>
              {clearing
                ? <ActivityIndicator size="small" color={colors.textMuted} />
                : <Ionicons name="trash-outline" size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          )}
        </View>
      ),
    })
  }, [unreadCount, hasAny, markingAll, clearing])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchNotifications()
  }, [])

  async function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    try { await api.put(`/notifications/${id}/read`) } catch {}
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      Alert.alert('Error', 'Failed to mark all read.')
    } finally { setMarkingAll(false) }
  }

  function handleClearAll() {
    Alert.alert(
      'Clear notifications',
      'Remove all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all', style: 'destructive',
          onPress: async () => {
            setClearing(true)
            try {
              await api.delete('/notifications')
              setNotifications([])
            } catch {
              Alert.alert('Error', 'Failed to clear notifications.')
            } finally { setClearing(false) }
          },
        },
      ]
    )
  }

  function handlePress(n) {
    if (!n.is_read) markRead(n.id)

    if (n.type === 'broadcast') {
      setBroadcastModal(n)
      return
    }

    if (n.link) {
      navigateFromLink(n.link, navigation, user)
    }
  }

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
        data={notifications}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[s.content, !hasAny && s.contentEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <NotificationRow n={item} onPress={handlePress} />
        )}
        ListHeaderComponent={hasAny && unreadCount > 0
          ? (
            <View style={s.unreadBanner}>
              <View style={s.unreadBannerDot} />
              <Text style={s.unreadBannerText}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )
          : null
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIconBox}>
              <Ionicons name="notifications-outline" size={32} color="#94a3b8" />
            </View>
            <Text style={s.emptyTitle}>All caught up!</Text>
            <Text style={s.emptySubtitle}>
              No notifications to show right now. Check back later.
            </Text>
          </View>
        }
      />

      <BroadcastModal
        notification={broadcastModal}
        visible={!!broadcastModal}
        onClose={() => setBroadcastModal(null)}
      />
    </SafeAreaView>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content:      { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
  contentEmpty: { flexGrow: 1, justifyContent: 'center' },

  // Header
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 },
  headerBtn:     { paddingHorizontal: 4, paddingVertical: 4 },
  headerBtnText: { color: colors.primary, fontWeight: '600', fontSize: font.sm },
  headerIconBtn: { paddingHorizontal: 4, paddingVertical: 4 },

  // Unread banner
  unreadBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#ecfdf5', borderRadius: radius.lg,
    borderWidth: 1, borderColor: '#a7f3d0',
  },
  unreadBannerDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981',
  },
  unreadBannerText: { fontSize: font.sm, color: '#065f46', fontWeight: '600' },

  // Notification row
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff',
    paddingVertical: 14, paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    borderRadius: radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  rowUnread: {
    backgroundColor: '#f0fdf4',
    borderColor: '#a7f3d0',
  },
  unreadBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: '#10b981',
  },

  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  iconBoxUnread: { backgroundColor: '#ecfdf5' },

  rowContent:  { flex: 1, minWidth: 0 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 3 },
  rowTitle: {
    flex: 1, fontSize: font.sm, fontWeight: '500',
    color: colors.text, lineHeight: 20,
  },
  rowTitleUnread: { fontWeight: '700' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#10b981', marginTop: 4, flexShrink: 0,
  },
  rowBody: {
    fontSize: font.xs, color: colors.textSecondary,
    lineHeight: 18, marginBottom: 4,
  },
  rowMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTime:    { fontSize: font.xs, color: colors.textMuted },
  rowChevron: { marginLeft: 2 },

  // Empty state
  empty: {
    alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 48,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle:    { fontSize: font.lg, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  emptySubtitle: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },

  // Broadcast modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    padding: spacing.lg,
  },
  broadcastCard: {
    width: '100%', maxWidth: 480,
    backgroundColor: '#fff', borderRadius: radius.xl,
    overflow: 'hidden', maxHeight: '80%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },

  // Broadcast header (green)
  broadcastHeader: {
    backgroundColor: '#059669',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16,
  },
  broadcastHeaderTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  broadcastIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  broadcastIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  broadcastLabel: { fontSize: font.xs, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  broadcastClose: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  broadcastTitle: { fontSize: font.lg, fontWeight: '800', color: '#fff', lineHeight: 24 },

  // Broadcast body
  broadcastBody:        { flexShrink: 1 },
  broadcastBodyContent: { padding: 20 },
  broadcastBodyText: {
    fontSize: font.sm, color: colors.text,
    lineHeight: 22,
  },

  // Broadcast footer
  broadcastFooter: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  broadcastLinkBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 11,
  },
  broadcastLinkBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.primary },
  broadcastDismissBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 11,
  },
  broadcastDismissBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
})
