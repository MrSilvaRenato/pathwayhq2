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
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusColor(status) {
  if (status === 'paid' || status === 'accepted') return 'green'
  if (status === 'rejected' || status === 'declined') return 'red'
  if (status === 'pending') return 'amber'
  return 'slate'
}

export default function RegistrationsScreen() {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [declineConfirm, setDeclineConfirm] = useState(null)

  async function fetchRegistrations() {
    try {
      setError('')
      const r = await api.get('/my-registrations')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setRegistrations(list)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load registrations.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchRegistrations()
  }, [])

  async function handlePay(id) {
    setActionLoading(`pay-${id}`)
    try {
      await api.post(`/registrations/${id}/pay`)
      await fetchRegistrations()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Payment failed.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id) {
    if (declineConfirm !== id) {
      setDeclineConfirm(id)
      return
    }
    setActionLoading(`reject-${id}`)
    setDeclineConfirm(null)
    try {
      await api.post(`/registrations/${id}/reject`)
      await fetchRegistrations()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to decline.')
    } finally {
      setActionLoading(null)
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

  if (registrations.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          iconName="card-outline"
          title="No registrations"
          subtitle="You have no event registrations yet."
        />
      </SafeAreaView>
    )
  }

  const pending = registrations.filter((r) => r.status === 'pending')
  const resolved = registrations.filter((r) => r.status !== 'pending')

  const data = []
  if (pending.length > 0) {
    data.push({ type: 'sectionHeader', label: 'Pending', key: 'sec-pending' })
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
          const isDeclining = declineConfirm === item.id

          return (
            <View style={[styles.card, isPending && styles.cardPending]}>
              <View style={styles.cardTop}>
                <Text style={styles.eventName}>
                  {item.event_name ?? item.event?.name ?? 'Event'}
                </Text>
                {!isPending ? (
                  <Badge
                    label={item.status}
                    color={statusColor(item.status)}
                  />
                ) : null}
              </View>
              {item.event?.start_date || item.event_date ? (
                <Text style={styles.eventDate}>
                  {formatDate(item.event?.start_date ?? item.event_date)}
                </Text>
              ) : null}
              {item.amount != null ? (
                <Text style={styles.amount}>
                  ${Number(item.amount).toFixed(2)}
                </Text>
              ) : null}

              {isPending && (
                <>
                  {isDeclining ? (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmText}>
                        Are you sure you want to decline?
                      </Text>
                      <View style={styles.confirmActions}>
                        <TouchableOpacity
                          style={styles.confirmYes}
                          onPress={() => handleReject(item.id)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === `reject-${item.id}` ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.confirmYesText}>Yes, Decline</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmNo}
                          onPress={() => setDeclineConfirm(null)}
                        >
                          <Text style={styles.confirmNoText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => handlePay(item.id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === `pay-${item.id}` ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.payBtnText}>
                            Yes, Register &amp; Pay
                          </Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleReject(item.id)}
                        disabled={!!actionLoading}
                      >
                        <Text style={styles.rejectBtnText}>No, Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  eventName: {
    flex: 1,
    fontSize: font.base,
    fontWeight: '700',
    color: colors.text,
  },
  eventDate: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  amount: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  actions: {
    gap: 8,
    marginTop: spacing.sm,
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  rejectBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },
  confirmRow: { marginTop: spacing.sm },
  confirmText: {
    fontSize: font.sm,
    color: colors.warning,
    fontWeight: '600',
    marginBottom: 8,
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  confirmActions: { flexDirection: 'row', gap: 8 },
  confirmYes: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmYesText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  confirmNo: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmNoText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },
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
