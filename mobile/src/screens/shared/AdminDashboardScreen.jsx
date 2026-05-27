import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, RefreshControl, Modal,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, font, spacing, radius } from '../../lib/theme'
import { SPORTS, FTEM_PHASES } from '../../lib/constants'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../../components/Avatar'

// ── constants ─────────────────────────────────────────────────────────────────

const ROLE_META = {
  site_admin: { label: 'Site Admin',  bg: '#ede9fe', text: '#6d28d9' },
  club_admin:  { label: 'Club Admin', bg: '#d1fae5', text: '#065f46' },
  coach:       { label: 'Coach',      bg: '#dbeafe', text: '#1e40af' },
  athlete:     { label: 'Athlete',    bg: '#f1f5f9', text: '#475569' },
  parent:      { label: 'Parent',     bg: '#fef3c7', text: '#92400e' },
}

const ACTION_META = {
  'claim.approved':    { label: 'Approved claim',    bg: '#d1fae5', text: '#065f46' },
  'claim.rejected':    { label: 'Rejected claim',    bg: '#fee2e2', text: '#b91c1c' },
  'claim.revoked':     { label: 'Revoked claim',     bg: '#ffedd5', text: '#c2410c' },
  'club.created':      { label: 'Created club',      bg: '#dbeafe', text: '#1e40af' },
  'club.updated':      { label: 'Updated club',      bg: '#f1f5f9', text: '#475569' },
  'club.deleted':      { label: 'Deleted club',      bg: '#fee2e2', text: '#b91c1c' },
  'user.role_changed': { label: 'Changed role',      bg: '#ede9fe', text: '#6d28d9' },
  'user.deleted':      { label: 'Deleted user',      bg: '#fee2e2', text: '#b91c1c' },
  'broadcast.sent':    { label: 'Sent broadcast',    bg: '#ede9fe', text: '#6d28d9' },
  'user.impersonated': { label: 'Impersonated user', bg: '#fef3c7', text: '#92400e' },
}

const ROLE_OPTIONS = Object.entries(ROLE_META).map(([v, m]) => ({ value: v, label: m.label }))
const SPORT_OPTIONS = SPORTS.map(s => ({ value: s.value, label: `${s.emoji} ${s.label}` }))

function fmtDateTime(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── DropdownSheet ─────────────────────────────────────────────────────────────

function DropdownSheet({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          <ScrollView contentContainerStyle={s.sheetOptions} showsVerticalScrollIndicator={false}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.sheetOption, selected === opt.value && s.sheetOptionActive]}
                onPress={() => { onSelect(opt.value); onClose() }}
                activeOpacity={0.7}
              >
                <Text style={[s.sheetOptionText, selected === opt.value && s.sheetOptionTextActive]}>
                  {opt.label}
                </Text>
                {selected === opt.value && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const m = ROLE_META[role] ?? { label: role, bg: '#f1f5f9', text: '#475569' }
  return (
    <View style={[s.badge, { backgroundColor: m.bg }]}>
      <Text style={[s.badgeText, { color: m.text }]}>{m.label}</Text>
    </View>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ iconName, label, value, iconColor }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIconBox, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <Text style={s.statValue}>{value ?? '—'}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function ToggleRow({ label, value, onChange }) {
  return (
    <View style={s.toggleRow}>
      <Text style={s.toggleLabel}>{label}</Text>
      <Switch
        value={!!value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : '#fff'}
      />
    </View>
  )
}

// ── OverviewTab ───────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={s.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  return (
    <ScrollView contentContainerStyle={s.tabPad} showsVerticalScrollIndicator={false}>
      <Text style={s.sectionLabel}>Platform</Text>
      <View style={s.statGrid}>
        <StatCard iconName="people-outline"           label="Total Users"     value={stats?.users_total}       iconColor="#3b82f6" />
        <StatCard iconName="business-outline"         label="Total Clubs"     value={stats?.clubs_total}       iconColor="#10b981" />
        <StatCard iconName="barbell-outline"          label="Active Athletes" value={stats?.athletes_active}   iconColor="#8b5cf6" />
        <StatCard iconName="shield-outline"           label="Pending Claims"  value={stats?.pending_claims}    iconColor="#f59e0b" />
      </View>
      <Text style={s.sectionLabel}>By role</Text>
      <View style={s.statGrid}>
        <StatCard iconName="key-outline"              label="Club Admins"     value={stats?.users_by_role?.club_admin}  iconColor="#10b981" />
        <StatCard iconName="fitness-outline"          label="Coaches"         value={stats?.users_by_role?.coach}       iconColor="#3b82f6" />
        <StatCard iconName="person-outline"           label="Athletes"        value={stats?.users_by_role?.athlete}     iconColor="#8b5cf6" />
        <StatCard iconName="calendar-outline"         label="Active Seasons"  value={stats?.active_seasons}             iconColor="#f43f5e" />
      </View>
      <Text style={s.sectionLabel}>Clubs</Text>
      <View style={s.statGrid}>
        <StatCard iconName="globe-outline"            label="Public"          value={stats?.clubs_public}      iconColor="#3b82f6" />
        <StatCard iconName="checkmark-circle-outline" label="Claimed"         value={stats?.clubs_claimed}     iconColor="#10b981" />
        <StatCard iconName="alert-circle-outline"     label="Unclaimed"       value={stats != null ? (stats.clubs_total ?? 0) - (stats.clubs_claimed ?? 0) : null} iconColor="#f59e0b" />
      </View>
    </ScrollView>
  )
}

