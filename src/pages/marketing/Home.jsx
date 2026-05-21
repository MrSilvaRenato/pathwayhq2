import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, ArrowRight, Users, Trophy, Calendar, BarChart3, Megaphone, HandHeart, Shield, CheckCircle, Menu, X } from 'lucide-react'
import OlympicsCountdown from '../../components/OlympicsCountdown'

const FEATURES = [
  { icon: Users,      title: 'Athlete Management',   desc: 'Full profiles, FTEM phases, parent links, and squad assignments in one place.' },
  { icon: Calendar,   title: 'Training Calendar',    desc: 'Schedule sessions, matches, and camps. Notify your whole club instantly.' },
  { icon: Trophy,     title: 'Milestone Tracking',   desc: 'Log and celebrate athlete achievements across every development phase.' },
  { icon: BarChart3,  title: 'Club Analytics',       desc: 'Understand your squad composition, FTEM distribution, and growth trends.' },
  { icon: Megaphone,  title: 'Announcements',        desc: 'Push updates to coaches, athletes, and parents — no group chats needed.' },
  { icon: HandHeart,  title: 'Volunteering',         desc: 'Organise game-day helpers, canteen rosters, and fundraising events.' },
  { icon: Shield,     title: 'Role-based Access',    desc: 'Admins, coaches, athletes, and parents each see exactly what they need.' },
  { icon: Zap,        title: 'Brisbane 2032 Ready',  desc: 'FTEM framework built in. Track every athlete on the pathway to the Games.' },
]

const PRICING = [
  { tier: 'Free',    price: '$0',   period: '/mo', athletes: 'Up to 15 athletes',  features: ['Basic athlete profiles', 'Calendar', 'Announcements'],                         cta: 'Start free',   highlight: false },
  { tier: 'Starter', price: '$29',  period: '/mo', athletes: 'Up to 50 athletes',  features: ['Everything in Free', 'Squads & rosters', 'Milestones'],                        cta: 'Get started',  highlight: false },
  { tier: 'Pro',     price: '$79',  period: '/mo', athletes: 'Up to 200 athletes', features: ['Everything in Starter', 'Analytics dashboard', 'Volunteering', 'Parent portal'], cta: 'Most popular', highlight: true  },
  { tier: 'Elite',   price: '$149', period: '/mo', athletes: 'Unlimited athletes', features: ['Everything in Pro', 'Priority support', 'Custom branding', 'API access'],       cta: "Let's go",     highlight: false },
]

const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'Clubs',        to: '/clubs' },
  { label: 'Brisbane 2032',to: '/brisbane-2032' },
]

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">PathwayHQ</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => l.to
              ? <Link key={l.label} to={l.to} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{l.label}</Link>
              : <a    key={l.label} href={l.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{l.label}</a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 active:scale-95">
              Get started free
            </Link>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(o => !o)}
              className="md:hidden rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition-colors">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/98 px-4 py-4 space-y-1 animate-fade-in">
            {NAV_LINKS.map(l => l.to
              ? <Link key={l.label} to={l.to} onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">{l.label}</Link>
              : <a    key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">{l.label}</a>
            )}
            <div className="pt-2 border-t border-white/10 mt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">Sign in</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 min-h-[600px] lg:min-h-[720px]">
        {/* Athlete background image */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/hero-athlete.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
          />
          {/* Left-to-right gradient so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/30" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
          {/* Emerald glow accent */}
          <div className="absolute top-0 left-0 h-[500px] w-[700px] rounded-full bg-emerald-600/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400">
                <Zap className="h-3.5 w-3.5" /> Brisbane 2032 Olympic Pathway
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                Run your club.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Build champions.
                </span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                PathwayHQ is the complete sports club management platform — athletes, rosters, calendars,
                milestones, and the full FTEM development framework, all in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-6 py-3.5 font-bold transition-all shadow-lg shadow-emerald-500/25">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/clubs"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 px-6 py-3.5 font-bold transition-all">
                  Browse clubs
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Free forever plan</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Setup in 2 min</span>
              </div>
            </div>

            {/* Countdown card */}
            <div className="flex justify-center lg:justify-end">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm text-center w-full max-w-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 mb-6">
                  🏅 Brisbane 2032 Olympics
                </div>
                <OlympicsCountdown large />
                <p className="mt-6 text-sm text-slate-400 leading-relaxed">Your athletes have time — start their pathway today.</p>
                <Link to="/brisbane-2032"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['500+','Clubs registered'],['12,000+','Athletes tracked'],['23','Olympic sports'],['2032','Brisbane Games']].map(([n, l]) => (
            <div key={l}>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">{n}</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Everything your club needs</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">From grassroots registration to elite pathway management — PathwayHQ handles it all.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <f.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FTEM */}
      <section className="py-20 sm:py-24 border-b border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
                <Zap className="h-3.5 w-3.5" /> FTEM Framework
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Track every phase of development</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                The Foundation-Talent-Elite-Mastery framework is built directly into PathwayHQ.
                Every athlete is placed on the pathway and coaches can see the full squad distribution at a glance.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-5 py-3 font-bold text-sm transition-all">
                Start tracking free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['F1','Foundation 1','New to sport, learning basics','bg-slate-500/20 border-slate-500/20 text-slate-300'],
                ['F2','Foundation 2','Building movement skills','bg-slate-500/20 border-slate-500/20 text-slate-300'],
                ['T1','Talent 1','Sport-specific development','bg-blue-500/20 border-blue-500/20 text-blue-300'],
                ['T2','Talent 2','Advanced skill refinement','bg-blue-500/20 border-blue-500/20 text-blue-300'],
                ['E1','Elite 1','High performance training','bg-emerald-500/20 border-emerald-500/20 text-emerald-300'],
                ['E2','Elite 2','National / international level','bg-emerald-500/20 border-emerald-500/20 text-emerald-300'],
                ['M', 'Mastery', 'Olympic / world-class','bg-amber-500/20 border-amber-500/20 text-amber-300'],
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
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Simple, honest pricing</h2>
            <p className="text-slate-400">Start free. Scale as your club grows.</p>
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
                <div className="text-xs text-slate-500 mb-4">{p.athletes}</div>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup"
                  className={`block rounded-xl py-2.5 text-center text-sm font-bold transition-all active:scale-95 ${p.highlight
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                    : 'border border-white/10 bg-white/5 hover:bg-white/10 text-white'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
            Ready to build<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">champions?</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-8">Join hundreds of Australian clubs already on the pathway to Brisbane 2032.</p>
          <Link to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-8 py-4 text-lg font-bold transition-all shadow-xl shadow-emerald-500/25">
            Get started free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 sm:px-6 py-10">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">PathwayHQ</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <Link to="/clubs"         className="hover:text-slate-300 transition-colors">Clubs</Link>
            <Link to="/brisbane-2032" className="hover:text-slate-300 transition-colors">Brisbane 2032</Link>
            <Link to="/login"         className="hover:text-slate-300 transition-colors">Sign in</Link>
            <Link to="/signup"        className="hover:text-slate-300 transition-colors">Get started</Link>
          </div>
          <p className="text-xs text-slate-600">Built in Brisbane · © 2026 PathwayHQ</p>
        </div>
      </footer>
    </div>
  )
}
