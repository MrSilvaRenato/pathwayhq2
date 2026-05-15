import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (hasErr) =>
    `w-full rounded-xl border ${hasErr ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'} px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${hasErr ? 'focus:ring-red-500/50' : 'focus:ring-emerald-500'} focus:border-transparent transition-all`

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-emerald-600/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 hover:opacity-80 transition-opacity">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">PathwayHQ</span>
          </Link>
          <h1 className="text-2xl font-black">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your club account</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-8 shadow-2xl">
          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className={inputCls(!!error)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <button type="button" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className={inputCls(!!error) + ' pr-11'}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in…</span>
                : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          No account?{' '}
          <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Register your club free →
          </Link>
        </p>
      </div>
    </div>
  )
}
