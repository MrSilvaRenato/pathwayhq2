import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES } from '../../lib/constants'
import Avatar from '../../components/Avatar'

function initials(first = '', last = '') {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?'
}

export default function ClubBroadcastScreen() {
  const [athletes,   setAthletes]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [q,          setQ]          = useState('')
  const [selected,   setSelected]   = useState(new Set())
  const [form,       setForm]       = useState({ title: '', body: '', link: '' })
  const [confirming, setConfirming] = useState(false)
  const [sending,    setSending]    = useState(false)
  const [lastSent,   setLastSent]   = useState(null)

  useEffect(() => {
    api.get('/club/broadcast/athletes')
      .then(r => setAthletes(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return athletes
    const lq = q.toLowerCase()
    return athletes.filter(a =>
      `${a.first_name ?? ''} ${a.last_name ?? ''}`.toLowerCase().includes(lq)
    )
  }, [athletes, q])

  const allSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id))

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) filtered.forEach(a => next.delete(a.id))
      else             filtered.forEach(a => next.add(a.id))
      return next
    })
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSend() {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Required', 'Title and message are required.')
      return
    }
    if (selected.size === 0) {
      Alert.alert('No recipients', 'Select at least one athlete.')
      return
    }
    setConfirming(true)
  }

  async function confirmSend() {
    setConfirming(false)
    setSending(true)
    try {
      const { data } = await api.post('/club/broadcast', {
        ...form,
        athlete_ids: Array.from(selected),
      })
      setLastSent({ ...form, count: data.count ?? selected.size })
      setForm({ title: '', body: '', link: '' })
      setSelected(new Set())
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send.')
    } finally {
      setSending(false)
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Success banner ── */}
          {lastSent && (
            <View style={s.successBanner}>
              <View style={s.successIcon}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.successTitle}>
                  Sent to {lastSent.count} athlete{lastSent.count !== 1 ? 's' : ''}
                </Text>
                <Text style={s.successSub} numberOfLines={1}>"{lastSent.title}"</Text>
              </View>
              <TouchableOpacity onPress={() => setLastSent(null)}>
                <Ionicons name="close" size={16} color="#059669" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Recipient picker ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionHeaderLeft}>
                <Ionicons name="people-outline" size={16} color={colors.primary} />
                <Text style={s.sectionTitle}>Recipients</Text>
                {selected.size > 0 && (
                  <View style={s.countBadge}>
                    <Text style={s.countBadgeText}>{selected.size}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={toggleAll}>
                <Text style={s.selectAllText}>
                  {allSelected ? 'Deselect all' : `Select all (${filtered.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={15} color={colors.textMuted} />
              <TextInput
                style={s.searchInput}
                value={q}
                onChangeText={setQ}
                placeholder="Search athletes…"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={s.athleteList}>
              {filtered.length === 0 ? (
                <Text style={s.emptyText}>
                  {q ? 'No athletes match your search' : 'No athletes in your club'}
                </Text>
              ) : filtered.map(a => {
                const name      = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()
                const isChecked = selected.has(a.id)
                const ftem      = FTEM_PHASES[a.ftem_phase]
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[s.athleteRow, isChecked && s.athleteRowSelected]}
                    onPress={() => toggleOne(a.id)}
                    activeOpacity={0.7}
                  >
                    {/* Checkbox */}
                    <View style={[s.checkbox, isChecked && s.checkboxChecked]}>
                      {isChecked && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>

                    <Avatar name={name} url={a.avatar_url} size="sm" />

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.athleteName} numberOfLines={1}>{name || '—'}</Text>
                      {ftem ? (
                        <View style={[s.ftemPill, { backgroundColor: ftem.bgColor ?? '#f1f5f9' }]}>
                          <Text style={[s.ftemPillText, { color: ftem.textColor ?? '#475569' }]}>
                            {a.ftem_phase}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* ── Compose form ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionHeaderLeft}>
                <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
                <Text style={s.sectionTitle}>Compose Message</Text>
              </View>
            </View>

            {/* Recipient summary */}
            <View style={[s.recipientBar, selected.size > 0 && s.recipientBarActive]}>
              <Text style={[s.recipientBarText, selected.size > 0 && s.recipientBarTextActive]}>
                {selected.size > 0
                  ? `${selected.size} athlete${selected.size !== 1 ? 's' : ''} selected`
                  : 'No athletes selected — pick from the list above'}
              </Text>
            </View>

            <Text style={s.fieldLabel}>TITLE *</Text>
            <TextInput
              style={s.input}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
              placeholder="e.g. Training cancelled this Friday"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={s.fieldLabel}>MESSAGE *</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={form.body}
              onChangeText={v => setForm(p => ({ ...p, body: v }))}
              placeholder="What do you want to tell your athletes?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={s.charCount}>{form.body.length} / 5000</Text>

            <Text style={s.fieldLabel}>LINK <Text style={s.fieldLabelOpt}>(optional)</Text></Text>
            <TextInput
              style={s.input}
              value={form.link}
              onChangeText={v => setForm(p => ({ ...p, link: v }))}
              placeholder="/calendar or https://…"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />

            {/* Inline confirm step */}
            {confirming ? (
              <View style={s.confirmBox}>
                <Text style={s.confirmTitle}>
                  Send to <Text style={s.confirmBold}>{selected.size} athlete{selected.size !== 1 ? 's' : ''}</Text>?
                </Text>
                <Text style={s.confirmSub} numberOfLines={2}>"{form.title}"</Text>
                <View style={s.confirmActions}>
                  <TouchableOpacity
                    style={s.confirmCancel}
                    onPress={() => setConfirming(false)}
                  >
                    <Ionicons name="close" size={15} color={colors.textSecondary} />
                    <Text style={s.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.confirmSend} onPress={confirmSend}>
                    <Ionicons name="send-outline" size={15} color="#fff" />
                    <Text style={s.confirmSendText}>Yes, send it</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.sendBtn, (sending || selected.size === 0) && s.sendBtnDisabled]}
                onPress={handleSend}
                disabled={sending || selected.size === 0}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text style={s.sendBtnText}>
                      Send to {selected.size > 0 ? selected.size : '—'} athlete{selected.size !== 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md },

  // Success banner
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0',
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  successIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: font.sm, fontWeight: '700', color: '#065f46' },
  successSub:   { fontSize: font.xs, color: '#059669', marginTop: 1 },

  // Section
  section: {
    backgroundColor: '#fff', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  countBadge: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  countBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  selectAllText: { fontSize: font.sm, color: colors.primary, fontWeight: '600' },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: font.sm, color: colors.text },

  // Athlete list
  athleteList: { gap: 4 },
  emptyText:   { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },

  athleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent',
  },
  athleteRowSelected: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },

  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },

  athleteName: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  ftemPill:    { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3, alignSelf: 'flex-start' },
  ftemPillText:{ fontSize: 10, fontWeight: '700' },

  // Compose
  recipientBar: {
    borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.background,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: spacing.md,
  },
  recipientBarActive: { borderColor: '#a7f3d0', backgroundColor: '#f0fdf4' },
  recipientBarText: { fontSize: font.sm, color: colors.textMuted },
  recipientBarTextActive: { color: '#059669', fontWeight: '600' },

  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  fieldLabelOpt: { fontSize: 10, fontWeight: '400', color: colors.textMuted, textTransform: 'none' },

  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: font.base, color: colors.text, backgroundColor: '#fafafa',
    marginBottom: spacing.md,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: -spacing.md + 2, marginBottom: spacing.md },

  // Inline confirm
  confirmBox: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: radius.lg, padding: spacing.md, gap: 10,
  },
  confirmTitle: { fontSize: font.base, color: '#92400e', textAlign: 'center' },
  confirmBold:  { fontWeight: '900' },
  confirmSub:   { fontSize: font.xs, color: '#b45309', textAlign: 'center', fontStyle: 'italic' },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmCancel: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff',
    borderRadius: radius.md, paddingVertical: 13,
  },
  confirmCancelText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },
  confirmSend: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13,
  },
  confirmSendText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },

  // Send button
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },
})
