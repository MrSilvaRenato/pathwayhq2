import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Avatar from '../../components/Avatar'

export default function ClubBroadcastScreen() {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [form, setForm] = useState({ title: '', body: '', link: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)

  useEffect(() => {
    api.get('/club/broadcast/athletes')
      .then(r => setAthletes(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return athletes
    const lq = q.toLowerCase()
    return athletes.filter(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(lq))
  }, [athletes, q])

  const allSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id))

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) filtered.forEach(a => next.delete(a.id))
      else filtered.forEach(a => next.add(a.id))
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

  async function handleSend() {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Required', 'Title and message are required.')
      return
    }
    if (selected.size === 0) {
      Alert.alert('No recipients', 'Select at least one athlete.')
      return
    }
    Alert.alert('Send Broadcast', `Send to ${selected.size} athlete${selected.size !== 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        setSending(true)
        try {
          const { data } = await api.post('/club/broadcast', {
            ...form,
            athlete_ids: Array.from(selected),
          })
          setSent(data)
          setForm({ title: '', body: '', link: '' })
          setSelected(new Set())
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send.')
        } finally {
          setSending(false)
        }
      }},
    ])
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {sent ? (
            <View style={styles.sentBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.sentText}>Broadcast sent successfully.</Text>
            </View>
          ) : null}

          {/* Message form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Notification title" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.body}
                onChangeText={v => setForm(p => ({ ...p, body: v }))}
                placeholder="Write your message…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Link (optional)</Text>
              <TextInput style={styles.input} value={form.link} onChangeText={v => setForm(p => ({ ...p, link: v }))} placeholder="https://…" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="url" />
            </View>
          </View>

          {/* Athlete selection */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recipients ({selected.size} selected)</Text>
              <TouchableOpacity onPress={toggleAll}>
                <Text style={styles.selectAllText}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={15} color={colors.textMuted} />
              <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Search athletes…" placeholderTextColor={colors.textMuted} />
            </View>
            {filtered.map(a => {
              const name = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()
              const isSelected = selected.has(a.id)
              return (
                <TouchableOpacity key={a.id} style={[styles.athleteRow, isSelected && styles.athleteRowSelected]} onPress={() => toggleOne(a.id)}>
                  <Avatar name={name} url={a.avatar_url} size="sm" />
                  <Text style={styles.athleteName}>{name || '—'}</Text>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? colors.primary : colors.border}
                  />
                </TouchableOpacity>
              )
            })}
          </View>

          <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.7 }]} onPress={handleSend} disabled={sending}>
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="megaphone-outline" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Send to {selected.size} athlete{selected.size !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md },
  sentBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  sentText: { flex: 1, color: colors.primaryDark, fontWeight: '600', fontSize: font.sm },
  section: { marginBottom: spacing.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  selectAllText: { fontSize: font.sm, color: colors.primary, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  fieldLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: font.base, color: colors.text, backgroundColor: '#fafafa', marginBottom: spacing.sm },
  textarea: { minHeight: 90 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  searchInput: { flex: 1, fontSize: font.sm, color: colors.text },
  athleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.sm + 4, marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight },
  athleteRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  athleteName: { flex: 1, fontSize: font.base, color: colors.text, fontWeight: '500' },
  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },
})
