import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, ChevronDown, ChevronUp, X, ArrowRight,
  Building2, Users, Layers, Calendar, Megaphone, HandHeart,
  Sparkles,
} from 'lucide-react'

const DISMISS_KEY  = 'phq_wizard_v1_dismissed'
const OPEN_KEY     = 'phq_wizard_v1_open'

const STEPS = [
  {
    id:    'profile',
    num:   1,
    title: 'Complete your club profile',
    desc:  'Add your sport, city, and a logo so athletes can find and recognise your club.',
    icon:  Building2,
    href:  '/settings',
    btn:   'Go to Settings',
    active: 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-200',
    row:    'bg-blue-50/50',
  },
  {
    id:    'athlete',
    num:   2,
    title: 'Add your first athlete',
    desc:  "Invite athletes by email — they'll receive a link to claim their profile and join your club.",
    icon:  Users,
    href:  '/athletes',
    btn:   'Go to Athletes',
    active: 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200',
    row:    'bg-emerald-50/50',
  },
  {
    id:    'squad',
    num:   3,
    title: 'Create a squad',
    desc:  'Group athletes by age or skill level for targeted session scheduling and communications.',
    icon:  Layers,
    href:  '/squad',
    btn:   'Go to Squads',
    active: 'bg-purple-500 border-purple-500 text-white shadow-sm shadow-purple-200',
    row:    'bg-purple-50/50',
  },
  {
    id:    'calendar',
    num:   4,
    title: 'Schedule a training session',
    desc:  'Add your first event — training, match, or camp — and let athletes RSVP.',
    icon:  Calendar,
    href:  '/calendar',
    btn:   'Go to Calendar',
    active: 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200',
    row:    'bg-rose-50/50',
  },
  {
    id:    'announcement',
    num:   5,
    title: 'Post your first announcement',
    desc:  'Keep athletes, parents, and coaches informed with club news and reminders.',
    icon:  Megaphone,
    href:  '/announcements',
    btn:   'Go to Announcements',
    active: 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200',
    row:    'bg-amber-50/50',
  },
  {
    id:    'volunteering',
    num:   6,
    title: 'Create a volunteer opportunity',
    desc:  'Recruit parents and supporters to help run events, canteen duty, and game days.',
    icon:  HandHeart,
    href:  '/volunteering',
    btn:   'Go to Volunteering',
    active: 'bg-teal-500 border-teal-500 text-white shadow-sm shadow-teal-200',
    row:    'bg-teal-50/50',
  },
]

export default function OnboardingWizard({ club, athletes, squads, eventsTotal, announcements, volunteering }) {
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISS_KEY))
  const [open, setOpen]           = useState(() => localStorage.getItem(OPEN_KEY) !== 'false')

  if (dismissed) return null

  const completed = {
    profile:      !!(club?.sport && club?.city),
    athlete:      athletes.length > 0,
    squad:        squads.length > 0,
    calendar:     eventsTotal > 0,
    announcement: announcements.length > 0,
    volunteering: volunteering.length > 0,
  }

  const completedCount     = STEPS.filter(s => completed[s.id]).length
  const allDone            = completedCount === STEPS.length
  const firstIncompleteIdx = STEPS.findIndex(s => !completed[s.id])
  const pct                = Math.round((completedCount / STEPS.length) * 100)

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  function toggleOpen() {
    const next = !open
    setOpen(next)
    localStorage.setItem(OPEN_KEY, String(next))
  }

  // All done — show celebration banner
  if (allDone) {
    return (
      <div className="col-span-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 flex items-center gap-4 shadow-sm">
        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-sm">You're all set! 🎉</p>
          <p className="text-xs text-emerald-100 mt-0.5">
            All 6 setup steps complete — your club is fully configured.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="col-span-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 py-3.5 md:px-5 flex items-center gap-3">
        {/* Icon */}
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
          <Sparkles className="h-4 w-4 text-white" />
        </div>

        {/* Title + progress bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-sm font-black text-slate-900">Getting started</p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 shrink-0">
              {completedCount} / {STEPS.length} steps
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleOpen}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={open ? 'Collapse guide' : 'Expand guide'}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={dismiss}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Steps list ── */}
      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {STEPS.map((step, idx) => {
            const done      = completed[step.id]
            const isCurrent = idx === firstIncompleteIdx
            const Icon      = step.icon

            return (
              <div
                key={step.id}
                className={[
                  'flex items-start gap-3.5 px-4 py-3.5 md:px-5 transition-colors',
                  isCurrent ? step.row : 'bg-white',
                  done ? 'opacity-60' : '',
                ].join(' ')}
              >
                {/* Step indicator */}
                <div className="shrink-0 mt-0.5">
                  {done ? (
                    <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                  ) : (
                    <div className={[
                      'h-7 w-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all',
                      isCurrent ? step.active : 'bg-white border-slate-200 text-slate-400',
                    ].join(' ')}>
                      {step.num}
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={[
                    'text-sm font-bold leading-snug',
                    done ? 'text-slate-400' : isCurrent ? 'text-slate-900' : 'text-slate-600',
                  ].join(' ')}>
                    {step.title}
                  </p>
                  {!done && (
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-md">
                      {step.desc}
                    </p>
                  )}
                </div>

                {/* Action button */}
                <Link
                  to={step.href}
                  className={[
                    'shrink-0 self-center flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all min-h-[36px] whitespace-nowrap',
                    done
                      ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      : isCurrent
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-200'
                        : 'border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span className="hidden sm:inline">{done ? 'Revisit' : step.btn}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
