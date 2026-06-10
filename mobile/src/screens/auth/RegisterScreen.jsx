import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { SPORTS, STATES } from '../../lib/constants'

// ── dark-theme palette (matches web slate-950 auth) ───────────────────────────
const C = {
  bg:           '#020617',
  card:         'rgba(255,255,255,0.04)',
  cardBorder:   'rgba(255,255,255,0.09)',
  input:        'rgba(255,255,255,0.06)',
  inputBorder:  'rgba(255,255,255,0.12)',
  inputErr:     'rgba(239,68,68,0.08)',
  inputErrBdr:  'rgba(239,68,68,0.4)',
  text:         '#f8fafc',
  textMuted:    '#94a3b8',
  textFaint:    '#64748b',
  placeholder:  '#475569',
  primary:      '#10b981',
  primaryDark:  '#059669',
  errBg:        'rgba(239,68,68,0.10)',
  errBorder:    'rgba(239,68,68,0.25)',
  errText:      '#fca5a5',
  glowBg:       'rgba(16,185,129,0.08)',
  divider:      'rgba(255,255,255,0.08)',
  roleInactive: 'rgba(255,255,255,0.06)',
  roleActive:   'rgba(16,185,129,0.15)',
  roleBorder:   'rgba(255,255,255,0.12)',
  roleBdrActive:'rgba(16,185,129,0.5)',
}

function strengthInfo(pw) {
  if (!pw) return null
  if (pw.length < 6) return { label: 'Too short', color: '#ef4444', pct: 0.2 }
  const score =
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0)
  if (score <= 1) return { label: 'Weak',   color: '#f97316', pct: 0.4 }
  if (score <= 2) return { label: 'Good',   color: '#eab308', pct: 0.65 }
  return             { label: 'Strong', color: '#10b981', pct: 1.0 }
}

