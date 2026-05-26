import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, RefreshControl, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, font, spacing, radius } from '../../lib/theme'
import { SPORTS } from '../../lib/constants'
import api from '../../lib/api'
import Badge from '../../components/Badge'
import Avatar from '../../components/Avatar'

// ── helpers ───────────────────────────────────────────────────────────────────

const ROLE_META = {
  site_admin: { label: 'Site Admin',  color: 'blue'  },
  club_admin:  { label: 'Club Admin', color: 'green' },
  coach:       { label: 'Coach',      color: 'blue'  },
  athlete:     { label: 'Athlete',    color: 'slate' },
  parent:      { label: 'Parent',     color: 'amber' },
}

function sportLabel(v) {
  return SPORTS.find(s => s.value === v)?.label ?? v ?? '—'
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ iconName, label, value }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name={iconName} size={18} color={colors.primary} />
      </View>
      <Text style={styles.cardValue}>{value ?? '—'}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={styles.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        <StatCard iconName="people-outline"          label="Total Users"       value={stats?.users_total} />
        <StatCard iconName="business-outline"        label="Total Clubs"       value={stats?.clubs_total} />
        <StatCard iconName="pulse-outline"           label="Active Athletes"   value={stats?.athletes_active} />
        <StatCard iconName="calendar-outline"        label="Active Seasons"    value={stats?.active_seasons} />
        <StatCard iconName="shield-outline"          label="Club Admins"       value={stats?.users_by_role?.club_admin} />
        <StatCard iconName="fitness-outline"         label="Coaches"           value={stats?.users_by_role?.coach} />
        <StatCard iconName="globe-outline"           label="Public Clubs"      value={stats?.clubs_public} />
        <StatCard iconName="checkmark-circle-outline" label="Claimed Clubs"   value={stats?.clubs_claimed} />
        <StatCard iconName="alert-circle-outline"   label="Pending Claims"     value={stats?.pending_claims} />
      </View>
    </ScrollView>
  )
}

// ── Clubs tab ─────────────────────────────────────────────────────────────────

const CLUB_EMPTY = { name: '', sport: 'soccer', city: '', state: '', description: '', website: '', contact_email: '', phone: '', is_public: false, is_claimed: false }

