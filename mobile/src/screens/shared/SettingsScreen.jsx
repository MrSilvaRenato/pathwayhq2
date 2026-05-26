import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { ROLES } from '../../lib/constants'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Constants from 'expo-constants'

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth()

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0'

  async function handleSave() {
    if (!fullName.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
      }
      if (password) {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.')
          setSaving(false)
          return
        }
        payload.password = password
      }
      await api.put('/profile', payload)
      await refreshUser()
      setPassword('')
      setSuccess('Profile updated successfully.')
    } catch (e) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.errors?.email?.[0] ??
        'Failed to update profile.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try {
            await logout()
          } finally {
            setSigningOut(false)
          }
        },
      },
    ])
  }

  const roleLabel = ROLES[user?.role] ?? user?.role ?? 'User'

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <Avatar name={user?.full_name} size="xl" />
          <Text style={styles.profileName}>{user?.full_name}</Text>
          <Badge label={roleLabel} color="green" />
        </View>

        {/* Profile form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+61 400 000 000"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Leave blank to keep current"
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
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

        {/* Version */}
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
  },
  profileName: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },

  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: font.sm, fontWeight: '500' },

  successBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  successText: { color: colors.primaryDark, fontSize: font.sm, fontWeight: '500' },

  label: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: font.base,
    color: colors.text,
    backgroundColor: '#fafafa',
  },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: font.base },

  signOutBtn: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  signOutText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: font.base,
  },

  version: {
    textAlign: 'center',
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
})
