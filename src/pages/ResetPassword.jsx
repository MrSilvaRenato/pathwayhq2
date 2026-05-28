import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../lib/api'

const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const [password, setPassword]   = useState('')
  const [confirm,  setConfirm]    = useState('')
  const [showPw,   setShowPw]     = useState(false)
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')
  const [done,     setDone]       = useState(false)

  const pwStrength = (() => {
    if (!password) return null
    if (password.length < 6)  return { label: 'Too short', color: 'bg-red-500',     width: '25%' }
    if (password.length < 8)  return { label: 'Weak',      color: 'bg-orange-500',  width: '50%' }
    if (password.length < 12) return { label: 'Good',      color: 'bg-emerald-500', width: '75%' }
    return                           { label: 'Strong',    color: 'bg-emerald-400', width: '100%' }
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, token, password })
      setDone(true)
      setTimeout(() => navigate('/?modal=login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid reset link</h2>
          <p className="text-slate-400 text-sm mb-6">This link is missing required information. Please request a new password reset.</p>
          <Link to="/?modal=login" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-white">Pathway</span><span className="text-emerald-400">HQ</span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password updated!</h2>
              <p className="text-slate-400 text-sm">Your password has been changed. Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <h2 className="text-2xl font-black text-white">Choose a new password</h2>
                <p className="text-slate-400 text-sm mt-1">For <span className="text-slate-300 font-medium">{email}</span></p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} required autoFocus
                      value={password} onChange={e => setPassword(e.target.value)}
                      className={inputCls + ' pr-11'} placeholder="Min. 6 characters"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwStrength && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1 w-full rounded-full bg-white/10">
                        <div className={`h-1 rounded-full transition-all ${pwStrength.color}`} style={{ width: pwStrength.width }} />
                      </div>
                      <p className="text-xs text-slate-500">{pwStrength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm password</label>
                  <input
                    type={showPw ? 'text' : 'password'} required
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    className={inputCls} placeholder="Repeat your password"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Updating…</span>
                    : 'Set new password'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                <Link to="/?modal=login" className="text-slate-400 hover:text-slate-300 transition-colors">
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
