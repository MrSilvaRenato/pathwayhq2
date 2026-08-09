import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, TrendingUp, Star } from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'

const FTEM_ORDER = ['F1', 'F2', 'T1', 'T2', 'E1', 'E2', 'M']

function trophyTier(phase) {
  if (phase === 'M')                   return { icon: '🥇', dot: '#f59e0b', ring: '#fde68a', cardBg: 'bg-amber-50',  cardBorder: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800' }
  if (phase === 'E1' || phase === 'E2') return { icon: '🥈', dot: '#94a3b8', ring: '#cbd5e1', cardBg: 'bg-slate-50', cardBorder: 'border-slate-200',  badge: 'bg-slate-100 text-slate-700' }
  if (phase?.startsWith('T'))          return { icon: '🥉', dot: '#f97316', ring: '#fed7aa', cardBg: 'bg-orange-50', cardBorder: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' }
  return                                      { icon: '🏅', dot: '#10b981', ring: '#a7f3d0', cardBg: 'bg-emerald-50',cardBorder: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-800' }
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(a) {
  return `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

export default function AthleteProfileView() {
  const { id } = useParams()
  const [athlete,    setAthlete]    = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/athletes/${id}`),
      api.get(`/milestones/athlete/${id}`),
    ]).then(([aRes, mRes]) => {
      setAthlete(aRes.data)
      setMilestones(Array.isArray(mRes.data) ? mRes.data : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-400 text-sm">Could not load profile.</p>
      </div>
    )
  }

  const sportMeta  = SPORTS.find(s => s.value === athlete.sport)
  const phase      = FTEM_PHASES[athlete.ftem_phase]
  const phaseIndex = FTEM_ORDER.indexOf(athlete.ftem_phase)
  const age        = calcAge(athlete.dob)
  const name       = `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim()

  return (
    <div className="max-w-3xl mx-auto pb-12">

      {/* Back */}
      <div className="px-4 pt-4 md:px-0 md:pt-6 mb-4">
        <Link to={`/athletes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to detail
        </Link>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl overflow-hidden border border-slate-100 mb-4">
        {/* Dark hero strip */}
        <div className="bg-[#052e16] px-6 py-10 flex flex-col items-center text-center text-white">
          <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white/20 flex items-center justify-center bg-emerald-500 text-white text-3xl font-black shadow-2xl mb-4">
            {athlete.avatar_url
              ? <img src={athlete.avatar_url} alt={name} className="h-full w-full object-cover" />
              : initials(athlete)}
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-3">{name}</h1>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {sportMeta && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium">
                {sportMeta.emoji} {sportMeta.label}
              </span>
            )}
            {athlete.position && (
              <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-400/15 px-3 py-1.5 text-sm font-medium text-indigo-200">
                {athlete.position}
              </span>
            )}
            {age !== null && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium">
                Age {age}
              </span>
            )}
            {athlete.gender && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium capitalize">
                {athlete.gender}
              </span>
            )}
          </div>

          {phase && (
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${FTEM_PHASES[athlete.ftem_phase]?.color ?? 'bg-emerald-100 text-emerald-800'}`}>
              <TrendingUp className="h-3.5 w-3.5" />
              {athlete.ftem_phase} · {phase.label}
            </span>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 bg-white border-t border-slate-100">
          {[
            { value: milestones.length, label: 'Achievements' },
            { value: athlete.ftem_phase ?? '—', label: 'FTEM Phase' },
            { value: sportMeta?.emoji ?? '🏅', label: sportMeta?.label ?? 'Sport' },
          ].map((s, i) => (
            <div key={i} className={`flex flex-col items-center py-5 ${i < 2 ? 'border-r border-slate-100' : ''}`}>
              <span className="text-2xl font-black text-slate-900">{s.value}</span>
              <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wide font-semibold">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Development Pathway */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 mb-4">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-emerald-500" /> Development Pathway
        </h2>
        <div className="space-y-1.5">
          {FTEM_ORDER.map((p, i) => {
            const pMeta   = FTEM_PHASES[p]
            const active  = p === athlete.ftem_phase
            const reached = i <= phaseIndex
            return (
              <div key={p} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
                active  ? `${pMeta?.color ?? 'bg-emerald-100 text-emerald-700'} font-bold` :
                reached ? 'bg-slate-50 border border-slate-100' :
                          'opacity-30'
              }`}>
                <span className={`w-7 text-center font-black text-sm ${active ? '' : 'text-slate-500'}`}>{p}</span>
                <span className={`flex-1 text-sm ${active ? 'font-bold' : 'text-slate-500'}`}>{pMeta?.label ?? p}</span>
                {active  && <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-bold">Current</span>}
                {reached && !active && <span className="text-emerald-500 text-xs font-bold">✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Trophy Cabinet */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-amber-500" /> Trophy Cabinet
          <span className="ml-auto text-xs font-normal text-slate-400">{milestones.length} club milestone{milestones.length !== 1 ? 's' : ''}</span>
        </h2>

        {milestones.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No milestones recorded for this athlete yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-amber-100" />
            <div className="space-y-3">
              {milestones.map((m, i) => {
                const t = trophyTier(m.ftem_phase)
                return (
                  <div key={m.id ?? i} className="relative pl-10">
                    <div className="absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: t.dot }} />
                    <div className={`rounded-xl border ${t.cardBorder} ${t.cardBg} p-4`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{t.icon}</span>
                          <p className="font-semibold text-slate-800 text-sm leading-snug">{m.title}</p>
                        </div>
                        {m.ftem_phase && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${t.badge}`}>{m.ftem_phase}</span>
                        )}
                      </div>
                      {m.description && <p className="text-xs text-slate-500 leading-relaxed mb-2">{m.description}</p>}
                      {m.club_name && (
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="text-[11px] text-slate-400 font-medium">{m.club_name}</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-400">{fmtDate(m.achieved_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
