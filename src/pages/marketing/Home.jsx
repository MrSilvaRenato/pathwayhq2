import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Zap, ArrowRight, Users, Trophy, Calendar, BarChart3, Megaphone, HandHeart,
  Shield, CheckCircle, Menu, X, Star, Award, Medal, TrendingUp, MapPin,
} from 'lucide-react'
import OlympicsCountdown from '../../components/OlympicsCountdown'
import AuthModal from '../../components/AuthModal'

const FEATURES = [
  { icon: Users,      title: 'Athlete Profiles',    desc: 'Full profiles, FTEM phases, parent links, and squad assignments in one place.',       color: 'bg-blue-500/10 border-blue-500/20 text-blue-400'     },
  { icon: Calendar,   title: 'Training Calendar',   desc: 'Schedule sessions, matches, and camps. Notify your whole club instantly.',            color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  { icon: Trophy,     title: 'Trophy Cabinet',      desc: 'Log and celebrate every achievement. Your public profile becomes your showcase.',     color: 'bg-amber-500/10 border-amber-500/20 text-amber-400'   },
  { icon: BarChart3,  title: 'Club Analytics',      desc: 'FTEM distribution, age groups, gender splits — know your squad inside out.',          color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  { icon: Megaphone,  title: 'Announcements',       desc: 'Push updates to coaches, athletes, and parents — no group chats needed.',            color: 'bg-red-500/10 border-red-500/20 text-red-400'         },
  { icon: HandHeart,  title: 'Volunteering',        desc: 'Organise game-day helpers, canteen rosters, and fundraising with ease.',             color: 'bg-pink-500/10 border-pink-500/20 text-pink-400'      },
  { icon: Shield,     title: 'Role-based Access',   desc: 'Admins, coaches, athletes, and parents each see exactly what they need.',            color: 'bg-slate-500/10 border-slate-500/20 text-slate-400'   },
  { icon: Zap,        title: 'Brisbane 2032 Ready', desc: 'FTEM framework built in. Track every athlete on the pathway to the Games.',          color: 'bg-teal-500/10 border-teal-500/20 text-teal-400'      },
]

const PRICING = [
  { tier: 'Free',    price: '$0',   period: '/mo', athletes: 'Up to 15 athletes',  features: ['Basic athlete profiles', 'Training calendar', 'Announcements', 'Public club profile'],                             cta: 'Start free',   highlight: false },
  { tier: 'Starter', price: '$29',  period: '/mo', athletes: 'Up to 50 athletes',  features: ['Everything in Free', 'Squads & rosters', 'Milestone tracking', 'Trophy cabinet'],                                   cta: 'Get started',  highlight: false },
  { tier: 'Pro',     price: '$79',  period: '/mo', athletes: 'Up to 200 athletes', features: ['Everything in Starter', 'Analytics dashboard', 'Volunteering module', 'Parent portal', 'Brisbane 2032 pathway'],     cta: 'Most popular', highlight: true  },
  { tier: 'Elite',   price: '$149', period: '/mo', athletes: 'Unlimited athletes', features: ['Everything in Pro', 'Priority support', 'Custom branding', 'API access', 'Dedicated onboarding'],                    cta: "Let's go",     highlight: false },
]

const NAV_LINKS = [
  { label: 'Features',      href: '#features'  },
  { label: 'How it works',  href: '#how'       },
  { label: 'Pricing',       href: '#pricing'   },
  { label: 'Clubs',         to: '/clubs'       },
  { label: 'Brisbane 2032', to: '/brisbane-2032' },
]

const MOCK_TROPHIES = [
  { icon: '🥇', title: 'State Championship MVP',        phase: 'M',  name: 'Sarah K.',  color: 'border-amber-500/40 bg-amber-500/10'   },
  { icon: '🥈', title: 'National Junior Selection',     phase: 'E2', name: 'Liam T.',   color: 'border-slate-400/30 bg-slate-400/8'    },
  { icon: '🥉', title: 'Regional Tournament Top Scorer',phase: 'T2', name: 'Mia R.',    color: 'border-orange-500/30 bg-orange-500/8'  },
  { icon: '🏅', title: 'Club Player of the Season',     phase: 'F2', name: 'Jack M.',   color: 'border-emerald-500/20 bg-emerald-500/8'},
  { icon: '🥇', title: 'QLD Academy Scholarship',       phase: 'E1', name: 'Priya S.',  color: 'border-amber-500/40 bg-amber-500/10'   },
  { icon: '🥉', title: 'Best & Fairest Award',          phase: 'T1', name: 'Noah W.',   color: 'border-orange-500/30 bg-orange-500/8'  },
]

const STEPS = [
  { n: '01', icon: Users,   title: 'Create your club',    desc: 'Sign up in 2 minutes. Set up your club profile, sport, and location — your digital home is ready.' },
  { n: '02', icon: Trophy,  title: 'Build your roster',   desc: 'Add athletes, assign FTEM phases, create squads. Every player has a profile they can be proud of.' },
  { n: '03', icon: Star,    title: 'Celebrate & showcase',desc: 'Log milestones, share achievements, and watch your public trophy cabinet grow for the world to see.' },
]

export default function Home() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modal, setModal] = useState(null) // 'login' | 'signup'
  const [searchParams] = useSearchParams()

  const claimToken = searchParams.get('claim') || null

  useEffect(() => {
    const m = searchParams.get('modal')
    if (m === 'login' || m === 'signup') setModal(m)
  }, [])

  function openModal(type) { setMobileOpen(false); setModal(type) }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <img src="/icon.png" alt="" className="h-9 w-9 rounded-xl" />
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-white">Pathway</span><span className="text-emerald-400">HQ</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(l => l.to
              ? <Link key={l.label} to={l.to}   className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{l.label}</Link>
              : <a    key={l.label} href={l.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{l.label}</a>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 active:scale-95">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <button onClick={() => openModal('login')} className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</button>
                <button onClick={() => openModal('signup')} className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 active:scale-95">
                  Get started free
                </button>
              </>
            )}
            <button onClick={() => setMobileOpen(o => !o)}
              className="md:hidden rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition-colors">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/98 px-4 py-4 space-y-1">
            {NAV_LINKS.map(l => l.to
              ? <Link key={l.label} to={l.to}   onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">{l.label}</Link>
              : <a    key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">{l.label}</a>
            )}
            <div className="pt-2 border-t border-white/10">
              {user ? (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-400 hover:bg-white/5 transition-colors">Go to Dashboard</Link>
              ) : (
                <button onClick={() => openModal('login')} className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">Sign in</button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 min-h-[640px] lg:min-h-[760px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/20" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
          <div className="absolute top-0 left-0 h-[500px] w-[700px] rounded-full bg-emerald-600/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400">
                <Zap className="h-3.5 w-3.5" /> Brisbane 2032 Olympic Pathway
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5">
                Your club's home.<br />
                Your athletes'<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  path to glory.
                </span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                PathwayHQ gives clubs and athletes a place to manage, celebrate, and showcase
                every milestone — from grassroots training to the Olympic pathway.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => openModal('signup')}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-6 py-3.5 font-bold transition-all shadow-xl shadow-emerald-500/25">
                  Start for free <ArrowRight className="h-4 w-4" />
                </button>
                <Link to="/clubs"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 px-6 py-3.5 font-bold transition-all">
                  Browse clubs
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Free forever plan</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Setup in 2 minutes</span>
              </div>
            </div>

            {/* Brisbane 2032 countdown */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 backdrop-blur-sm text-center w-full max-w-sm shadow-2xl">
                <img src="/hero-athlete.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-80" />
                <div className="absolute inset-0 bg-slate-950/50" />
                <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 mb-6">
                  🏅 Brisbane 2032 Olympics
                </div>
                <OlympicsCountdown large />
                <p className="mt-6 text-sm text-slate-400 leading-relaxed">Your athletes have time — start their pathway today.</p>
                <Link to="/brisbane-2032"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                  Explore the pathway <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['500+','Clubs registered'],['12,000+','Athletes tracked'],['50,000+','Milestones logged'],['2032','Brisbane Games']].map(([n, l]) => (
            <div key={l}>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">{n}</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="py-20 sm:py-24 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-400">
              Simple by design
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Up and running in minutes</h2>
            <p className="text-slate-400 max-w-xl mx-auto">No complicated setup. No training required. Your club is live and showcasing achievements before the day is out.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-7 text-center hover:bg-white/[0.06] transition-all">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-5 mx-auto">
                  <s.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="absolute top-5 right-5 text-xs font-black text-slate-700">{s.n}</div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="md:hidden h-5 w-5 text-slate-700 mx-auto mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trophy Cabinet showcase */}
      <section className="py-20 sm:py-24 border-b border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-400">
                <Trophy className="h-3.5 w-3.5" /> Trophy Cabinet
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5">
                Your achievements,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">on display for the world</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-5">
                Every club gets a public profile page — a digital trophy cabinet that clubs and athletes
                can share with pride. Parents researching clubs. Athletes showcasing their journey.
                Scouts spotting talent. It's your marketing, done for you.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Share your club profile link anywhere',
                  'Every milestone earns a trophy card',
                  'Athletes credited for their achievements',
                  'FTEM pathway shown publicly',
                ].map(t => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <Link to="/clubs"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 px-5 py-3 text-sm font-bold transition-all">
                See example club profiles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mock trophy cabinet */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">Club Brisbane F.C</p>
                  <p className="text-xs text-slate-500">⚽ Football · Brisbane, QLD</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400">
                  <Star className="h-3 w-3" /> Public
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Trophy Cabinet</p>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_TROPHIES.map((t, i) => (
                  <div key={i} className={`rounded-xl border ${t.color} p-3.5`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xl">{t.icon}</span>
                      <span className="rounded-full bg-white/10 border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">{t.phase}</span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-snug">{t.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">{t.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Everything your club needs</h2>
            <p className="text-slate-400 max-w-xl mx-auto">From grassroots registration to elite pathway management — PathwayHQ handles it all.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all p-6 group">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border mb-4 ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FTEM section */}
      <section className="py-20 sm:py-24 border-b border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" /> FTEM Framework
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Track every phase of development</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                The Foundation-Talent-Elite-Mastery framework is built directly into PathwayHQ.
                Every athlete sits on the pathway. Coaches see the full squad distribution at a glance.
                Athletes know exactly where they stand — and where they're headed.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                With Brisbane 2032 on the horizon, tracking the FTEM journey isn't just good practice — it's how Australian sport identifies its next generation of champions.
              </p>
              <button onClick={() => openModal('signup')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-5 py-3 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25">
                Start tracking free <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['F1','Foundation 1','New to sport, learning basics',           'bg-slate-500/20 border-slate-500/20 text-slate-300'],
                ['F2','Foundation 2','Building movement skills',                'bg-slate-500/20 border-slate-500/20 text-slate-300'],
                ['T1','Talent 1',    'Sport-specific development begins',       'bg-blue-500/20 border-blue-500/20 text-blue-300'  ],
                ['T2','Talent 2',    'Advanced skill refinement',               'bg-blue-500/20 border-blue-500/20 text-blue-300'  ],
                ['E1','Elite 1',     'High performance training',               'bg-emerald-500/20 border-emerald-500/20 text-emerald-300'],
                ['E2','Elite 2',     'National / international competition',    'bg-emerald-500/20 border-emerald-500/20 text-emerald-300'],
                ['M', 'Mastery',     'Olympic / world-class performance',       'bg-amber-500/20 border-amber-500/20 text-amber-300'],
              ].map(([phase, label, desc, cls]) => (
                <div key={phase} className={`rounded-xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors ${phase === 'M' ? 'col-span-2' : ''}`}>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${cls}`}>{phase}</span>
                  <p className="mt-2 text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Simple, honest pricing</h2>
            <p className="text-slate-400">Start free. Scale as your club grows. No surprises.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRICING.map(p => (
              <div key={p.tier} className={`rounded-2xl p-6 border flex flex-col ${p.highlight
                ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20 shadow-xl shadow-emerald-500/10'
                : 'border-white/5 bg-white/[0.03]'}`}>
                {p.highlight && (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400 w-fit">
                    ⭐ Most popular
                  </div>
                )}
                <div className="text-sm font-semibold text-slate-400 mb-1">{p.tier}</div>
                <div className="text-4xl font-black text-white mb-1">
                  {p.price}<span className="text-base font-normal text-slate-500">{p.period}</span>
                </div>
                <div className="text-xs text-slate-500 mb-5">{p.athletes}</div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => openModal('signup')}
                  className={`w-full rounded-xl py-2.5 text-center text-sm font-bold transition-all active:scale-95 ${p.highlight
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                    : 'border border-white/10 bg-white/5 hover:bg-white/10 text-white'}`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-emerald-600/8 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="text-5xl mb-6">🏆</div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
            Ready to build<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">champions?</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join hundreds of Australian clubs on the pathway to Brisbane 2032.
            Your trophy cabinet is waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => openModal('signup')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-8 py-4 text-lg font-bold transition-all shadow-xl shadow-emerald-500/25">
              Get started free <ArrowRight className="h-5 w-5" />
            </button>
            <Link to="/clubs"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 px-8 py-4 text-lg font-bold transition-all">
              Browse clubs
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center items-center gap-5 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-700" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-700" /> No credit card needed</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-700" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} claimToken={claimToken} />}

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/icon.png" alt="" className="h-9 w-9 rounded-xl" />
              <span className="text-base font-extrabold tracking-tight">
                <span className="text-white">Pathway</span><span className="text-emerald-400">HQ</span>
              </span>
            </Link>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <a href="#features"     className="hover:text-slate-300 transition-colors">Features</a>
              <a href="#pricing"      className="hover:text-slate-300 transition-colors">Pricing</a>
              <Link to="/clubs"         className="hover:text-slate-300 transition-colors">Clubs</Link>
              <Link to="/brisbane-2032" className="hover:text-slate-300 transition-colors">Brisbane 2032</Link>
              <button onClick={() => openModal('login')}  className="hover:text-slate-300 transition-colors">Sign in</button>
              <button onClick={() => openModal('signup')} className="hover:text-slate-300 transition-colors">Get started</button>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <p>Built in Brisbane · © 2026 PathwayHQ · The home of Australian sports development</p>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Sydney, Australia
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
