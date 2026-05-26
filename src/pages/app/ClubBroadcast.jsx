import { useState, useEffect, useMemo } from 'react'
import {
  Megaphone, Search, CheckSquare, Square, Users,
  Send, Loader2, Check, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import api from '../../lib/api'
import { FTEM_PHASES } from '../../lib/constants'
import { useToast } from '../../contexts/ToastContext'

function initials(first = '', last = '') {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?'
}

const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

export default function ClubBroadcast() {
  const toast = useToast()
  const [athletes,  setAthletes]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(new Set())
  const [q,         setQ]         = useState('')
  const [showList,  setShowList]  = useState(true)
  const [form,      setForm]      = useState({ title: '', body: '', link: '' })
  const [confirming, setConfirming] = useState(false)
  const [sending,   setSending]   = useState(false)
  const [lastSent,  setLastSent]  = useState(null)

  useEffect(() => {
    api.get('/club/broadcast/athletes')
      .then(r => setAthletes(r.data))
      .catch(() => toast.error('Failed to load athletes'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return athletes
    const lq = q.toLowerCase()
    return athletes.filter(a =>
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(lq)
    )
  }, [athletes, q])

  const allFilteredSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id))

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(a => next.delete(a.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(a => next.add(a.id))
        return next
      })
    }
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSend(e) {
    e.preventDefault()
    if (selected.size === 0) {
      toast.error('Select at least one athlete')
      return
    }
    setConfirming(true)
  }

  async function confirmSend() {
    setConfirming(false)
    setSending(true)
    try {
      const { data } = await api.post('/club/broadcast', {
        ...form,
        athlete_ids: [...selected],
      })
      setLastSent({ ...form, count: data.count })
      setForm({ title: '', body: '', link: '' })
      setSelected(new Set())
      toast.success(`Sent to ${data.count} athlete${data.count !== 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-12">

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Megaphone className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-black text-slate-900">Send Notification</h1>
        </div>
        <p className="text-sm text-slate-500">Send a direct notification to athletes in your club.</p>
      </div>

      {/* Success banner */}
      {lastSent && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="shrink-0 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">
              Sent to {lastSent.count} athlete{lastSent.count !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">"{lastSent.title}"</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Left: athlete picker ──────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

          {/* Picker header */}
          <button
            type="button"
            onClick={() => setShowList(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors lg:cursor-default"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-slate-800">
                Recipients
              </span>
              {selected.size > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                  {selected.size}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <span className="text-xs text-slate-400">{athletes.length} athletes</span>
              {showList ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </div>
          </button>

          {(showList || window.innerWidth >= 1024) && (
            <>
              {/* Search + select all */}
              <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search athletes…"
                    className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition-colors px-1"
                >
                  {allFilteredSelected
                    ? <CheckSquare className="h-4 w-4 text-emerald-500" />
                    : <Square className="h-4 w-4 text-slate-400" />
                  }
                  {allFilteredSelected ? 'Deselect all' : `Select all${q ? ' matching' : ''}`}
                  <span className="text-slate-400 font-normal">({filtered.length})</span>
                </button>
              </div>

              {/* Athlete list */}
              <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                {loading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading…</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">
                    {q ? 'No athletes match your search' : 'No athletes with accounts in your club'}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {filtered.map(a => {
                      const isChecked = selected.has(a.id)
                      const ftem = FTEM_PHASES[a.ftem_phase]
                      return (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => toggleOne(a.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isChecked ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                          >
                            {/* Checkbox */}
                            <div className={`shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                              {isChecked && <Check className="h-3 w-3 text-white" />}
                            </div>
                            {/* Avatar */}
                            <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-emerald-100 text-emerald-700 text-xs font-black">
                              {a.avatar_url
                                ? <img src={a.avatar_url} alt={a.first_name} className="h-full w-full object-cover" />
                                : initials(a.first_name, a.last_name)}
                            </div>
                            {/* Name + phase */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                                {a.first_name} {a.last_name}
                              </p>
                              {ftem && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ftem.color}`}>
                                  {a.ftem_phase}
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Right: compose form ───────────────────────────────── */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white shadow-sm p-5 md:p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-emerald-500" />
            Compose Message
          </h2>

          <form onSubmit={handleSend} className="space-y-4">

            {/* Recipient summary */}
            <div className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
              selected.size > 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold'
                : 'border-slate-200 bg-slate-50 text-slate-400'
            }`}>
              {selected.size > 0
                ? `${selected.size} athlete${selected.size !== 1 ? 's' : ''} selected`
                : 'No athletes selected — pick from the list'}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                Title *
              </label>
              <input
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Training cancelled this Friday"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                className={inputCls}
                placeholder="What do you want to tell your athletes?"
              />
              <p className="text-right text-[11px] text-slate-400 mt-1">{form.body.length} / 5000</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                Link <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                value={form.link}
                onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                className={inputCls}
                placeholder="/calendar or https://…"
              />
            </div>

            {confirming ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-900 text-center">
                  Send to <span className="font-black">{selected.size} athlete{selected.size !== 1 ? 's' : ''}</span>?
                </p>
                <p className="text-xs text-amber-700 text-center leading-relaxed">
                  "{form.title}"
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmSend}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white transition-colors shadow-sm shadow-emerald-500/20"
                  >
                    <Send className="h-3.5 w-3.5" /> Yes, send it
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={sending || selected.size === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-3.5 text-sm font-bold text-white transition-colors shadow-sm shadow-emerald-500/20"
              >
                {sending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  : <><Send className="h-4 w-4" /> Send to {selected.size || '—'} athlete{selected.size !== 1 ? 's' : ''}</>
                }
              </button>
            )}
          </form>
        </div>

      </div>
    </div>
  )
}
