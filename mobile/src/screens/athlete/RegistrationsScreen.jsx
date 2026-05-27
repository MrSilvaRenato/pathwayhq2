import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Modal, Animated, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import EmptyState from '../../components/EmptyState'

const STATUS = {
  invited:          { label: 'Action required',       bg: '#fef3c7', text: '#b45309' },
  manual_pending:   { label: 'Pay at club',            bg: '#dbeafe', text: '#1d4ed8' },
  paid:             { label: 'Paid ✓',                 bg: '#d1fae5', text: '#065f46' },
  manual_confirmed: { label: 'Paid ✓',                 bg: '#d1fae5', text: '#065f46' },
  rejected:         { label: 'Declined',               bg: '#f1f5f9', text: '#64748b' },
}

function fmtMoney(cents, currency = 'AUD') {
  if (cents == null) return ''
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(cents / 100)
}

function fmtDateShort(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
}

function fmtDateFull(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ClubAvatar({ logo, name, size = 48 }) {
  if (logo) {
    return (
      <Image
        source={{ uri: logo }}
        style={{ width: size, height: size, borderRadius: 12 }}
        resizeMode="cover"
      />
    )
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size }]}>
      <Text style={styles.avatarLetter}>{(name ?? '?')[0].toUpperCase()}</Text>
    </View>
  )
}

