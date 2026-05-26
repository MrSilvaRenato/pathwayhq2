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
import { UserPlus } from 'lucide-react-native'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusColor(status) {
  if (status === 'approved') return 'green'
  if (status === 'rejected') return 'red'
  return 'amber'
}

export default function JoinRequestsScreen() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  async function fetchRequests() {
    try {
      setError('')
      const r = await api.get('/club/join-requests')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setRequests(list)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load join requests.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchRequests()
  }, [])

  async function handleApprove(id) {
    setActionLoading(`approve-${id}`)
    try {
      await api.put(`/club/join-requests/${id}/approve`)
      await fetchRequests()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Approval failed.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id) {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this join request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(`reject-${id}`)
            try {
              await api.put(`/club/join-requests/${id}/reject`)
              await fetchRequests()
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Rejection failed.')
            } finally {
              setActionLoading(null)
            }
          },
        },
      ]
    )
  }

  async function handleDelete(id) {
    Alert.alert(
      'Delete Request',
      'Remove this request from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(`delete-${id}`)
            try {
              await api.delete(`/club/join-requests/${id}`)
              setRequests((prev) => prev.filter((r) => r.id !== id))
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Delete failed.')
            } finally {
              setActionLoading(null)
            }
          },
        },
      ]
    )
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

  const pending = requests.filter((r) => r.status === 'pending')
  const resolved = requests.filter((r) => r.status !== 'pending')

  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          icon={UserPlus}
          title="No join requests"
          subtitle="Athletes who request to join your club will appear here."
        />
      </SafeAreaView>
    )
  }

  const data = []
  if (pending.length > 0) {
    data.push({ type: 'sectionHeader', label: `Pending (${pending.length})`, key: 'sec-pending' })
    pending.forEach((r) => data.push({ type: 'item', ...r, key: `item-${r.id}` }))
  }
  if (resolved.length > 0) {
    data.push({ type: 'sectionHeader', label: 'Resolved', key: 'sec-resolved' })
    resolved.forEach((r) => data.push({ type: 'item', ...r, key: `item-${r.id}` }))
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.key}
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
          if (item.type === 'sectionHeader') {
            return <Text style={styles.sectionHeader}>{item.label}</Text>
          }

          const isPending = item.status === 'pending'

          return (
            <View style={[styles.card, isPending && styles.cardPending]}>
              <View style={styles.cardTop}>
                <Avatar
                  name={item.user?.name ?? item.name}
                  url={item.user?.avatar_url}
                  size="md"
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {item.user?.name ?? item.name ?? 'Unknown'}
                  </Text>
                  <Text style={styles.userEmail}>
                    {item.user?.email ?? item.email ?? ''}
                  </Text>
                  {item.created_at ? (
                    <Text style={styles.requestDate}>
                      {formatDate(item.created_at)}
                    </Text>
                  ) : null}
                </View>
                {!isPending ? (
                  <Badge label={item.status} color={statusColor(item.status)} />
                ) : null}
              </View>

              {item.message ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{item.message}</Text>
                </View>
              ) : null}

              {isPending ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(item.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === `approve-${item.id}` ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.approveBtnText}>Approve</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(item.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === `reject-${item.id}` ? (
                      <ActivityIndicator color={colors.textSecondary} size="small" />
                    ) : (
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === `delete-${item.id}` ? (
                    <ActivityIndicator color={colors.error} size="small" />
                  ) : (
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionHeader: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPending: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: font.base, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  requestDate: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  messageBox: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  messageText: { fontSize: font.sm, color: colors.textSecondary, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  rejectBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },
  deleteBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  deleteBtnText: { color: colors.error, fontSize: font.xs, fontWeight: '600' },
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
