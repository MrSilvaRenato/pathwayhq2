import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Avatar from '../../components/Avatar'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateShort(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

const STATUS_META = {
  pending:  { label: 'Pending',  bg: '#fef3c7', border: '#fde68a', text: '#92400e' },
  approved: { label: 'Approved', bg: '#d1fae5', border: '#a7f3d0', text: '#065f46' },
  rejected: { label: 'Rejected', bg: '#fee2e2', border: '#fecaca', text: '#b91c1c' },
}

// ── Pending Card ──────────────────────────────────────────────────────────────

function PendingCard({ r, acting, onApprove, onReject }) {
  const name = r.user?.full_name ?? r.full_name ?? '—'
  const approvingThis = acting === r.id + 'a'
  const rejectingThis = acting === r.id + 'r'
  const busy = !!acting

  return (
    <View style={s.pendingCard}>
      <View style={s.pendingCardBody}>
        {/* Avatar */}
        <View style={s.pendingAvatar}>
          <Avatar url={r.user?.avatar_url} name={name} size="lg" />
        </View>

        {/* Info */}
        <View style={s.pendingInfo}>
          {/* Name + date row */}
          <View style={s.pendingNameRow}>
            <Text style={s.pendingName} numberOfLines={1}>{name}</Text>
            <View style={s.pendingDateRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={s.pendingDate}>{fmtDate(r.created_at)}</Text>
            </View>
          </View>

          {/* Email + phone */}
          <View style={s.contactList}>
            {!!r.user?.email && (
              <TouchableOpacity
                style={s.contactRow}
                onPress={() => Linking.openURL(`mailto:${r.user.email}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
                <Text style={s.contactText} numberOfLines={1}>{r.user.email}</Text>
              </TouchableOpacity>
            )}
            {!!r.user?.phone && (
              <TouchableOpacity
                style={s.contactRow}
                onPress={() => Linking.openURL(`tel:${r.user.phone}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                <Text style={s.contactText}>{r.user.phone}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Message blockquote */}
          {!!r.message && (
            <View style={s.messageBox}>
              <Text style={s.messageText}>{r.message}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={s.pendingActions}>
            <TouchableOpacity
              style={[s.approveBtn, busy && { opacity: 0.5 }]}
              onPress={() => onApprove(r.id)}
              disabled={busy}
              activeOpacity={0.8}
            >
              {approvingThis
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="checkmark-circle" size={16} color="#fff" />}
              <Text style={s.approveBtnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.rejectBtn, busy && { opacity: 0.5 }]}
              onPress={() => onReject(r.id)}
              disabled={busy}
              activeOpacity={0.8}
            >
              {rejectingThis
                ? <ActivityIndicator color={colors.textSecondary} size="small" />
                : <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />}
              <Text style={s.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

// ── Resolved Row ──────────────────────────────────────────────────────────────

function ResolvedRow({ r, acting, onDelete, isLast }) {
  const name = r.user?.full_name ?? r.full_name ?? '—'
  const meta = STATUS_META[r.status] ?? STATUS_META.rejected
  const deletingThis = acting === r.id + 'd'

  return (
    <View style={[s.resolvedRow, !isLast && s.resolvedRowBorder]}>
      <Avatar url={r.user?.avatar_url} name={name} size="sm" />
      <View style={s.resolvedInfo}>
        <Text style={s.resolvedName} numberOfLines={1}>{name}</Text>
        <Text style={s.resolvedEmail} numberOfLines={1}>{r.user?.email ?? ''}</Text>
      </View>
      <Text style={s.resolvedDate}>{fmtDateShort(r.created_at)}</Text>
      <View style={[s.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
        <Text style={[s.statusBadgeText, { color: meta.text }]}>{meta.label}</Text>
      </View>
      <TouchableOpacity
        style={[s.deleteIconBtn, deletingThis && { opacity: 0.4 }]}
        onPress={() => onDelete(r.id)}
        disabled={!!acting}
        activeOpacity={0.7}
      >
        {deletingThis
          ? <ActivityIndicator size="small" color={colors.textMuted} />
          : <Ionicons name="trash-outline" size={15} color="#cbd5e1" />}
      </TouchableOpacity>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function JoinRequestsScreen() {
  const [requests, setRequests]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acting, setActing]       = useState(null)

  async function fetchRequests() {
    try {
      const { data } = await api.get('/club/join-requests')
      setRequests(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchRequests() }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchRequests()
  }, [])

  async function approve(id) {
    setActing(id + 'a')
    try {
      await api.put(`/club/join-requests/${id}/approve`)
      setRequests(p => p.map(r => r.id === id ? { ...r, status: 'approved' } : r))
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to approve.')
    } finally { setActing(null) }
  }

  function reject(id) {
    Alert.alert('Reject request', 'Are you sure you want to reject this join request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setActing(id + 'r')
          try {
            await api.put(`/club/join-requests/${id}/reject`)
            setRequests(p => p.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
          } catch {
            Alert.alert('Error', 'Failed to reject.')
          } finally { setActing(null) }
        },
      },
    ])
  }

  function deleteReq(id) {
    Alert.alert('Delete request', 'Remove this request? The athlete will be able to re-apply.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setActing(id + 'd')
          try {
            await api.delete(`/club/join-requests/${id}`)
            setRequests(p => p.filter(r => r.id !== id))
          } catch {
            Alert.alert('Error', 'Failed to delete.')
          } finally { setActing(null) }
        },
      },
    ])
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

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
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={s.content}>
            {/* Empty state */}
            {requests.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                <Text style={s.emptyTitle}>No join requests yet</Text>
                <Text style={s.emptySubtitle}>
                  Share your club page so athletes can discover you and request to join.
                </Text>
              </View>
            )}

            {/* Pending section */}
            {pending.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Ionicons name="time-outline" size={14} color="#f59e0b" />
                  <Text style={s.sectionTitle}>Pending review · {pending.length}</Text>
                </View>
                {pending.map(r => (
                  <PendingCard
                    key={r.id}
                    r={r}
                    acting={acting}
                    onApprove={approve}
                    onReject={reject}
                  />
                ))}
              </View>
            )}

            {/* Resolved section */}
            {resolved.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Resolved · {resolved.length}</Text>
                </View>
                <View style={s.resolvedCard}>
                  {resolved.map((r, idx) => (
                    <ResolvedRow
                      key={r.id}
                      r={r}
                      acting={acting}
                      onDelete={deleteReq}
                      isLast={idx === resolved.length - 1}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },

  // Empty
  empty: {
    alignItems: 'center', paddingVertical: 56, paddingHorizontal: spacing.lg,
    backgroundColor: '#fff', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  emptyTitle:    { fontSize: font.lg, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.md },
  emptySubtitle: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: 260 },

  // Section
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionTitle: {
    fontSize: font.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
  },

  // Pending card
  pendingCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  pendingCardBody: { flexDirection: 'row', gap: 14, padding: 16 },
  pendingAvatar:   { flexShrink: 0 },
  pendingInfo:     { flex: 1, minWidth: 0 },

  pendingNameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, marginBottom: 6 },
  pendingName:    { fontSize: font.lg, fontWeight: '900', color: colors.text, flexShrink: 1 },
  pendingDateRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pendingDate:    { fontSize: font.xs, color: colors.textMuted },

  contactList: { gap: 3, marginBottom: 6 },
  contactRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contactText: { fontSize: font.sm, color: colors.textSecondary, flex: 1 },

  messageBox: {
    borderLeftWidth: 3, borderLeftColor: '#93c5fd',
    backgroundColor: '#f8fafc', borderRadius: 6,
    paddingLeft: 10, paddingRight: 10, paddingVertical: 8,
    marginBottom: 10,
  },
  messageText: { fontSize: font.sm, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 20 },

  pendingActions: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 10, minHeight: 44,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    paddingVertical: 10, minHeight: 44, backgroundColor: '#fff',
  },
  rejectBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },

  // Resolved card
  resolvedCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderLight,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  resolvedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  resolvedRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  resolvedInfo:  { flex: 1, minWidth: 0 },
  resolvedName:  { fontSize: font.sm, fontWeight: '600', color: colors.text },
  resolvedEmail: { fontSize: font.xs, color: colors.textMuted, marginTop: 1 },
  resolvedDate:  { fontSize: font.xs, color: colors.textMuted, flexShrink: 0 },

  statusBadge: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  deleteIconBtn: {
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.md,
  },
})
