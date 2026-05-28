import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'

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
  primaryGlow:  'rgba(16,185,129,0.25)',
  errBg:        'rgba(239,68,68,0.10)',
  errBorder:    'rgba(239,68,68,0.25)',
  errText:      '#fca5a5',
  glowBg:       'rgba(16,185,129,0.08)',
}

function ForgotModal({ visible, onClose }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(false)

  function reset() { setEmail(''); setError(''); setSent(false) }

  async function handleSend() {
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setError(''); setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose() }}>
      <Pressable style={fm.backdrop} onPress={() => { reset(); onClose() }}>
        <Pressable style={fm.sheet} onPress={e => e.stopPropagation()}>
          <View style={fm.handle} />
          <View style={fm.header}>
            <Text style={fm.title}>{sent ? 'Check your email' : 'Forgot password?'}</Text>
            <TouchableOpacity style={fm.closeBtn} onPress={() => { reset(); onClose() }}>
              <Ionicons name="close" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={fm.body}>
            {sent ? (
              <>
                <View style={fm.successBox}>
                  <Ionicons name="checkmark-circle" size={32} color="#10b981" style={{ marginBottom: 10 }} />
                  <Text style={fm.successText}>
                    If an account exists for <Text style={{ fontWeight: '700' }}>{email}</Text>, a reset link is on its way. Check your spam folder too.
                  </Text>
                </View>
                <TouchableOpacity style={fm.btn} onPress={() => { reset(); onClose() }}>
                  <Text style={fm.btnText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={fm.subtitle}>Enter your email and we'll send a link to reset your password.</Text>
                {!!error && (
                  <View style={fm.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#fca5a5" />
                    <Text style={fm.errorText}>{error}</Text>
                  </View>
                )}
                <Text style={fm.label}>Email address</Text>
                <TextInput
                  style={fm.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <TouchableOpacity style={[fm.btn, loading && { opacity: 0.6 }]} onPress={handleSend} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={fm.btnText}>Send reset link</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const fm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  title: { fontSize: 16, fontWeight: '800', color: '#f8fafc' },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, paddingBottom: 36, gap: 12 },
  subtitle: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#cbd5e1', marginBottom: -4 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#f8fafc' },
  btn: { backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontSize: 13, color: '#fca5a5', flex: 1 },
  successBox: { alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 14, padding: 20, marginBottom: 4 },
  successText: { fontSize: 13, color: '#6ee7b7', textAlign: 'center', lineHeight: 20 },
})

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const pwRef = useRef(null)

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [showForgot,  setShowForgot]  = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (e) {
      setError(
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        'Invalid email or password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Subtle background glow */}
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
            <Text style={s.heading}>Welcome back</Text>
            <Text style={s.subtitle}>Sign in to your club account</Text>
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

            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>Email address</Text>
              <TextInput
                style={[s.input, !!error && s.inputError]}
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
              <View style={s.labelRow}>
                <Text style={s.label}>Password</Text>
                <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setShowForgot(true)}>
                  <Text style={s.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={s.inputWrap}>
                <TextInput
                  ref={pwRef}
                  style={[s.input, s.inputPadRight, !!error && s.inputError]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={C.placeholder}
                  secureTextEntry={!showPw}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, loading && s.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.submitBtnText}>Sign in</Text>}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.footerLink}>Register your club free →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotModal visible={showForgot} onClose={() => setShowForgot(false)} />
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

  // Logo / heading
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

  // Card
  card: {
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 24,
    marginBottom: 24,
  },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: C.errBg, borderWidth: 1, borderColor: C.errBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 13, color: C.errText, lineHeight: 18 },

  // Fields
  field:     { marginBottom: 18 },
  labelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label:     { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 8 },
  forgotLink: { fontSize: 12, color: C.textFaint },

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

  // Submit
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

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  footerText: { fontSize: 14, color: C.textMuted },
  footerLink: { fontSize: 14, fontWeight: '700', color: C.primary },
})
