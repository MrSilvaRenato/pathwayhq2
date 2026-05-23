import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SPORTS, STATES } from '../../lib/constants'

const ALL_SPORTS = SPORTS

export default function Signup() {
  const { register }   = useAuth()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const claimToken     = searchParams.get('claim')
  const [form, setForm]     = useState({ full_name: '', email: '', password: '', club_name: '', sport: 'soccer', city: '', state: 'QLD' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const pwStrength = (() => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' }
    if (p.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: '50%' }
    if (p.length < 12) return { label: 'Good', color: 'bg-emerald-500', width: '75%' }
    return { label: 'Strong', color: 'bg-emerald-400', width: '100%' }
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      await register(form)
      navigate(claimToken ? `/claim/${claimToken}` : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message ?? err.response?.data?.error ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-emerald-600/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 hover:opacity-80 transition-opacity">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">PathwayHQ</span>
          </Link>
          <h1 className="text-2xl font-black">Register your club</h1>
          <p className="text-slate-400 text-sm mt-1">Free forever · No credit card needed</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-8 shadow-2xl">
          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Your details */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="h-px flex-1 bg-white/10" />
                Your details
                <span className="h-px flex-1 bg-white/10" />
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
                  <input required value={form.full_name} onChange={set('full_name')} className={inputCls} placeholder="Renato Silva" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                  <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={form.password}
                      onChange={set('password')}
                      className={inputCls + ' pr-11'}
                      placeholder="Min. 6 characters"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {pwStrength && (
                    <div className="mt-2">
                      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`} style={{ width: pwStrength.width }} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{pwStrength.label}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Club details */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="h-px flex-1 bg-white/10" />
                Club details
                <span className="h-px flex-1 bg-white/10" />
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Club name</label>
                  <input required value={form.club_name} onChange={set('club_name')} className={inputCls} placeholder="Club Brisbane FC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Primary sport</label>
                  <select value={form.sport} onChange={set('sport')} className={inputCls + ' bg-slate-900 cursor-pointer'}>
                    {ALL_SPORTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                    <input value={form.city} onChange={set('city')} className={inputCls} placeholder="Brisbane" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
                    <select value={form.state} onChange={set('state')} className={inputCls + ' bg-slate-900 cursor-pointer'}>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating account…</span>
                : <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" />Create club & account</span>}
            </button>

            <p className="text-center text-xs text-slate-500">
              By registering you agree to our terms of service.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
