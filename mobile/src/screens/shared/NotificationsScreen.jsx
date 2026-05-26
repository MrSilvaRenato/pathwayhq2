import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import EmptyState from '../../components/EmptyState'

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

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  async function fetchNotifications() {
    try {
      setError('')
      const r = await api.get('/notifications')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setNotifications(list)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load notifications.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    navigation?.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={markAllRead} style={{ marginRight: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
            Mark all read
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchNotifications()
  }, [])

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      )
    } catch {
      // silently ignore
    }
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      await api.put('/notifications/read-all')
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      )
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to mark all read.')
    } finally {
      setMarkingAll(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    )
  }

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          iconName="notifications-outline"
          title="No notifications"
          subtitle="You're all caught up! Notifications will appear here."
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          const isUnread = !item.read_at
          return (
            <TouchableOpacity
              style={[styles.row, isUnread && styles.rowUnread]}
              onPress={() => markRead(item.id)}
              activeOpacity={0.75}
            >
              {isUnread && <View style={styles.unreadBar} />}
              <View style={styles.iconBox}>
                <Ionicons name="notifications-outline" size={16} color={isUnread ? colors.primary : colors.textMuted} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]}>
                  {item.title}
                </Text>
                {item.body ?? item.data?.body ? (
                  <Text style={styles.rowBody} numberOfLines={2}>
                    {item.body ?? item.data?.body}
                  </Text>
                ) : null}
                <Text style={styles.rowTime}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  rowUnread: {
    backgroundColor: '#f0fdf4',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: font.sm, fontWeight: '500', color: colors.text, marginBottom: 2 },
  rowTitleUnread: { fontWeight: '700', color: colors.text },
  rowBody: { fontSize: font.xs, color: colors.textSecondary, lineHeight: 18 },
  rowTime: { fontSize: font.xs, color: colors.textMuted, marginTop: 4 },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    margin: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: font.sm },
})