const ROLE_OPTIONS = [
  { value: 'club_admin', label: 'Club / Team Manager', icon: 'shield-outline' },
  { value: 'athlete',    label: 'Athlete',             icon: 'barbell-outline' },
  { value: 'parent',     label: 'Parent / Guardian',   icon: 'people-outline'  },
]

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth()

  const emailRef    = useRef(null)
  const pwRef       = useRef(null)
  const clubRef     = useRef(null)

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [role,      setRole]      = useState('club_admin')
  const [clubName,  setClubName]  = useState('')
  const [sport,     setSport]     = useState('soccer')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const strength = strengthInfo(password)
  const hasError = !!error
  const isClub   = role === 'club_admin'

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (isClub && !clubName.trim()) {
      setError('Club / team name is required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register({
        full_name: fullName.trim(),
        email:     email.trim().toLowerCase(),
        password,
        role,
        ...(isClub && {
          club_name: clubName.trim(),
          sport,
        }),
      })
    } catch (e) {
      setError(
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        e?.response?.data?.errors?.email?.[0] ??
        'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.glow} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + heading */}
          <View style={s.logoWrap}>
            <View style={s.logoBox}>
              <Ionicons name="flash" size={26} color="#fff" />
            </View>
            <Text style={s.brandName}>PathwayHQ</Text>
            <Text style={s.heading}>{isClub ? 'Register your club' : 'Create your account'}</Text>
            <Text style={s.subtitle}>Free forever · No credit card needed</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            {/* Error banner */}
            {!!error && (
              <View style={s.errorBanner}>
                <Ionicons name="alert-circle-outline" size={15} color={C.errText} style={{ flexShrink: 0, marginTop: 1 }} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Role picker */}
            <View style={s.field}>
              <Text style={s.label}>I am registering as...</Text>
              <View style={s.roleRow}>
                {ROLE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.roleBtn, role === opt.value && s.roleBtnActive]}
                    onPress={() => setRole(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={role === opt.value ? C.primary : C.textFaint}
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={[s.roleBtnText, role === opt.value && s.roleBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerLabel}>YOUR DETAILS</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Full name */}
            <View style={s.field}>
              <Text style={s.label}>Full name</Text>
              <TextInput
                style={[s.input, hasError && s.inputError]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jane Smith"
                placeholderTextColor={C.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>

            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>Email address</Text>
              <TextInput
                ref={emailRef}
                style={[s.input, hasError && s.inputError]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={C.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.inputWrap}>
                <TextInput
                  ref={pwRef}
                  style={[s.input, s.inputPadRight, hasError && s.inputError]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={C.placeholder}
                  secureTextEntry={!showPw}
                  returnKeyType={isClub ? 'next' : 'done'}
                  onSubmitEditing={() => isClub ? clubRef.current?.focus() : handleRegister()}
                />
                <TouchableOpacity
                  style={s.eyeBtn}
                  onPress={() => setShowPw(v => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={C.textFaint}
                  />
                </TouchableOpacity>
              </View>
              {strength && (
                <View style={s.strengthWrap}>
                  <View style={s.strengthTrack}>
                    <View style={[s.strengthFill, { width: `${strength.pct * 100}%`, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
            </View>

            {/* Club details — only for club_admin */}
            {isClub && (
              <>
                <View style={s.dividerRow}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerLabel}>CLUB DETAILS</Text>
                  <View style={s.dividerLine} />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Club / team name</Text>
                  <TextInput
                    ref={clubRef}
                    style={[s.input, hasError && !clubName && s.inputError]}
                    value={clubName}
                    onChangeText={setClubName}
                    placeholder="Brisbane FC"
                    placeholderTextColor={C.placeholder}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Primary sport</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {SPORTS.slice(0, 8).map(sp => (
                        <TouchableOpacity
                          key={sp.value}
                          onPress={() => setSport(sp.value)}
                          style={[s.sportChip, sport === sp.value && s.sportChipActive]}
                          activeOpacity={0.75}
                        >
                          <Text style={[s.sportChipText, sport === sp.value && s.sportChipTextActive]}>
                            {sp.emoji} {sp.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, loading && s.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.submitBtnText}>
                    {isClub ? 'Create club & account' : 'Create account'}
                  </Text>}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>Sign in →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  glow: {
    position: 'absolute',
    top: -60, left: '10%',
    width: '80%', height: 280,
    borderRadius: 140,
    backgroundColor: C.glowBg,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  brandName: {
    fontSize: 22, fontWeight: '800', color: C.text,
    letterSpacing: -0.5, marginBottom: 10,
  },
  heading:  { fontSize: 26, fontWeight: '900', color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.textMuted },

  card: {
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 24,
    marginBottom: 24,
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: C.errBg, borderWidth: 1, borderColor: C.errBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 13, color: C.errText, lineHeight: 18 },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  dividerLabel: {
    fontSize: 10, fontWeight: '700', color: C.textFaint,
    letterSpacing: 1.2,
  },

  field:    { marginBottom: 18 },
  label:    { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 8 },

  input: {
    backgroundColor: C.input,
    borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: C.text,
  },
  inputError:    { backgroundColor: C.inputErr, borderColor: C.inputErrBdr },
  inputPadRight: { paddingRight: 48 },

  inputWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 14,
    top: 0, bottom: 0, justifyContent: 'center',
  },

  strengthWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8,
  },
  strengthTrack: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', minWidth: 52, textAlign: 'right' },

  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: C.roleBorder,
    backgroundColor: C.roleInactive,
    alignItems: 'center',
  },
  roleBtnActive: {
    borderColor: C.roleBdrActive,
    backgroundColor: C.roleActive,
  },
  roleBtnText:       { fontSize: 11, fontWeight: '600', color: C.textFaint, textAlign: 'center' },
  roleBtnTextActive: { color: C.primary },

  sportChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: C.roleBorder,
    backgroundColor: C.roleInactive,
  },
  sportChipActive: {
    borderColor: C.roleBdrActive,
    backgroundColor: C.roleActive,
  },
  sportChipText:       { fontSize: 13, color: C.textFaint, fontWeight: '600' },
  sportChipTextActive: { color: C.primary },

  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.55 },
  submitBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },

  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  footerText: { fontSize: 14, color: C.textMuted },
  footerLink: { fontSize: 14, fontWeight: '700', color: C.primary },
})