// ── ClubsTab ──────────────────────────────────────────────────────────────────

const CLUB_EMPTY = { name: '', sport: 'soccer', city: '', state: '', description: '', website: '', contact_email: '', phone: '', is_public: false, is_claimed: false }

function ClubsTab() {
  const [clubs,   setClubs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [q,       setQ]       = useState('')
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState(CLUB_EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [sportSheet, setSportSheet] = useState(false)

  const load = useCallback(() => {
    api.get('/clubs/all').then(r => setClubs(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return clubs.filter(c => !q || c.name.toLowerCase().includes(ql) || c.slug?.includes(ql))
  }, [clubs, q])

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
    } finally { setSaving(false) }
  }

  function handleDelete(club) {
    Alert.alert('Delete Club', `Delete "${club.name}"?\n\nThis permanently removes the club and ALL its data.`, [
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

  if (loading) return <View style={s.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput style={s.searchInput} value={q} onChangeText={setQ}
            placeholder="Search clubs…" placeholderTextColor={colors.textMuted} />
          {!!q && <TouchableOpacity onPress={() => setQ('')}><Ionicons name="close-circle" size={16} color={colors.textMuted} /></TouchableOpacity>}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.tabPad} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={s.emptyText}>{q ? 'No clubs match your search.' : 'No clubs yet.'}</Text>
        ) : filtered.map(club => (
          <View key={club.id} style={s.listCard}>
            <View style={s.listCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.listName}>{club.name}</Text>
                <Text style={s.listSub}>{SPORTS.find(sp => sp.value === club.sport)?.label ?? club.sport}{club.city ? ` · ${club.city}` : ''}{club.state ? `, ${club.state}` : ''}</Text>
                <View style={s.chipRow}>
                  <View style={[s.badge, { backgroundColor: club.is_public ? '#dbeafe' : '#f1f5f9' }]}>
                    <Text style={[s.badgeText, { color: club.is_public ? '#1e40af' : '#64748b' }]}>{club.is_public ? 'Public' : 'Private'}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: club.is_claimed ? '#d1fae5' : '#fef3c7' }]}>
                    <Text style={[s.badgeText, { color: club.is_claimed ? '#065f46' : '#92400e' }]}>{club.is_claimed ? 'Claimed' : 'Unclaimed'}</Text>
                  </View>
                </View>
              </View>
              <View style={s.rowActions}>
                <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(club)}>
                  <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={() => handleDelete(club)}>
                  <Ionicons name="trash-outline" size={15} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add / Edit modal */}
      <Modal visible={!!modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={s.modalSafe} edges={['top', 'bottom']}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setModal(null)} style={s.modalCancelBtn}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>{modal === 'add' ? 'Add Club' : 'Edit Club'}</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.modalSaveBtn, saving && { opacity: 0.5 }]}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalSaveText}>{modal === 'add' ? 'Create' : 'Save'}</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
              {[
                ['Club Name *', 'name', 'default'],
                ['City',        'city',          'default'],
                ['State',       'state',         'default'],
                ['Phone',       'phone',         'phone-pad'],
                ['Contact Email', 'contact_email', 'email-address'],
                ['Website',     'website',       'url'],
              ].map(([label, key, kbType]) => (
                <View key={key} style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>{label}</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={form[key] ?? ''}
                    onChangeText={v => setForm(p => ({ ...p, [key]: v }))}
                    keyboardType={kbType}
                    autoCapitalize={['contact_email', 'website'].includes(key) ? 'none' : 'sentences'}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}

              {/* Sport picker */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Sport</Text>
                <TouchableOpacity style={s.pickerBtn} onPress={() => setSportSheet(true)} activeOpacity={0.7}>
                  <Text style={s.pickerBtnText}>
                    {SPORTS.find(sp => sp.value === form.sport)?.emoji} {SPORTS.find(sp => sp.value === form.sport)?.label ?? 'Select sport'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Description</Text>
                <TextInput
                  style={[s.fieldInput, s.fieldMultiline]}
                  value={form.description ?? ''}
                  onChangeText={v => setForm(p => ({ ...p, description: v }))}
                  multiline numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <ToggleRow label="Public" value={form.is_public} onChange={v => setForm(p => ({ ...p, is_public: v }))} />
              <ToggleRow label="Claimed" value={form.is_claimed} onChange={v => setForm(p => ({ ...p, is_claimed: v }))} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>

        {/* Sport dropdown (inside modal — nested Modal) */}
        <DropdownSheet
          visible={sportSheet}
          title="Select Sport"
          options={SPORT_OPTIONS}
          selected={form.sport}
          onSelect={v => setForm(p => ({ ...p, sport: v }))}
          onClose={() => setSportSheet(false)}
        />
      </Modal>
    </View>
  )
}

// ── UsersTab ──────────────────────────────────────────────────────────────────

function UsersTab({ clubs }) {
  const { impersonate } = useAuth()
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [q,        setQ]        = useState('')
  const [roleF,    setRoleF]    = useState('')
  const [editUser, setEditUser] = useState(null)
  const [form,     setForm]     = useState({})
  const [saving,   setSaving]   = useState(false)
  const [roleSheet,  setRoleSheet]  = useState(false)
  const [clubSheet,  setClubSheet]  = useState(false)
  const [impersonating, setImpersonating] = useState(null)
  const [filterSheet, setFilterSheet] = useState(false)

  useEffect(() => {
    api.get('/admin/users')
      .then(r => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return users.filter(u => {
      if (roleF && u.role !== roleF) return false
      if (q && !u.full_name?.toLowerCase().includes(ql) && !u.email?.toLowerCase().includes(ql)) return false
      return true
    })
  }, [users, q, roleF])

  function openEdit(u) {
    setEditUser(u)
    setForm({ full_name: u.full_name ?? '', email: u.email ?? '', role: u.role, club_id: u.club_id ?? '' })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.put(`/admin/users/${editUser.id}`, { ...form, club_id: form.club_id || null })
      const clubName = clubs.find(c => c.id === form.club_id)?.name ?? null
      setUsers(p => p.map(u => u.id === editUser.id
        ? { ...u, full_name: form.full_name, email: form.email, role: form.role, club_id: form.club_id || null, club_name: clubName }
        : u))
      setEditUser(null)
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to update.')
    } finally { setSaving(false) }
  }

  function handleDelete(u) {
    Alert.alert('Delete User', `Delete "${u.full_name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/users/${u.id}`)
          setUsers(p => p.filter(x => x.id !== u.id))
        } catch (e) { Alert.alert('Error', e?.response?.data?.message ?? 'Failed.') }
      }},
    ])
  }

  async function handleImpersonate(u) {
    Alert.alert('Impersonate', `Log in as ${u.full_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Impersonate', onPress: async () => {
        setImpersonating(u.id)
        try { await impersonate(u.id) }
        catch (e) { Alert.alert('Error', e?.response?.data?.message ?? 'Failed.') }
        finally { setImpersonating(null) }
      }},
    ])
  }

  const needsClub = ['club_admin', 'coach'].includes(form.role)
  const clubOptions = [{ value: '', label: '— No club —' }, ...clubs.map(c => ({ value: c.id, label: c.name }))]
  const roleFilterOptions = [{ value: '', label: 'All roles' }, ...ROLE_OPTIONS]

  if (loading) return <View style={s.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput style={s.searchInput} value={q} onChangeText={setQ}
            placeholder="Search users…" placeholderTextColor={colors.textMuted} />
          {!!q && <TouchableOpacity onPress={() => setQ('')}><Ionicons name="close-circle" size={16} color={colors.textMuted} /></TouchableOpacity>}
        </View>
        <TouchableOpacity style={s.filterBtn} onPress={() => setFilterSheet(true)} activeOpacity={0.8}>
          <Ionicons name="filter-outline" size={15} color={roleF ? colors.primary : colors.textMuted} />
          <Text style={[s.filterBtnText, roleF && s.filterBtnTextActive]}>
            {roleF ? (ROLE_META[roleF]?.label ?? roleF) : 'All roles'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.tabPad} showsVerticalScrollIndicator={false}>
        <Text style={s.listCount}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</Text>
        {filtered.length === 0 ? (
          <Text style={s.emptyText}>No users found.</Text>
        ) : filtered.map(u => (
          <View key={u.id} style={s.listCard}>
            <View style={s.listCardRow}>
              <Avatar name={u.full_name} size="sm" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.listName}>{u.full_name || '—'}</Text>
                <Text style={s.listSub}>{u.email}</Text>
                {!!u.club_name && <Text style={s.listSub}>{u.club_name}</Text>}
                <View style={s.chipRow}><RoleBadge role={u.role} /></View>
              </View>
              <View style={s.rowActions}>
                <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(u)}>
                  <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={() => handleDelete(u)}>
                  <Ionicons name="trash-outline" size={15} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            {u.role !== 'site_admin' && (
              <TouchableOpacity
                style={[s.impersonateBtn, impersonating === u.id && { opacity: 0.5 }]}
                onPress={() => handleImpersonate(u)}
                disabled={!!impersonating}
                activeOpacity={0.8}
              >
                {impersonating === u.id
                  ? <ActivityIndicator size="small" color="#92400e" />
                  : <Ionicons name="person-circle-outline" size={14} color="#92400e" />}
                <Text style={s.impersonateBtnText}>Log in as this user</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Role filter sheet */}
      <DropdownSheet
        visible={filterSheet}
        title="Filter by Role"
        options={roleFilterOptions}
        selected={roleF}
        onSelect={setRoleF}
        onClose={() => setFilterSheet(false)}
      />

      {/* Edit modal */}
      <Modal visible={!!editUser} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditUser(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={s.modalSafe} edges={['top', 'bottom']}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setEditUser(null)} style={s.modalCancelBtn}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.modalSaveBtn, saving && { opacity: 0.5 }]}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
              {[['Full Name', 'full_name', 'default'], ['Email', 'email', 'email-address']].map(([label, key, kbType]) => (
                <View key={key} style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>{label}</Text>
                  <TextInput style={s.fieldInput} value={form[key] ?? ''}
                    onChangeText={v => setForm(p => ({ ...p, [key]: v }))}
                    keyboardType={kbType} autoCapitalize={key === 'email' ? 'none' : 'words'}
                    placeholderTextColor={colors.textMuted} />
                </View>
              ))}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Role</Text>
                <TouchableOpacity style={s.pickerBtn} onPress={() => setRoleSheet(true)} activeOpacity={0.7}>
                  <Text style={s.pickerBtnText}>{ROLE_META[form.role]?.label ?? form.role}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {needsClub && (
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Club</Text>
                  <TouchableOpacity style={s.pickerBtn} onPress={() => setClubSheet(true)} activeOpacity={0.7}>
                    <Text style={s.pickerBtnText}>
                      {clubs.find(c => c.id === form.club_id)?.name ?? '— No club —'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
        <DropdownSheet visible={roleSheet} title="Select Role" options={ROLE_OPTIONS}
          selected={form.role} onSelect={v => setForm(p => ({ ...p, role: v, club_id: ['club_admin','coach'].includes(v) ? p.club_id : '' }))}
          onClose={() => setRoleSheet(false)} />
        <DropdownSheet visible={clubSheet} title="Select Club" options={clubOptions}
          selected={form.club_id} onSelect={v => setForm(p => ({ ...p, club_id: v }))}
          onClose={() => setClubSheet(false)} />
      </Modal>
    </View>
  )
}

// ── AthletesTab ───────────────────────────────────────────────────────────────

function AthletesTab({ clubs }) {
  const [athletes, setAthletes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [q,        setQ]        = useState('')
  const [clubF,    setClubF]    = useState('')
  const [clubSheet, setClubSheet] = useState(false)

  useEffect(() => {
    api.get('/admin/athletes')
      .then(r => setAthletes(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return athletes.filter(a => {
      if (clubF && a.club_id !== clubF) return false
      if (q && !`${a.first_name} ${a.last_name}`.toLowerCase().includes(ql)) return false
      return true
    })
  }, [athletes, q, clubF])

  const clubOptions = [{ value: '', label: 'All clubs' }, ...clubs.map(c => ({ value: c.id, label: c.name }))]

  if (loading) return <View style={s.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput style={s.searchInput} value={q} onChangeText={setQ}
            placeholder="Search athletes…" placeholderTextColor={colors.textMuted} />
          {!!q && <TouchableOpacity onPress={() => setQ('')}><Ionicons name="close-circle" size={16} color={colors.textMuted} /></TouchableOpacity>}
        </View>
        <TouchableOpacity style={s.filterBtn} onPress={() => setClubSheet(true)} activeOpacity={0.8}>
          <Ionicons name="business-outline" size={15} color={clubF ? colors.primary : colors.textMuted} />
          <Text style={[s.filterBtnText, clubF && s.filterBtnTextActive]} numberOfLines={1}>
            {clubF ? (clubs.find(c => c.id === clubF)?.name ?? 'Club') : 'All clubs'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.tabPad} showsVerticalScrollIndicator={false}>
        <Text style={s.listCount}>{filtered.length} athlete{filtered.length !== 1 ? 's' : ''}</Text>
        {filtered.length === 0 ? (
          <Text style={s.emptyText}>No athletes found.</Text>
        ) : filtered.map(a => {
          const initials = `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase()
          const sport = SPORTS.find(sp => sp.value === a.sport)
          const phase = a.ftem_phase ? FTEM_PHASES[a.ftem_phase] : null
          return (
            <View key={a.id} style={s.listCard}>
              <View style={s.listCardRow}>
                <View style={s.athleteAvatar}>
                  <Text style={s.athleteAvatarText}>{initials || '?'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.listName}>{a.first_name} {a.last_name}</Text>
                  <Text style={s.listSub}>{a.club_name ?? '—'}</Text>
                  {!!sport && <Text style={s.listSub}>{sport.emoji} {sport.label}</Text>}
                  <View style={s.chipRow}>
                    {phase && (
                      <View style={[s.badge, { backgroundColor: phase.bgColor }]}>
                        <Text style={[s.badgeText, { color: phase.textColor }]}>{a.ftem_phase}</Text>
                      </View>
                    )}
                    <View style={[s.badge, { backgroundColor: a.is_active ? '#d1fae5' : '#f1f5f9' }]}>
                      <Text style={[s.badgeText, { color: a.is_active ? '#065f46' : '#64748b' }]}>{a.is_active ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )
        })}
      </ScrollView>

      <DropdownSheet visible={clubSheet} title="Filter by Club" options={clubOptions}
        selected={clubF} onSelect={setClubF} onClose={() => setClubSheet(false)} />
    </View>
  )
}

