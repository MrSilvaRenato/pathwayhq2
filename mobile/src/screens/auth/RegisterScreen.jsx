import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { colors, font, spacing, radius } from '../../lib/theme'

const ROLE_OPTIONS = [
  { value: 'athlete', label: 'Athlete' },
  { value: 'parent', label: 'Parent / Guardian' },
]

export default function RegisterScreen({ navigation }) {
  const auth = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('athlete')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await auth.register({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      })
    } catch (e) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.errors?.email?.[0] ??
        'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand mark */}
          <View style={styles.brandWrap}>
            <View style={styles.iconBox}>
              <Ionicons name="flash" size={28} color="#fff" />
            </View>
            <Text style={styles.brandName}>PathwayHQ</Text>
            <Text style={styles.tagline}>Create your account</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Get started</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane Smith"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              value={fullName}
              onChangeText={setFullName}
              returnKeyType="next"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 8 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
            />

            <Text style={styles.label}>I am a...</Text>
            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.roleBtn,
                    role === opt.value && styles.roleBtnActive,
                  ]}
                  onPress={() => setRole(opt.value)}
                >
                  <Text
                    style={[
                      styles.roleBtnText,
                      role === opt.value && styles.roleBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.roleNote}>
              Managers and coaches are set up by club administrators.
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  brandName: {
    fontSize: font.xxl,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heading: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: font.sm,
    fontWeight: '500',
  },
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
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  roleBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleBtnText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleBtnTextActive: {
    color: colors.primaryDark,
  },
  roleNote: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: font.md,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: font.sm,
  },
  footerLink: {
    color: colors.primary,
    fontSize: font.sm,
    fontWeight: '700',
  },
})
