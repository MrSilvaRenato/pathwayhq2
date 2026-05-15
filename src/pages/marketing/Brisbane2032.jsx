import { Link } from 'react-router-dom'
import { Zap, ArrowRight } from 'lucide-react'
import OlympicsCountdown from '../../components/OlympicsCountdown'
import { SPORTS } from '../../lib/constants'

const OLYMPIC_SPORTS = SPORTS.filter(s => s.in2032)

const TIMELINE = [
  { year: '2026', title: 'Foundation phase', desc: 'Clubs register, athletes mapped to FTEM. Talent identification programs launch nationally.', now: true },
  { year: '2027', title: 'Talent phase begins', desc: 'State-level pathways established. First national talent camps for identified athletes.' },
  { year: '2028', title: 'Los Angeles 2028',   desc: 'Australian athletes compete. Post-Games review shapes 2032 strategy for all sports.' },
  { year: '2029', title: 'Elite entry points',  desc: 'Athletes entering E1/E2 phases. National programs at full capacity.' },
  { year: '2030', title: 'Pre-Olympic camps',   desc: 'Test events in Brisbane. Athletes in Mastery phase preparing for qualification.' },
  { year: '2031', title: 'Qualification year',  desc: 'Olympic qualification events across all 23 sports. Final squad selections begin.' },
  { year: '2032', title: 'Brisbane 2032',       desc: 'The Games begin. Athletes who started their pathway today will be ready.' },
]

export default function Brisbane2032() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">PathwayHQ</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/"      className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Home</Link>
            <Link to="/clubs" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Clubs</Link>
            <Link to="/brisbane-2032" className="text-sm font-medium text-white">Brisbane 2032</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"  className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/25">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 60px)' }} />
          <div className="absolute top-0 left-0 h-[500px] w-[700px] rounded-full bg-emerald-600/15 blur-[120px]" />
          <div className="absolute top-0 right-0 h-[300px] w-[400px] rounded-full bg-blue-600/10 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-400 mb-8">
            🏅 Brisbane · Queensland · Australia
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-tight mb-6">
            Brisbane<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">2032</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">
            The most significant sporting event Australia has hosted since Sydney 2000.
            The pathway starts now.
          </p>
          <div className="flex justify-center mb-12">
            <OlympicsCountdown large />
          </div>
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-lg font-bold transition-colors shadow-xl shadow-emerald-500/25">
            Start your pathway today <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Olympic sports grid */}
      <section className="py-20 border-b border-white/5">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-black text-center mb-2">23 Olympic Sports</h2>
          <p className="text-slate-400 text-center mb-10">PathwayHQ supports athletes across every Brisbane 2032 discipline.</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {OLYMPIC_SPORTS.map(s => (
              <div key={s.value} className="rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] transition-colors p-4 text-center">
                <div className="text-3xl mb-2">{s.emoji}</div>
                <p className="text-xs text-slate-400 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 border-b border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-black text-center mb-12">The pathway to 2032</h2>
          <div className="relative">
            <div className="absolute left-16 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-8">
              {TIMELINE.map(item => (
                <div key={item.year} className="relative flex gap-8">
                  <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black border ${
                    item.now ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}>
                    {item.year.slice(2)}
                    {item.now && <span className="absolute -top-2 -right-2 rounded-full bg-amber-400 px-1.5 text-[9px] font-black text-black">NOW</span>}
                  </div>
                  <div className="flex-1 pb-2">
                    <h3 className={`font-bold mb-1 ${item.now ? 'text-emerald-400' : 'text-white'}`}>{item.year} — {item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-black tracking-tight mb-6">Your club. Their Games.</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Register your club on PathwayHQ and start placing every athlete on the pathway to Brisbane 2032. Free to start. Takes 2 minutes.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-lg font-bold transition-colors shadow-xl shadow-emerald-500/25">
            Register your club free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600"><Zap className="h-4 w-4 text-white" /></div>
            <span className="text-sm font-bold">PathwayHQ</span>
          </Link>
          <p className="text-xs text-slate-600">Built in Brisbane · © 2026 PathwayHQ</p>
        </div>
      </footer>
    </div>
  )
}