function PayModal({ reg, onClose, onPaid }) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')
  const slideAnim = useRef(new Animated.Value(400)).current

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start()
  }, [])

  function dismiss() {
    Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start(onClose)
  }

  async function choose(method) {
    setError('')
    setLoading(method)
    try {
      await api.post(`/registrations/${reg.id}/pay`, { method })
      onPaid()
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Payment failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal transparent animationType="none" onRequestClose={dismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Header gradient strip */}
        <View style={styles.payHeader}>
          <Ionicons name="wallet-outline" size={32} color="#fff" style={{ marginBottom: 6, opacity: 0.85 }} />
          <Text style={styles.payAmount}>{fmtMoney(reg.fee_cents, reg.currency)}</Text>
          <Text style={styles.paySeasonName}>{reg.season_name}</Text>
          <Text style={styles.payClubName}>{reg.club_name}</Text>
        </View>

        <View style={styles.payBody}>
          <Text style={styles.payQuestion}>How would you like to pay?</Text>

          {error ? (
            <View style={styles.payError}>
              <Text style={styles.payErrorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.payStripeBtn}
            onPress={() => choose('stripe')}
            disabled={!!loading}
            activeOpacity={0.8}
          >
            {loading === 'stripe'
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="card-outline" size={18} color="#fff" />}
            <Text style={styles.payStripeBtnText}>Pay online by card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.payManualBtn}
            onPress={() => choose('manual')}
            disabled={!!loading}
            activeOpacity={0.8}
          >
            {loading === 'manual'
              ? <ActivityIndicator color={colors.text} size="small" />
              : <Ionicons name="business-outline" size={18} color={colors.text} />}
            <Text style={styles.payManualBtnText}>I'll pay at the club</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={dismiss} style={styles.payCancelBtn}>
            <Text style={styles.payCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

export default function RegistrationsScreen() {
  const [regs, setRegs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [rejecting, setRejecting] = useState(null)

  async function load() {
    try {
      setError('')
      const r = await api.get('/my-registrations')
      setRegs(Array.isArray(r.data) ? r.data : r.data?.data ?? [])
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load registrations.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const onRefresh = useCallback(() => { setRefreshing(true); load() }, [])

  async function rejectReg(id) {
    setRejecting(id)
    try {
      await api.post(`/registrations/${id}/reject`)
      setConfirming(null)
      load()
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to decline.')
    } finally {
      setRejecting(null)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error && regs.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.errBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={styles.errText}>{error}</Text>
        </View>
      </View>
    )
  }

  if (regs.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          iconName="card-outline"
          title="No registrations yet"
          subtitle="Your club manager will send you a payment request when the season opens."
        />
      </SafeAreaView>
    )
  }

  const pending = regs.filter(r => r.status === 'invited')
  const others  = regs.filter(r => r.status !== 'invited')

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >

        {/* ── Action required section ── */}
        {pending.length > 0 && (
          <View style={styles.pendingContainer}>
            <View style={styles.pendingHeader}>
              <Ionicons name="time-outline" size={14} color="#b45309" />
              <Text style={styles.pendingHeaderText}>ACTION REQUIRED · {pending.length}</Text>
            </View>

            {pending.map(r => (
              <View key={r.id} style={styles.pendingCard}>
                <View style={styles.regRow}>
                  <ClubAvatar logo={r.club_logo} name={r.club_name} size={48} />
                  <View style={styles.regInfo}>
                    <Text style={styles.seasonName}>{r.season_name ?? r.event_name ?? 'Season'}</Text>
                    <Text style={styles.clubName}>{r.club_name}</Text>
                    {(r.start_date || r.end_date) && (
                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                        <Text style={styles.dateText}>
                          {fmtDateShort(r.start_date)}
                          {r.end_date ? ` – ${fmtDateShort(r.end_date)}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                  {r.fee_cents != null && (
                    <Text style={styles.feeText}>{fmtMoney(r.fee_cents, r.currency)}</Text>
                  )}
                </View>

                {/* Decline confirm box */}
                {confirming === r.id ? (
                  <View style={styles.declineBox}>
                    <View style={styles.declineBoxHeader}>
                      <Ionicons name="warning-outline" size={16} color="#dc2626" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.declineBoxTitle}>Decline this registration?</Text>
                        <Text style={styles.declineBoxSub}>Your manager will be notified. You can ask them to re-invite you later.</Text>
                      </View>
                    </View>
                    <View style={styles.declineActions}>
                      <TouchableOpacity
                        style={styles.declineYesBtn}
                        onPress={() => rejectReg(r.id)}
                        disabled={rejecting === r.id}
                        activeOpacity={0.8}
                      >
                        {rejecting === r.id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Ionicons name="close-circle-outline" size={16} color="#fff" />}
                        <Text style={styles.declineYesBtnText}>Yes, decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineCancelBtn}
                        onPress={() => setConfirming(null)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.declineCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* RSVP buttons */
                  <View style={styles.rsvpRow}>
                    <TouchableOpacity
                      style={styles.rsvpYes}
                      onPress={() => setPaying(r)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={styles.rsvpYesText}>Yes, Register &amp; Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rsvpNo}
                      onPress={() => setConfirming(r.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
                      <Text style={styles.rsvpNoText}>No, Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Resolved registrations ── */}
        {others.length > 0 && (
          <>
            {pending.length > 0 && <View style={{ height: spacing.md }} />}
            <Text style={styles.sectionLabel}>History</Text>
            {others.map(r => {
              const s = STATUS[r.status] ?? STATUS.rejected
              return (
                <View key={r.id} style={styles.resolvedCard}>
                  <ClubAvatar logo={r.club_logo} name={r.club_name} size={40} />
                  <View style={styles.resolvedInfo}>
                    <Text style={styles.resolvedSeasonName}>{r.season_name ?? r.event_name ?? 'Season'}</Text>
                    <Text style={styles.resolvedClubName}>{r.club_name}</Text>
                  </View>
                  <View style={styles.resolvedRight}>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: s.text }]}>{s.label}</Text>
                    </View>
                    {r.paid_at && (
                      <Text style={styles.resolvedDate}>{fmtDateFull(r.paid_at)}</Text>
                    )}
                    {r.status === 'manual_pending' && (
                      <Text style={styles.resolvedDate}>Awaiting club confirmation</Text>
                    )}
                  </View>
                </View>
              )
            })}
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {paying && (
        <PayModal
          reg={paying}
          onClose={() => setPaying(null)}
          onPaid={() => { setPaying(null); load() }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { padding: spacing.md },

  errBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: radius.md,
    padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.error,
  },
  errText: { flex: 1, color: colors.error, fontSize: font.sm },

  /* Pending container */
  pendingContainer: {
    borderWidth: 2, borderColor: '#fde68a', borderRadius: 16,
    backgroundColor: '#fffbeb', overflow: 'hidden',
  },
  pendingHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 8,
  },
  pendingHeaderText: {
    fontSize: font.xs, fontWeight: '700', color: '#b45309', letterSpacing: 0.6,
  },
  pendingCard: {
    backgroundColor: '#fff', marginHorizontal: 4, marginBottom: 4,
    borderRadius: 12, padding: spacing.md,
  },

  regRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: spacing.md },
  regInfo: { flex: 1 },
  seasonName: { fontSize: font.base, fontWeight: '800', color: colors.text },
  clubName: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  dateText: { fontSize: 11, color: colors.textMuted },
  feeText: { fontSize: font.lg, fontWeight: '800', color: colors.text, shrink: 0 },

  avatarFallback: {
    borderRadius: 12, backgroundColor: '#ecfdf5',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: font.lg, fontWeight: '900', color: '#059669' },

  /* RSVP buttons */
  rsvpRow: { flexDirection: 'row', gap: 8 },
  rsvpYes: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13,
  },
  rsvpYesText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  rsvpNo: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#fca5a5', backgroundColor: '#fef2f2',
    borderRadius: radius.md, paddingVertical: 13,
  },
  rsvpNoText: { color: '#dc2626', fontWeight: '700', fontSize: font.sm },

  /* Decline confirm */
  declineBox: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 14,
  },
  declineBoxHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  declineBoxTitle: { fontSize: font.sm, fontWeight: '700', color: '#991b1b' },
  declineBoxSub: { fontSize: 12, color: '#dc2626', marginTop: 2 },
  declineActions: { flexDirection: 'row', gap: 8 },
  declineYesBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#ef4444', borderRadius: radius.md, paddingVertical: 11,
  },
  declineYesBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  declineCancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: 11, alignItems: 'center',
  },
  declineCancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },

  /* History section */
  sectionLabel: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },
  resolvedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  resolvedInfo: { flex: 1 },
  resolvedSeasonName: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  resolvedClubName: { fontSize: font.xs, color: colors.textSecondary, marginTop: 2 },
  resolvedRight: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  resolvedDate: { fontSize: 11, color: colors.textMuted, marginTop: 3 },

  /* Pay modal / bottom sheet */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  payHeader: {
    backgroundColor: '#059669', alignItems: 'center',
    paddingTop: 28, paddingBottom: 24, paddingHorizontal: spacing.lg,
  },
  payAmount: { fontSize: font.xxl, fontWeight: '900', color: '#fff' },
  paySeasonName: { fontSize: font.sm, color: '#a7f3d0', marginTop: 4 },
  payClubName: { fontSize: font.xs, color: '#6ee7b7', marginTop: 2 },
  payBody: { padding: spacing.lg, gap: 12 },
  payQuestion: { fontSize: font.sm, color: colors.textSecondary, textAlign: 'center' },
  payError: {
    backgroundColor: '#fef2f2', borderRadius: radius.sm, padding: 10,
    borderLeftWidth: 3, borderLeftColor: colors.error,
  },
  payErrorText: { color: colors.error, fontSize: font.xs },
  payStripeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15,
  },
  payStripeBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },
  payManualBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 15,
  },
  payManualBtnText: { color: colors.text, fontWeight: '700', fontSize: font.base },
  payCancelBtn: { alignItems: 'center', paddingVertical: 8 },
  payCancelText: { fontSize: font.xs, color: colors.textMuted },
})
