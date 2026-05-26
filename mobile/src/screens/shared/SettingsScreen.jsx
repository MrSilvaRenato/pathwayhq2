import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert, Switch, Modal, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { ROLES, SPORTS, STATES, SUBSCRIPTION_TIERS } from '../../lib/constants'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Constants from 'expo-constants'

function SectionCard({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      {children}
    </View>
  )
}

function SubHeading({ icon, label }) {
  return (
    <View style={styles.subHeadingRow}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.subHeading}>{label}</Text>
    </View>
  )
}

function Toggle({ value, onValueChange, disabled }) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor="#fff"
      ios_backgroundColor={colors.border}
    />
  )
}

function VisibilityRow({ iconName, iconColor, label, desc, value, onToggle, disabled }) {
  return (
    <View style={styles.visibilityRow}>
      <Ionicons name={iconName} size={16} color={iconColor} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.visibilityLabel}>{label}</Text>
        <Text style={styles.visibilityDesc}>{desc}</Text>
      </View>
      <Toggle value={value} onValueChange={onToggle} disabled={disabled} />
    </View>
  )
}

// ─── Modal dropdown picker ─────────────────────────────────────────────────────
function DropdownPicker({ options, value, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)
  const displayLabel = selected
    ? `${selected.emoji ? selected.emoji + ' ' : ''}${selected.label}`
    : placeholder

  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[styles.dropdownBtnText, !selected && { color: colors.textMuted }]}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHandle} />
          <FlatList
            data={options}
            keyExtractor={o => o.value}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => {
              const isSelected = item.value === value
              return (
                <TouchableOpacity
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                  onPress={() => { onChange(item.value); setOpen(false) }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                    {item.emoji ? `${item.emoji}  ` : ''}{item.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </Modal>
    </>
  )
}

export default function SettingsScreen() {
  const { user, isAdmin, logout, refreshUser } = useAuth()
  const isManager = user?.role === 'club_admin'

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    password: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })

  // ── Club state ─────────────────────────────────────────────────────────────
  const [club, setClub] = useState(null)
  const [clubForm, setClubForm] = useState({})
  const [savingClub, setSavingClub] = useState(false)
  const [clubMsg, setClubMsg] = useState({ type: '', text: '' })

  const [signingOut, setSigningOut] = useState(false)
  const appVersion = Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0'

  useEffect(() => {
    api.get('/profile').then(r => {
      const d = r.data
      setProfile(p => ({
        ...p,
        full_name: d.full_name ?? '',
        email: d.email ?? '',
        phone: d.phone ?? '',
      }))
      if (d.club_id) {
        setClub(d)
        setClubForm({
          name:                d.club_name        ?? '',
          city:                d.city             ?? '',
          state:               d.state            ?? 'QLD',
          sport:               d.sport            ?? 'soccer',
          slug:                d.slug             ?? '',
          description:         d.description      ?? '',
          website:             d.website          ?? '',
          contact_email:       d.contact_email    ?? '',
          phone:               d.phone            ?? '',
          is_public:           d.is_public        ?? false,
          cover_image_url:     d.cover_image_url  ?? '',
          logo_url:            d.logo_url         ?? '',
          founded_year:        d.founded_year     ? String(d.founded_year) : '',
          social_facebook:     d.social_facebook  ?? '',
          social_instagram:    d.social_instagram ?? '',
          social_twitter:      d.social_twitter   ?? '',
          show_milestones:     d.show_milestones     ?? true,
          show_athletes_count: d.show_athletes_count ?? true,
          show_events:         d.show_events         ?? false,
          show_announcements:  d.show_announcements  ?? false,
        })
      }
    }).catch(() => {})
  }, [])

  async function handleSaveProfile() {
    if (!profile.full_name.trim() || !profile.email.trim()) {
      setProfileMsg({ type: 'error', text: 'Name and email are required.' })
      return
    }
    if (profile.password && profile.password.length < 8) {
      setProfileMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setProfileMsg({ type: '', text: '' })
    setSavingProfile(true)
    try {
      const payload = {
        full_name: profile.full_name.trim(),
        email: profile.email.trim().toLowerCase(),
        phone: profile.phone.trim() || undefined,
      }
      if (profile.password) payload.password = profile.password
      const { data } = await api.put('/profile', payload)
      if (data?.token) {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage')
        await AsyncStorage.setItem('phq_token', data.token)
      }
      await refreshUser()
      setProfile(p => ({ ...p, password: '' }))
      setProfileMsg({ type: 'success', text: 'Profile saved successfully.' })
    } catch (e) {
      setProfileMsg({ type: 'error', text: e?.response?.data?.message ?? 'Failed to save profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveClub() {
    if (!clubForm.name?.trim()) {
      setClubMsg({ type: 'error', text: 'Club name is required.' })
      return
    }
    setClubMsg({ type: '', text: '' })
    setSavingClub(true)
    try {
      await api.put('/club', clubForm)
      setClubMsg({ type: 'success', text: 'Club details saved successfully.' })
    } catch (e) {
      setClubMsg({ type: 'error', text: e?.response?.data?.message ?? 'Failed to save club details.' })
    } finally {
      setSavingClub(false)
    }
  }

  async function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try { await logout() } finally { setSigningOut(false) }
        },
      },
    ])
  }

  const roleLabel = ROLES[user?.role] ?? user?.role ?? 'User'
  const tier = club?.subscription_tier ?? 'free'
  const tierInfo = SUBSCRIPTION_TIERS[tier]

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Profile header ─────────────────────────────────────────────── */}
        <View style={styles.profileHeader}>
          <Avatar name={user?.full_name} size="xl" />
          <Text style={styles.profileName}>{user?.full_name || 'Your account'}</Text>
          <Badge label={roleLabel} color="green" />
        </View>

        {/* ── Profile section ────────────────────────────────────────────── */}
        <SectionCard title="Profile">
          {profileMsg.text ? (
            <View style={profileMsg.type === 'error' ? styles.errorBanner : styles.successBanner}>
              <Text style={profileMsg.type === 'error' ? styles.errorText : styles.successText}>
                {profileMsg.text}
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={profile.full_name}
            onChangeText={v => setProfile(p => ({ ...p, full_name: v }))}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Your full name"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={profile.email}
            onChangeText={v => setProfile(p => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.hint}>This is your login email. Changing it takes effect immediately.</Text>

          <Text style={styles.label}>
            Mobile phone{' '}
            <Text style={styles.labelMuted}>— visible to coaches &amp; admins</Text>
          </Text>
          <View style={styles.iconInput}>
            <Ionicons name="call-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              value={profile.phone}
              onChangeText={v => setProfile(p => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
              placeholder="+61 4xx xxx xxx"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Security sub-section */}
          <View style={styles.divider} />
          <Text style={styles.subSectionLabel}>Security</Text>

          <Text style={styles.label}>
            New password{' '}
            <Text style={styles.labelMuted}>(leave blank to keep current)</Text>
          </Text>
          <View style={styles.iconInput}>
            <TextInput
              style={[styles.input, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
              value={profile.password}
              onChangeText={v => setProfile(p => ({ ...p, password: v }))}
              secureTextEntry={!showPw}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPw(v => !v)}
              activeOpacity={0.7}
            >
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, savingProfile && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Save profile</Text>
              </>
            )}
          </TouchableOpacity>
        </SectionCard>

        {/* ── Club details section (club_admin only) ─────────────────────── */}
        {club && isAdmin && isManager && (
          <SectionCard title="Club details">
            {clubMsg.text ? (
              <View style={clubMsg.type === 'error' ? styles.errorBanner : styles.successBanner}>
                <Text style={clubMsg.type === 'error' ? styles.errorText : styles.successText}>
                  {clubMsg.text}
                </Text>
              </View>
            ) : null}

            {/* Basic info */}
            <Text style={styles.label}>Club name</Text>
            <TextInput
              style={styles.input}
              value={clubForm.name}
              onChangeText={v => setClubForm(p => ({ ...p, name: v }))}
              placeholder="Your club name"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={clubForm.city}
                  onChangeText={v => setClubForm(p => ({ ...p, city: v }))}
                  placeholder="City"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>State</Text>
                <DropdownPicker
                  options={STATES.map(s => ({ value: s, label: s }))}
                  value={clubForm.state}
                  onChange={v => setClubForm(p => ({ ...p, state: v }))}
                  placeholder="Select state…"
                />
              </View>
            </View>

            <Text style={styles.label}>Primary sport</Text>
            <DropdownPicker
              options={SPORTS}
              value={clubForm.sport}
              onChange={v => setClubForm(p => ({ ...p, sport: v }))}
              placeholder="Select sport…"
            />

            <Text style={styles.label}>Founded year</Text>
            <TextInput
              style={styles.input}
              value={clubForm.founded_year}
              onChangeText={v => setClubForm(p => ({ ...p, founded_year: v }))}
              keyboardType="number-pad"
              placeholder="e.g. 1998"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>About the club</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={clubForm.description}
              onChangeText={v => setClubForm(p => ({ ...p, description: v }))}
              multiline
              textAlignVertical="top"
              placeholder="Tell people about your club, your mission, and your values…"
              placeholderTextColor={colors.textMuted}
            />

            {/* Contact & links */}
            <View style={styles.divider} />
            <SubHeading icon="globe-outline" label="Contact & links" />

            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={clubForm.website}
              onChangeText={v => setClubForm(p => ({ ...p, website: v }))}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Contact email</Text>
            <TextInput
              style={styles.input}
              value={clubForm.contact_email}
              onChangeText={v => setClubForm(p => ({ ...p, contact_email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="club@example.com"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={clubForm.phone}
              onChangeText={v => setClubForm(p => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
              placeholder="+61 7 xxxx xxxx"
              placeholderTextColor={colors.textMuted}
            />

            {/* Social media */}
            <View style={styles.divider} />
            <SubHeading icon="share-social-outline" label="Social media" />

            <View style={styles.socialRow}>
              <Ionicons name="logo-instagram" size={18} color="#e1306c" style={styles.socialIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={clubForm.social_instagram}
                onChangeText={v => setClubForm(p => ({ ...p, social_instagram: v }))}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://instagram.com/yourclub"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.socialRow}>
              <Ionicons name="logo-facebook" size={18} color="#1877f2" style={styles.socialIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={clubForm.social_facebook}
                onChangeText={v => setClubForm(p => ({ ...p, social_facebook: v }))}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://facebook.com/yourclub"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.socialRow}>
              <Ionicons name="logo-twitter" size={18} color="#1da1f2" style={styles.socialIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={clubForm.social_twitter}
                onChangeText={v => setClubForm(p => ({ ...p, social_twitter: v }))}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://x.com/yourclub"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Public profile visibility */}
            <View style={styles.divider} />
            <SubHeading icon="lock-closed-outline" label="Public profile visibility" />
            <Text style={styles.hint}>Choose what visitors can see on your public club page.</Text>

            {/* Master toggle */}
            <View style={[styles.masterToggleCard, clubForm.is_public ? styles.masterToggleOn : styles.masterToggleOff]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={clubForm.is_public ? 'lock-open-outline' : 'lock-closed-outline'}
                    size={14}
                    color={clubForm.is_public ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.masterToggleTitle, clubForm.is_public && { color: colors.primaryDark }]}>
                    {clubForm.is_public ? 'Profile is public' : 'Profile is private'}
                  </Text>
                </View>
                <Text style={styles.masterToggleDesc}>
                  {clubForm.is_public
                    ? 'Your club appears in the public directory and has a shareable profile page.'
                    : 'Your club is hidden from public search and the directory.'}
                </Text>
                {clubForm.is_public && clubForm.slug ? (
                  <Text style={styles.slugText}>/club/{clubForm.slug}</Text>
                ) : null}
              </View>
              <Toggle
                value={clubForm.is_public}
                onValueChange={v => setClubForm(p => ({ ...p, is_public: v }))}
              />
            </View>

            {/* Section toggles */}
            {clubForm.is_public && (
              <View style={styles.visibilityCard}>
                <VisibilityRow
                  iconName="people-outline" iconColor="#3b82f6"
                  label="Athlete count & FTEM breakdown"
                  desc="Show how many athletes you have and their development phases"
                  value={clubForm.show_athletes_count}
                  onToggle={v => setClubForm(p => ({ ...p, show_athletes_count: v }))}
                />
                <View style={styles.visibilityDivider} />
                <VisibilityRow
                  iconName="trophy-outline" iconColor="#f59e0b"
                  label="Recent achievements"
                  desc="Show milestones marked as shared with parent"
                  value={clubForm.show_milestones}
                  onToggle={v => setClubForm(p => ({ ...p, show_milestones: v }))}
                />
                <View style={styles.visibilityDivider} />
                <VisibilityRow
                  iconName="calendar-outline" iconColor="#8b5cf6"
                  label="Upcoming sessions & matches"
                  desc="Show your next 5 events on your public page"
                  value={clubForm.show_events}
                  onToggle={v => setClubForm(p => ({ ...p, show_events: v }))}
                />
                <View style={styles.visibilityDivider} />
                <VisibilityRow
                  iconName="megaphone-outline" iconColor={colors.primary}
                  label="Club announcements"
                  desc="Show your latest posts and news publicly"
                  value={clubForm.show_announcements}
                  onToggle={v => setClubForm(p => ({ ...p, show_announcements: v }))}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, savingClub && styles.btnDisabled]}
              onPress={handleSaveClub}
              disabled={savingClub}
            >
              {savingClub ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Save club details</Text>
                </>
              )}
            </TouchableOpacity>
          </SectionCard>
        )}

        {/* ── Current plan section ───────────────────────────────────────── */}
        {club && (
          <SectionCard title="Current plan">
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planTier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
                {tierInfo && (
                  <Text style={styles.planMeta}>
                    Up to {tierInfo.athletes} athletes · {tierInfo.price}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => Alert.alert('Upgrade', 'Contact us at support@pathwayhq.com to upgrade your plan.')}
              >
                <Text style={styles.upgradeBtnText}>Contact us to upgrade</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>
        )}

        {/* ── Sign out ───────────────────────────────────────────────────── */}
        <View style={{ marginBottom: spacing.md }}>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleLogout}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Text style={styles.signOutText}>Sign out</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>PathwayHQ v{appVersion}</Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },

  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileName: { fontSize: font.lg, fontWeight: '700', color: colors.text },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionCardTitle: {
    fontSize: font.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },

  subHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  subHeading: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  subSectionLabel: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },

  label: {
    fontSize: font.sm, fontWeight: '600', color: colors.textSecondary,
    marginBottom: 6, marginTop: spacing.sm,
  },
  labelMuted: { fontWeight: '400', color: colors.textMuted },
  hint: { fontSize: font.xs, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm },

  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: font.base, color: colors.text, backgroundColor: '#fafafa',
    marginBottom: spacing.sm,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  iconInput: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1 },
  inputWithIcon: { flex: 1, paddingLeft: 40, marginBottom: 0 },

  eyeBtn: {
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 0,
    borderTopRightRadius: radius.md, borderBottomRightRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: '#fafafa', justifyContent: 'center', alignItems: 'center',
  },

  row2: { flexDirection: 'row', gap: spacing.sm },

  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: '#fafafa', marginBottom: spacing.sm,
  },
  dropdownBtnText: { fontSize: font.base, color: colors.text, flex: 1 },

  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '60%', paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 20,
  },
  pickerHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 12,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
  },
  pickerItemSelected: { backgroundColor: colors.primaryLight },
  pickerItemText: { fontSize: font.base, color: colors.text },
  pickerItemTextSelected: { color: colors.primary, fontWeight: '700' },

  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  socialIcon: { marginBottom: spacing.sm },

  masterToggleCard: {
    borderRadius: 12, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: spacing.sm,
  },
  masterToggleOn: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  masterToggleOff: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: colors.border },
  masterToggleTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  masterToggleDesc: { fontSize: font.xs, color: colors.textMuted, marginTop: 3 },
  slugText: { fontSize: font.xs, color: colors.primary, fontWeight: '600', marginTop: 4 },

  visibilityCard: {
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: '#fff', overflow: 'hidden', marginBottom: spacing.sm,
  },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  visibilityDivider: { height: 1, backgroundColor: colors.borderLight },
  visibilityLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  visibilityDesc: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },

  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: spacing.sm },
  planTier: { fontSize: font.xl, fontWeight: '900', color: colors.primary, textTransform: 'capitalize' },
  planMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  upgradeBtn: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface,
  },
  upgradeBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },

  signOutBtn: {
    borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface,
  },
  signOutText: { color: colors.error, fontWeight: '700', fontSize: font.base },

  errorBanner: {
    backgroundColor: colors.errorLight ?? '#fef2f2', borderRadius: radius.sm,
    padding: spacing.sm + 4, marginBottom: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: font.sm, fontWeight: '500' },

  successBanner: {
    backgroundColor: '#f0fdf4', borderRadius: radius.sm,
    padding: spacing.sm + 4, marginBottom: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  successText: { color: colors.primaryDark, fontSize: font.sm, fontWeight: '500' },

  version: { textAlign: 'center', fontSize: font.xs, color: colors.textMuted, marginTop: spacing.sm },
})