// ── ClaimsTab ─────────────────────────────────────────────────────────────────

function ClaimsTab() {
  const [claims,  setClaims]  = useState([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState(null)
  const [creds,   setCreds]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/club-claims').then(r => setClaims(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [])

  async function act(id, action) {
    setActing(`${id}-${action}`)
    try {
      const { data } = await api.put(`/club-claims/${id}/${action}`)
      if (action === 'approve' && data.temp_password) {
        setCreds({ email: data.email, password: data.temp_password })
      }
      load()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? `Failed to ${action}.`)
    } finally { setActing(null) }
  }

  if (loading) return <View style={s.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  const pending  = claims.filter(c => c.status === 'pending')
  const resolved = claims.filter(c => c.status !== 'pending')

  return (
    <ScrollView contentContainerStyle={s.tabPad} showsVerticalScrollIndicator={false}>
      {/* Credential banner */}
      {creds && (
        <View style={s.credBanner}>
          <Text style={s.credBannerTitle}>Account created — share these credentials</Text>
          <Text style={s.credBannerSub}>Send these to the club manager. The password cannot be retrieved again.</Text>
          <View style={s.credRow}>
            <View style={s.credItem}>
              <Text style={s.credItemLabel}>Email</Text>
              <View style={s.credChip}><Text style={s.credChipText} selectable>{creds.email}</Text></View>
            </View>
            <View style={s.credItem}>
              <Text style={s.credItemLabel}>Temp password</Text>
              <View style={s.credChip}><Text style={s.credChipText} selectable>{creds.password}</Text></View>
            </View>
          </View>
          <TouchableOpacity onPress={() => setCreds(null)}><Text style={s.credDismiss}>Dismiss</Text></TouchableOpacity>
        </View>
      )}

      {claims.length === 0 && !creds && <Text style={s.emptyText}>No club claims.</Text>}

      {/* Pending */}
      {pending.length > 0 && (
        <View style={s.claimsGroup}>
          <Text style={s.claimsGroupTitle}>Pending · {pending.length}</Text>
          {pending.map(c => (
            <View key={c.id} style={[s.listCard, s.claimPendingCard]}>
              <Text style={s.listName}>{c.club?.name ?? c.name ?? '—'}</Text>
              {c.club?.city && <Text style={s.listSub}>{c.club.city}{c.club.state ? `, ${c.club.state}` : ''}</Text>}
              <Text style={s.listSub}>{c.name ?? c.applicant_name} · {c.email ?? c.applicant_email}</Text>
              {!!c.phone && <Text style={s.listSub}>{c.phone}</Text>}
              {!!c.role_at_club && <Text style={s.listSub}>Role: {c.role_at_club}</Text>}
              {!!c.message && <Text style={[s.listSub, { fontStyle: 'italic' }]} numberOfLines={2}>"{c.message}"</Text>}
              <View style={s.claimActions}>
                <TouchableOpacity style={[s.approveBtn, acting && { opacity: 0.5 }]} onPress={() => act(c.id, 'approve')} disabled={!!acting}>
                  {acting === `${c.id}-approve` ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark-circle" size={15} color="#fff" /><Text style={s.approveBtnText}>Approve</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={[s.rejectBtn, acting && { opacity: 0.5 }]} onPress={() => act(c.id, 'reject')} disabled={!!acting}>
                  {acting === `${c.id}-reject` ? <ActivityIndicator color={colors.error} size="small" /> : <><Ionicons name="close-circle-outline" size={15} color={colors.error} /><Text style={s.rejectBtnText}>Reject</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <View style={s.claimsGroup}>
          <Text style={s.claimsGroupTitle}>Resolved · {resolved.length}</Text>
          <View style={s.resolvedCard}>
            {resolved.map((c, idx) => (
              <View key={c.id} style={[s.resolvedRow, idx < resolved.length - 1 && s.resolvedRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.listName} numberOfLines={1}>{c.club?.name ?? '—'}</Text>
                  <Text style={s.listSub}>{c.name ?? c.applicant_name}</Text>
                </View>
                <View style={[s.badge, {
                  backgroundColor: c.status === 'approved' ? '#d1fae5' : c.status === 'revoked' ? '#fee2e2' : '#f1f5f9',
                }]}>
                  <Text style={[s.badgeText, { color: c.status === 'approved' ? '#065f46' : c.status === 'revoked' ? '#b91c1c' : '#64748b' }]}>
                    {c.status}
                  </Text>
                </View>
                {c.status === 'approved' && (
                  <TouchableOpacity style={[s.revokeBtn, acting && { opacity: 0.5 }]} onPress={() => act(c.id, 'revoke')} disabled={!!acting}>
                    {acting === `${c.id}-revoke` ? <ActivityIndicator size="small" color={colors.error} /> : <Text style={s.revokeBtnText}>Revoke</Text>}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

// ── BroadcastTab ──────────────────────────────────────────────────────────────

function BroadcastTab({ clubs }) {
  const [form,       setForm]       = useState({ title: '', body: '', link: '', target: 'all' })
  const [confirming, setConfirming] = useState(false)
  const [sending,    setSending]    = useState(false)
  const [lastSent,   setLastSent]   = useState(null)
  const [targetSheet, setTargetSheet] = useState(false)

  const targetOptions = [
    { value: 'all',             label: 'All users' },
    { value: 'role:athlete',    label: 'Athletes only' },
    { value: 'role:coach',      label: 'Coaches only' },
    { value: 'role:club_admin', label: 'Club admins only' },
    { value: 'role:parent',     label: 'Parents only' },
    ...clubs.map(c => ({ value: `club:${c.id}`, label: `Club: ${c.name}` })),
  ]
  const audienceLabel = targetOptions.find(o => o.value === form.target)?.label ?? form.target

  async function handleSend() {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Required', 'Title and message are required.')
      return
    }
    setConfirming(true)
  }

  async function confirmSend() {
    setConfirming(false)
    setSending(true)
    try {
      const { data } = await api.post('/admin/broadcast', form)
      setLastSent({ ...form, count: data.count })
      setForm({ title: '', body: '', link: '', target: 'all' })
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send.')
    } finally { setSending(false) }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.tabPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {lastSent && (
          <View style={s.sentBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={s.sentText}>Sent to {lastSent.count} user{lastSent.count !== 1 ? 's' : ''}: "{lastSent.title}"</Text>
          </View>
        )}

        {/* Audience */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Audience</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setTargetSheet(true)} activeOpacity={0.7}>
            <Text style={s.pickerBtnText}>{audienceLabel}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Title *</Text>
          <TextInput style={s.fieldInput} value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))}
            placeholder="e.g. Scheduled maintenance tonight" placeholderTextColor={colors.textMuted} />
        </View>

        {/* Message */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Message *</Text>
          <TextInput style={[s.fieldInput, s.fieldMultiline]} value={form.body}
            onChangeText={v => setForm(p => ({ ...p, body: v }))}
            placeholder="What do you want users to know?" placeholderTextColor={colors.textMuted}
            multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        {/* Link */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Link <Text style={s.fieldOptional}>(optional)</Text></Text>
          <TextInput style={s.fieldInput} value={form.link} onChangeText={v => setForm(p => ({ ...p, link: v }))}
            placeholder="/dashboard or https://…" placeholderTextColor={colors.textMuted}
            autoCapitalize="none" keyboardType="url" />
        </View>

        {confirming ? (
          <View style={s.confirmBox}>
            <Text style={s.confirmTitle}>Send to {audienceLabel}?</Text>
            <Text style={s.confirmSub}>"{form.title}"</Text>
            <View style={s.confirmActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirming(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.broadcastSendBtn} onPress={confirmSend}>
                <Ionicons name="megaphone-outline" size={16} color="#fff" />
                <Text style={s.broadcastSendBtnText}>Yes, send it</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[s.broadcastSendBtn, sending && { opacity: 0.5 }]} onPress={handleSend} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="megaphone-outline" size={18} color="#fff" />}
            <Text style={s.broadcastSendBtnText}>{sending ? 'Sending…' : 'Send broadcast'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <DropdownSheet visible={targetSheet} title="Select Audience" options={targetOptions}
        selected={form.target} onSelect={v => setForm(p => ({ ...p, target: v }))} onClose={() => setTargetSheet(false)} />
    </KeyboardAvoidingView>
  )
}

// ── ActivityTab ───────────────────────────────────────────────────────────────

function ActivityTab() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const [filterSheet, setFilterSheet] = useState(false)

  useEffect(() => {
    api.get('/admin/activity-log')
      .then(r => setLogs(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => filter ? logs.filter(l => l.action === filter) : logs, [logs, filter])

  const actionOptions = [
    { value: '', label: 'All actions' },
    ...Object.entries(ACTION_META).map(([v, m]) => ({ value: v, label: m.label })),
  ]

  function metaDescription(log) {
    try {
      const m = log.metadata ? JSON.parse(log.metadata) : null
      if (!m) return null
      if (log.action === 'user.role_changed') return `${m.from} → ${m.to}`
      if (log.action === 'broadcast.sent')    return `${m.recipients} recipients · target: ${m.target}`
      return null
    } catch { return null }
  }

  if (loading) return <View style={s.tabCenter}><ActivityIndicator color={colors.primary} /></View>

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchRow}>
        <TouchableOpacity style={[s.filterBtn, { flex: 1 }]} onPress={() => setFilterSheet(true)} activeOpacity={0.8}>
          <Ionicons name="filter-outline" size={15} color={filter ? colors.primary : colors.textMuted} />
          <Text style={[s.filterBtnText, filter && s.filterBtnTextActive]}>
            {filter ? (ACTION_META[filter]?.label ?? filter) : 'All actions'}
          </Text>
        </TouchableOpacity>
        <Text style={s.listCount}>{filtered.length} entries</Text>
      </View>
      <ScrollView contentContainerStyle={s.tabPad} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={s.emptyText}>No activity recorded yet.</Text>
        ) : filtered.map(log => {
          const meta = ACTION_META[log.action] ?? { label: log.action, bg: '#f1f5f9', text: '#64748b' }
          const desc = metaDescription(log)
          return (
            <View key={log.id} style={[s.listCard, s.activityRow]}>
              <View style={[s.badge, { backgroundColor: meta.bg, alignSelf: 'flex-start', flexShrink: 0 }]}>
                <Text style={[s.badgeText, { color: meta.text }]}>{meta.label}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.activityText}>
                  <Text style={{ fontWeight: '700' }}>{log.admin_name}</Text>
                  {log.target_name ? <Text style={{ color: colors.textSecondary }}> → {log.target_name}</Text> : null}
                </Text>
                {!!desc && <Text style={s.activityMeta}>{desc}</Text>}
                <Text style={s.activityTime}>{fmtDateTime(log.created_at)}</Text>
              </View>
            </View>
          )
        })}
      </ScrollView>
      <DropdownSheet visible={filterSheet} title="Filter by Action" options={actionOptions}
        selected={filter} onSelect={setFilter} onClose={() => setFilterSheet(false)} />
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',  label: 'Overview',  icon: 'shield-checkmark-outline' },
  { key: 'clubs',     label: 'Clubs',     icon: 'business-outline'         },
  { key: 'users',     label: 'Users',     icon: 'people-outline'           },
  { key: 'athletes',  label: 'Athletes',  icon: 'barbell-outline'          },
  { key: 'claims',    label: 'Claims',    icon: 'key-outline'              },
  { key: 'broadcast', label: 'Broadcast', icon: 'megaphone-outline'        },
  { key: 'activity',  label: 'Activity',  icon: 'time-outline'             },
]

export default function AdminDashboardScreen() {
  const [activeTab,   setActiveTab]   = useState('overview')
  const [clubs,       setClubs]       = useState([])
  const [claimBadge,  setClaimBadge]  = useState(0)

  useEffect(() => {
    api.get('/clubs/all').then(r => setClubs(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    api.get('/club-claims').then(r => setClaimBadge((r.data || []).filter(c => c.status === 'pending').length)).catch(() => {})
  }, [])

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {/* Tab bar (navigation — horizontal scroll is appropriate here) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBar}
        contentContainerStyle={s.tabBarContent}
      >
        {TABS.map(t => {
          const active = activeTab === t.key
          return (
            <TouchableOpacity key={t.key} style={[s.tabBtn, active && s.tabBtnActive]} onPress={() => setActiveTab(t.key)}>
              <Ionicons name={t.icon} size={14} color={active ? colors.primary : colors.textMuted} />
              <Text style={[s.tabBtnText, active && s.tabBtnTextActive]}>{t.label}</Text>
              {t.key === 'claims' && claimBadge > 0 && (
                <View style={s.tabBadge}><Text style={s.tabBadgeText}>{claimBadge}</Text></View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'overview'  && <OverviewTab />}
        {activeTab === 'clubs'     && <ClubsTab />}
        {activeTab === 'users'     && <UsersTab clubs={clubs} />}
        {activeTab === 'athletes'  && <AthletesTab clubs={clubs} />}
        {activeTab === 'claims'    && <ClaimsTab />}
        {activeTab === 'broadcast' && <BroadcastTab clubs={clubs} />}
        {activeTab === 'activity'  && <ActivityTab />}
      </View>
    </SafeAreaView>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Tab bar
  tabBar:        { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 52 },
  tabBarContent: { paddingHorizontal: spacing.md, gap: 4, alignItems: 'center', paddingVertical: 8 },
  tabBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  tabBtnActive:  { backgroundColor: colors.primaryLight },
  tabBtnText:    { fontSize: font.sm, fontWeight: '600', color: colors.textMuted },
  tabBtnTextActive: { color: colors.primary },
  tabBadge:      { backgroundColor: '#f59e0b', borderRadius: 999, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  tabBadgeText:  { color: '#fff', fontSize: 9, fontWeight: '800' },

  tabCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabPad:    { padding: spacing.md, paddingBottom: spacing.xl },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: font.sm },
  listCount: { fontSize: font.xs, color: colors.textMuted, marginBottom: spacing.sm, fontWeight: '600' },

  sectionLabel: {
    fontSize: font.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
  },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: '#fff', borderRadius: radius.xl,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statIconBox:  { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue:    { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel:    { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  // Search / filter row
  searchRow:  { flexDirection: 'row', gap: 8, padding: spacing.md, paddingBottom: spacing.sm },
  searchBox:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: font.sm, color: colors.text },
  addBtn:     { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  filterBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 40, borderRadius: radius.md, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, maxWidth: 140 },
  filterBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.textMuted, flexShrink: 1 },
  filterBtnTextActive: { color: colors.primary },

  // List cards
  listCard: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  listCardRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listName:     { fontSize: font.base, fontWeight: '700', color: colors.text },
  listSub:      { fontSize: font.xs, color: colors.textSecondary, marginTop: 2 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  rowActions:   { gap: 8, flexShrink: 0 },
  iconBtn:      { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  iconBtnDanger: { backgroundColor: colors.errorLight },

  badge:     { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Athlete avatar
  athleteAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  athleteAvatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Impersonate
  impersonateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: '#fef3c7', borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
  },
  impersonateBtnText: { fontSize: font.xs, fontWeight: '700', color: '#92400e' },

  // Claims
  claimsGroup:      { marginBottom: spacing.md },
  claimsGroupTitle: { fontSize: font.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  claimPendingCard: { borderLeftWidth: 3, borderLeftColor: colors.warning },
  claimActions:     { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, minHeight: 44,
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md, paddingVertical: 10, minHeight: 44,
  },
  rejectBtnText: { color: colors.error, fontWeight: '700', fontSize: font.sm },

  resolvedCard: { backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight },
  resolvedRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingVertical: 12 },
  resolvedRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  revokeBtn: {
    borderWidth: 1, borderColor: colors.error, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  revokeBtnText: { fontSize: font.xs, fontWeight: '700', color: colors.error },

  // Credential banner
  credBanner: {
    backgroundColor: '#ecfdf5', borderRadius: radius.xl,
    borderWidth: 2, borderColor: '#6ee7b7',
    padding: 16, marginBottom: spacing.md,
  },
  credBannerTitle: { fontSize: font.sm, fontWeight: '800', color: '#065f46', marginBottom: 4 },
  credBannerSub:   { fontSize: font.xs, color: '#047857', marginBottom: 12 },
  credRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  credItem:        { gap: 4 },
  credItemLabel:   { fontSize: font.xs, fontWeight: '700', color: '#065f46' },
  credChip:        { backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#a7f3d0' },
  credChipText:    { fontSize: font.xs, fontFamily: 'monospace', color: '#064e3b' },
  credDismiss:     { fontSize: font.xs, color: '#059669', textDecorationLine: 'underline' },

  // Broadcast
  sentBanner:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  sentText:        { flex: 1, fontSize: font.sm, color: colors.primaryDark, fontWeight: '600' },
  confirmBox: {
    backgroundColor: '#fffbeb', borderRadius: radius.xl, borderWidth: 1, borderColor: '#fde68a',
    padding: 16, marginTop: 4,
  },
  confirmTitle:   { fontSize: font.sm, fontWeight: '700', color: '#92400e', textAlign: 'center', marginBottom: 4 },
  confirmSub:     { fontSize: font.xs, color: '#b45309', textAlign: 'center', marginBottom: 12 },
  confirmActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:      { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText:  { color: colors.textSecondary, fontWeight: '600', fontSize: font.sm },
  broadcastSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    flex: 1, backgroundColor: '#8b5cf6', borderRadius: radius.lg, paddingVertical: 14, minHeight: 48,
  },
  broadcastSendBtnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },

  // Activity
  activityRow:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  activityText: { fontSize: font.sm, color: colors.text, marginBottom: 2 },
  activityMeta: { fontSize: font.xs, color: colors.textMuted, marginBottom: 2 },
  activityTime: { fontSize: font.xs, color: colors.textMuted },

  // Modal
  modalSafe:       { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: '#fff',
  },
  modalTitle:      { fontSize: font.md, fontWeight: '800', color: colors.text },
  modalCancelBtn:  { paddingVertical: 4, paddingHorizontal: 4 },
  modalCancelText: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
  modalSaveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 70, alignItems: 'center',
  },
  modalSaveText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
  modalBody:     { padding: spacing.md, paddingBottom: 40, gap: 14 },

  fieldGroup:    { gap: 6 },
  fieldLabel:    { fontSize: font.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldOptional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
  fieldInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: font.sm, color: colors.text, backgroundColor: '#fff', minHeight: 48,
  },
  fieldMultiline: { minHeight: 88, paddingTop: 12 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#fff',
  },
  pickerBtnText: { fontSize: font.sm, color: colors.text, flex: 1 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 12,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetTitle:  { fontSize: font.sm, fontWeight: '800', color: colors.text, paddingHorizontal: 20, paddingVertical: 12 },
  sheetOptions: { paddingHorizontal: 12, paddingBottom: 20 },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 14, borderRadius: radius.lg,
  },
  sheetOptionActive:  { backgroundColor: colors.primaryLight },
  sheetOptionText:    { fontSize: font.sm, color: colors.text },
  sheetOptionTextActive: { fontWeight: '700', color: colors.primary },
})
