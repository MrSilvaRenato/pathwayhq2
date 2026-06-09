import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Zap, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for small clubs just getting started.',
    cta: 'Get started free',
    highlight: false,
    features: [
      { text: 'Up to 8 active athletes',        included: true },
      { text: '1 squad',                        included: true },
      { text: '3 announcements per month',      included: true },
      { text: 'Public club profile',            included: true },
      { text: 'Athlete join requests',          included: true },
      { text: 'Calendar & sessions',            included: false },
      { text: 'Season registrations',           included: false },
      { text: 'Club broadcast messages',        included: false },
      { text: 'Volunteering management',        included: false },
      { text: 'Analytics dashboard',            included: false },
      { text: 'Trophy cabinet',                 included: false },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 29,
    description: 'For growing clubs that need the full toolkit.',
    cta: 'Start Pro',
    highlight: true,
    badge: 'Most popular',
    features: [
      { text: 'Up to 100 active athletes',      included: true },
      { text: '5 squads',                       included: true },
      { text: 'Unlimited announcements',        included: true },
      { text: 'Public club profile',            included: true },
      { text: 'Athlete join requests',          included: true },
      { text: 'Calendar & sessions',            included: true },
      { text: 'Season registrations',           included: true },
      { text: 'Club broadcast messages',        included: true },
      { text: 'Volunteering management',        included: true },
      { text: 'Analytics dashboard',            included: true },
      { text: 'Trophy cabinet',                 included: false },
    ],
  },
  {
    key: 'elite',
    name: 'Elite',
    price: 79,
    description: 'For established clubs that want no limits.',
    cta: 'Start Elite',
    highlight: false,
    features: [
      { text: 'Unlimited athletes',             included: true },
      { text: 'Unlimited squads',               included: true },
      { text: 'Unlimited announcements',        included: true },
      { text: 'Public club profile',            included: true },
      { text: 'Athlete join requests',          included: true },
      { text: 'Calendar & sessions',            included: true },
      { text: 'Season registrations',           included: true },
      { text: 'Club broadcast messages',        included: true },
      { text: 'Volunteering management',        included: true },
      { text: 'Analytics dashboard',            included: true },
      { text: 'Trophy cabinet',                 included: true },
    ],
  },
]

export default function Pricing() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(null)
  const didAutoTrigger = useRef(false)

  async function handleCta(plan) {
    if (plan.key === 'free') {
      navigate('/?modal=signup')
      return
    }
    if (!user) {
      sessionStorage.setItem('pendingPlan', plan.key)
      navigate('/?modal=signup')
      return
    }
    setLoading(plan.key)
    try {
      const { data } = await api.post('/subscription/checkout', { plan: plan.key })
      window.location.href = data.url
    } catch {
      setLoading(null)
    }
  }

  useEffect(() => {
    if (!user || didAutoTrigger.current) return
    const pending = sessionStorage.getItem('pendingPlan')
    if (!pending) return
    const plan = PLANS.find(p => p.key === pending)
    if (plan && plan.key !== 'free') {
      didAutoTrigger.current = true
      sessionStorage.removeItem('pendingPlan')
      handleCta(plan)
    } else {
      sessionStorage.removeItem('pendingPlan')
    }
  }, [user])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold text-white tracking-tight">PathwayHQ</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-bold transition-all">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/?modal=login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
              <Link to="/?modal=signup" className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-bold transition-all">
                Get started free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="text-center px-6 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-6">
          <Zap className="h-3 w-3" /> Simple, transparent pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Plans for every club
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Start free. Upgrade when your club grows. Athletes always free.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map(plan => (
          <div
            key={plan.key}
            className={`relative rounded-2xl border p-6 flex flex-col gap-5 ${
              plan.highlight
                ? 'border-emerald-500/50 bg-emerald-500/5 shadow-2xl shadow-emerald-500/10 scale-105'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white whitespace-nowrap">
                {plan.badge}
              </div>
            )}

            <div>
              <h2 className="text-lg font-black text-white">{plan.name}</h2>
              <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-4xl font-black text-white">${plan.price}</span>
              <span className="text-slate-400 text-sm mb-1">/month AUD</span>
            </div>

            <button
              onClick={() => handleCta(plan)}
              disabled={loading === plan.key}
              className={`w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                plan.highlight
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                  : 'border border-white/10 bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              {loading === plan.key ? 'Redirecting…' : plan.cta}
            </button>

            <ul className="space-y-2.5">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  {f.included
                    ? <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    : <X     className="h-4 w-4 shrink-0 text-slate-600" />}
                  <span className={f.included ? 'text-slate-200' : 'text-slate-600'}>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Athletes note */}
      <div className="text-center pb-16 px-6">
        <p className="text-slate-500 text-sm">
          Athletes always join and use PathwayHQ <span className="text-white font-semibold">completely free</span> — no credit card, no plan required.
        </p>
      </div>
    </div>
  )
}