function ClubsTab() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(CLUB_EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/clubs/all').then(r => setClubs(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [])

  const filtered = clubs.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()))

  function openAdd()      { setForm(CLUB_EMPTY); setModal('add') }
  function openEdit(club) { setForm({ ...club }); setModal(club) }

  async function handleSave() {
    if (!form.name?.trim()) { Alert.alert('Required', 'Club name is required.'); return }
    setSaving(true)
    try {
      if (modal === 'add') {
        const { data } = await api.post('/admin/clubs', form)
        setClubs(p => [data, ...p])
      } else {
        const { data } = await api.put(`/admin/clubs/${modal.id}`, form)
        setClubs(p => p.map(c => c.id === modal.id ? { ...c, ...data.club } : c))
      }
      setModal(null)
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(club) {
    Alert.alert('Delete Club', `Delete "${club.name}"? This removes all its data.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/clubs/${club.id}`)
          setClubs(p => p.filter(c => c.id !== club.id))
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.message ?? 'Failed to delete.')
        }
      }},
    ])
  }

  if (loading) return <View style={styles.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search clubs…"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>{q ? 'No clubs match your search.' : 'No clubs yet.'}</Text>
        ) : filtered.map(club => (
          <View key={club.id} style={styles.listCard}>
            <View style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{club.name}</Text>
                <Text style={styles.listSub}>{sportLabel(club.sport)}{club.city ? ` · ${club.city}` : ''}</Text>
                <View style={styles.badgeRow}>
                  <Badge label={club.is_public ? 'Public' : 'Private'} color={club.is_public ? 'blue' : 'slate'} />
                  <Badge label={club.is_claimed ? 'Claimed' : 'Unclaimed'} color={club.is_claimed ? 'green' : 'amber'} />
                </View>
              </View>
              <View style={styles.actionCol}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(club)}>
                  <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(club)}>
                  <Ionicons name="trash-outline" size={15} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal === 'add' ? 'Add Club' : 'Edit Club'}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {[
                ['Club Name *', 'name', 'default'],
                ['City', 'city', 'default'],
                ['State', 'state', 'default'],
                ['Phone', 'phone', 'phone-pad'],
                ['Contact Email', 'contact_email', 'email-address'],
                ['Website', 'website', 'url'],
              ].map(([label, key, kbType]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={form[key] ?? ''}
                    onChangeText={v => setForm(p => ({ ...p, [key]: v }))}
                    keyboardType={kbType}
                    autoCapitalize={key === 'contact_email' || key === 'website' ? 'none' : 'sentences'}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Sport</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                  {SPORTS.map(s => (
                    <TouchableOpacity
                      key={s.value}
                      style={[styles.sportChip, form.sport === s.value && styles.sportChipActive]}
                      onPress={() => setForm(p => ({ ...p, sport: s.value }))}
                    >
                      <Text style={[styles.sportChipText, form.sport === s.value && styles.sportChipTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.toggleRow}>
                {[['is_public', 'Public'], ['is_claimed', 'Claimed']].map(([key, label]) => (
                  <TouchableOpacity key={key} style={styles.toggleItem} onPress={() => setForm(p => ({ ...p, [key]: !p[key] }))}>
                    <View style={[styles.toggle, form[key] && styles.toggleOn]}>
                      <View style={[styles.toggleThumb, form[key] && styles.toggleThumbOn]} />
                    </View>
                    <Text style={styles.toggleLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{modal === 'add' ? 'Create' : 'Save'}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    const matchQ = !q || u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchQ && matchRole
  })

  const ROLES = ['site_admin', 'club_admin', 'coach', 'athlete', 'parent']

  async function handleDelete(u) {
    Alert.alert('Delete User', `Delete "${u.full_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/users/${u.id}`)
          setUsers(p => p.filter(x => x.id !== u.id))
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.message ?? 'Failed.')
        }
      }},
    ])
  }

  if (loading) return <View style={styles.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { flex: 1 }]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search users…"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {['', ...ROLES].map(r => (
          <TouchableOpacity key={r} style={[styles.filterChip, roleFilter === r && styles.filterChipActive]} onPress={() => setRoleFilter(r)}>
            <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>{r || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No users found.</Text>
        ) : filtered.map(u => {
          const role = ROLE_META[u.role] ?? { label: u.role, color: 'slate' }
          return (
            <View key={u.id} style={styles.listCard}>
              <View style={styles.listRow}>
                <Avatar name={u.full_name} size="sm" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.listName}>{u.full_name || '—'}</Text>
                  <Text style={styles.listSub}>{u.email}</Text>
                  {u.club_name ? <Text style={styles.listSub}>{u.club_name}</Text> : null}
                  <View style={[styles.badgeRow, { marginTop: 4 }]}>
                    <Badge label={role.label} color={role.color} />
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(u)}>
                  <Ionicons name="trash-outline" size={15} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

// ── Claims tab ─────────────────────────────────────────────────────────────────

function ClaimsTab() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/club-claims').then(r => setClaims(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [])

  async function act(id, action) {
    setActionId(`${action}-${id}`)
    try {
      await api.put(`/club-claims/${id}/${action}`)
      load()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? `Failed to ${action}.`)
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <View style={styles.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  const pending  = claims.filter(c => c.status === 'pending')
  const resolved = claims.filter(c => c.status !== 'pending')

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {claims.length === 0 && <Text style={styles.emptyText}>No club claims.</Text>}

      {pending.length > 0 && (
        <View style={styles.claimsGroup}>
          <Text style={styles.claimsGroupTitle}>Pending ({pending.length})</Text>
          {pending.map(c => (
            <View key={c.id} style={[styles.listCard, styles.claimPending]}>
              <Text style={styles.listName}>{c.club_name ?? '—'}</Text>
              <Text style={styles.listSub}>{c.applicant_name} · {c.applicant_email}</Text>
              {c.message ? <Text style={styles.listSub} numberOfLines={2}>{c.message}</Text> : null}
              <View style={styles.claimActions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => act(c.id, 'approve')}
                  disabled={!!actionId}
                >
                  {actionId === `approve-${c.id}` ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.approveBtnText}>Approve</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => act(c.id, 'reject')}
                  disabled={!!actionId}
                >
                  {actionId === `reject-${c.id}` ? <ActivityIndicator color={colors.error} size="small" /> : <Text style={styles.rejectBtnText}>Reject</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {resolved.length > 0 && (
        <View style={styles.claimsGroup}>
          <Text style={styles.claimsGroupTitle}>Resolved</Text>
          {resolved.map(c => (
            <View key={c.id} style={styles.listCard}>
              <View style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listName}>{c.club_name ?? '—'}</Text>
                  <Text style={styles.listSub}>{c.applicant_name}</Text>
                </View>
                <Badge label={c.status} color={c.status === 'approved' ? 'green' : 'slate'} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

// ── Broadcast tab ─────────────────────────────────────────────────────────────

function BroadcastTab() {
  const [form, setForm] = useState({ title: '', body: '', target: 'all', link: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)

  const TARGETS = [
    { value: 'all',        label: 'All Users'   },
    { value: 'club_admin', label: 'Club Admins' },
    { value: 'coach',      label: 'Coaches'     },
    { value: 'athlete',    label: 'Athletes'    },
    { value: 'parent',     label: 'Parents'     },
  ]

  async function handleSend() {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Required', 'Title and message are required.')
      return
    }
    Alert.alert('Send Broadcast', `Send to: ${TARGETS.find(t => t.value === form.target)?.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        setSending(true)
        try {
          const { data } = await api.post('/admin/broadcast', form)
          setSent(data)
          setForm({ title: '', body: '', target: 'all', link: '' })
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send.')
        } finally {
          setSending(false)
        }
      }},
    ])
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.tabContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {sent ? (
          <View style={styles.sentBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.sentText}>Sent to {sent.recipients ?? '?'} users.</Text>
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Audience</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {TARGETS.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.filterChip, form.target === t.value && styles.filterChipActive, { marginRight: 8 }]}
              onPress={() => setForm(p => ({ ...p, target: t.value }))}
            >
              <Text style={[styles.filterChipText, form.target === t.value && styles.filterChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={[styles.input, { marginBottom: spacing.md }]}
          value={form.title}
          onChangeText={v => setForm(p => ({ ...p, title: v }))}
          placeholder="Notification title"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Message</Text>
        <TextInput
          style={[styles.input, styles.textarea, { marginBottom: spacing.md }]}
          value={form.body}
          onChangeText={v => setForm(p => ({ ...p, body: v }))}
          placeholder="Write your message…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.fieldLabel}>Link (optional)</Text>
        <TextInput
          style={[styles.input, { marginBottom: spacing.lg }]}
          value={form.link}
          onChangeText={v => setForm(p => ({ ...p, link: v }))}
          placeholder="https://…"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSend} disabled={sending}>
          {sending ? <ActivityIndicator color="#fff" size="small" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="megaphone-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Send Broadcast</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',  label: 'Overview',  iconName: 'shield-checkmark-outline' },
  { key: 'clubs',     label: 'Clubs',     iconName: 'business-outline'         },
  { key: 'users',     label: 'Users',     iconName: 'people-outline'           },
  { key: 'claims',    label: 'Claims',    iconName: 'key-outline'              },
  { key: 'broadcast', label: 'Broadcast', iconName: 'megaphone-outline'        },
]

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Ionicons name={t.iconName} size={15} color={activeTab === t.key ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabBtnText, activeTab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'overview'  && <OverviewTab />}
        {activeTab === 'clubs'     && <ClubsTab />}
        {activeTab === 'users'     && <UsersTab />}
        {activeTab === 'claims'    && <ClaimsTab />}
        {activeTab === 'broadcast' && <BroadcastTab />}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 52 },
  tabBarContent: { paddingHorizontal: spacing.md, gap: 4, alignItems: 'center', paddingVertical: 8 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: 'transparent' },
  tabBtnActive: { backgroundColor: colors.primaryLight },
  tabBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted },
  tabBtnTextActive: { color: colors.primary },

  tabContent: { padding: spacing.md, paddingBottom: spacing.xl },
  tabCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: font.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flex: 1, minWidth: '40%', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  cardValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  cardLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  searchRow: { flexDirection: 'row', gap: 10, padding: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.background },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: font.sm, color: colors.text },
  addBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },

  filterScroll: { maxHeight: 44, backgroundColor: colors.background },
  filterRow: { paddingHorizontal: spacing.md, gap: 8, alignItems: 'center', paddingBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  filterChipText: { fontSize: font.xs, fontWeight: '600', color: colors.textMuted },
  filterChipTextActive: { color: colors.primary },

  listCard: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  listRow: { flexDirection: 'row', alignItems: 'center' },
  listName: { fontSize: font.base, fontWeight: '700', color: colors.text },
  listSub: { fontSize: font.xs, color: colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  actionCol: { gap: 8, marginLeft: 8 },
  editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.errorLight, justifyContent: 'center', alignItems: 'center' },

  claimsGroup: { marginBottom: spacing.md },
  claimsGroupTitle: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  claimPending: { borderLeftWidth: 3, borderLeftColor: colors.warning },
  claimActions: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  approveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  rejectBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  rejectBtnText: { color: colors.error, fontWeight: '700', fontSize: font.sm },

  sentBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  sentText: { flex: 1, fontSize: font.sm, color: colors.primaryDark, fontWeight: '600' },

  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: font.base, color: colors.text, backgroundColor: '#fafafa' },
  textarea: { minHeight: 100 },
  sportChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  sportChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  sportChipText: { fontSize: font.xs, fontWeight: '600', color: colors.textMuted },
  sportChipTextActive: { color: colors.primary },
  toggleRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg, marginTop: spacing.sm },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: spacing.md, paddingBottom: spacing.md },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: font.base },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },

  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  modalBody: { padding: spacing.md },
})
