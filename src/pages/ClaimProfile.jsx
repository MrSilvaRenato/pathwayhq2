import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Zap, CheckCircle, XCircle, Loader } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function ClaimProfile() {
  const { token }    = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const [status, setStatus] = useState('idle') // idle | loading | success | error | already_claimed
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return // wait for auth
    claim()
  }, [user])

  async function claim() {
    setStatus('loading')
    try {
      await api.post('/athletes/claim', { token })
      setStatus('success')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Something went wrong.'
      if (err.response?.status === 409) {
        setStatus('already_claimed')
      } else {
        setStatus('error')
      }
      setMessage(msg)
    }
  }

  // Not logged in — send to signup with token in URL so we can claim after
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/30 mx-auto mb-6">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2">Claim your profile</h1>
          <p className="text-slate-400 text-sm mb-8">
            Create a free account or sign in to claim your athlete profile.
          </p>
          <div className="space-y-3">
            <Link
              to={`/?modal=signup&claim=${token}`}
              className="block w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 py-3.5 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25">
              Create account & claim profile
            </Link>
            <Link
              to={`/?modal=login&claim=${token}`}
              className="block w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 py-3.5 text-sm font-bold transition-all">
              Sign in to claim
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <Loader className="h-12 w-12 text-emerald-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-black">Claiming your profile…</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black mb-2">Profile claimed!</h1>
            <p className="text-slate-400 text-sm mb-8">
              Your athlete profile is now linked to your account. Welcome to PathwayHQ.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 py-3.5 text-sm font-bold transition-all">
              Go to my dashboard
            </button>
          </>
        )}

        {(status === 'error' || status === 'already_claimed') && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 mx-auto mb-5">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-black mb-2">
              {status === 'already_claimed' ? 'Already claimed' : 'Invalid link'}
            </h1>
            <p className="text-slate-400 text-sm mb-8">{message}</p>
            <Link to="/dashboard"
              className="block w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-3.5 text-sm font-bold transition-all">
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
