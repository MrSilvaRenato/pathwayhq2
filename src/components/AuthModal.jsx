import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle, X, Dumbbell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"

function LoginForm({ onSwitch, claimToken }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      const pending = sessionStorage.getItem('pendingJoin')
      if (pending) {
        sessionStorage.removeItem('pendingJoin')
        navigate(`/club/${pending}?join=1`)
      } else {
        navigate(claimToken ? `/claim/${claimToken}` : '/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error ?? 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-7">
        <h2 className="text-2xl font-black text-white">Welcome back</h2>
        <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
          <input type="email" required autoComplete="email"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className={inputCls} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} required autoComplete="current-password"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className={inputCls + ' pr-11'} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in…</span>
            : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        No account?{' '}
        <button onClick={onSwitch} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
          Create one free →
        </button>
      </p>
    </div>
  )
}

function SignupForm({ onSwitch, claimToken }) {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]   = useState({ full_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const pwStrength = (() => {
    const p = form.password
    if (!p) return null
    if (p.length < 6)  return { label: 'Too short', color: 'bg-red-500',     width: '25%' }
    if (p.length < 8)  return { label: 'Weak',      color: 'bg-orange-500',  width: '50%' }
    if (p.length < 12) return { label: 'Good',      color: 'bg-emerald-500', width: '75%' }
    return                    { label: 'Strong',    color: 'bg-emerald-400', width: '100%' }
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      await register({ ...form, role: 'athlete' })
      const pending = sessionStorage.getItem('pendingJoin')
      if (pending) {
        sessionStorage.removeItem('pendingJoin')
        navigate(`/club/${pending}?join=1`)
      } else {
        navigate(claimToken ? `/claim/${claimToken}` : '/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message ?? err.response?.data?.error ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
          <Dumbbell className="h-6 w-6 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Create your account</h2>
        <p className="text-slate-400 text-sm mt-1">Free forever · No credit card needed</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
          <input required value={form.full_name} onChange={set('full_name')} className={inputCls} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} required autoComplete="new-password"
              value={form.password} onChange={set('password')}
              className={inputCls + ' pr-11'} placeholder="Min. 6 characters" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwStrength && (
            <div className="mt-2">
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`} style={{ width: pwStrength.width }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{pwStrength.label}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-xl px-4 py-3 leading-relaxed">
          If a club has already invited you, your profile will be linked automatically after you sign up.
        </p>

        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 mt-2">
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating account…</span>
            : <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" />Create account</span>}
        </button>
        <p className="text-center text-xs text-slate-500">By registering you agree to our terms of service.</p>
      </form>

      {/* Club manager callout */}
      <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
        <p className="text-xs font-semibold text-slate-300 mb-0.5">Managing a club?</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Find your club in the{' '}
          <Link to="/clubs" onClick={() => {}} className="text-emerald-400 hover:text-emerald-300 font-semibold">
            club directory
          </Link>{' '}
          and submit a claim request, or contact us at{' '}
          <a href="mailto:renatoleite.log@gmail.com" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            renatoleite.log@gmail.com
          </a>
        </p>
      </div>

      <p className="text-center text-sm text-slate-500 mt-5">
        Already registered?{' '}
        <button onClick={onSwitch} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
          Sign in →
        </button>
      </p>
    </div>
  )
}

export default function AuthModal({ mode, onClose, claimToken }) {
  const [view, setView] = useState(mode)

  useEffect(() => { setView(mode) }, [mode])

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdrop}>
      <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="relative rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-white">PathwayHQ</span>
          </div>

          <button onClick={onClose}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>

          {view === 'login'
            ? <LoginForm onSwitch={() => setView('signup')} claimToken={claimToken} />
            : <SignupForm onSwitch={() => setView('login')} claimToken={claimToken} />}
        </div>
      </div>
    </div>
  )
}
