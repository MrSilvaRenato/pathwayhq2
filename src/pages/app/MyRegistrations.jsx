import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle2, Clock, Building2, CalendarDays, Loader2, DollarSign } from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'

const STATUS = {
  invited:          { label: 'Payment required', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  manual_pending:   { label: 'Pay at club',       color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400' },
  paid:             { label: 'Paid ✓',            color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  manual_confirmed: { label: 'Paid ✓',            color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  rejected:         { label: 'Not required',      color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-300' },
}

function fmtMoney(cents, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(cents / 100)
}

function PayModal({ reg, onClose, onPaid }) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function choose(method) {
    setLoading(method)
    try {
      const res = await api.post(`/registrations/${reg.id}/pay`, { method })
      if (method === 'manual') {
        toast.success("Your club has been notified. Pay when you're at the club.")
        onPaid()
      } else if (res.data.client_secret) {
        // Stripe — for now show message since Stripe.js needs to be configured
        toast.success('Redirecting to payment…')
        // TODO: integrate Stripe.js Elements with client_secret
        onPaid()
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to process')
    } finally { setLoading(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-6 text-white text-center">
          <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-80" />
          <h2 className="font-black text-xl">{fmtMoney(reg.fee_cents, reg.currency)}</h2>
          <p className="text-emerald-100 text-sm mt-1">{reg.season_name}</p>
          <p className="text-emerald-200 text-xs mt-0.5">{reg.club_name}</p>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-500 text-center">How would you like to pay?</p>
          <button onClick={() => choose('stripe')} disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 py-3.5 text-sm font-bold text-white transition-colors">
            {loading === 'stripe' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Pay online by card
          </button>
          <button onClick={() => choose('manual')} disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60 py-3.5 text-sm font-bold text-slate-700 transition-colors">
            {loading === 'manual' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            I'll pay at the club
          </button>
          <button onClick={onClose} className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyRegistrations() {
  const [regs,    setRegs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [paying,  setPaying]  = useState(null)
  const toast = useToast()

  const load = () => {
    api.get('/my-registrations')
      .then(r => setRegs(r.data))
      .catch(() => toast.error('Failed to load registrations'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const pending = regs.filter(r => r.status === 'invited')
  const others  = regs.filter(r => r.status !== 'invited')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CreditCard className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Season Registrations</h1>
          <p className="text-sm text-slate-500">Your club registration payments</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : regs.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CreditCard className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-500">No registration requests yet</p>
          <p className="text-sm text-slate-400 mt-1">Your club manager will send you a payment request when the season opens.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-1 overflow-hidden">
              <p className="text-xs font-bold text-amber-700 px-4 pt-3 pb-1 uppercase tracking-wider">Action required</p>
              <div className="space-y-1">
                {pending.map(r => {
                  const s = STATUS[r.status]
                  return (
                    <div key={r.id} className="bg-white rounded-xl mx-1 mb-1 p-4 flex items-center gap-4 shadow-sm">
                      {r.club_logo
                        ? <img src={r.club_logo} alt={r.club_name} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                        : <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-lg shrink-0">{r.club_name?.[0]}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900">{r.season_name}</p>
                        <p className="text-sm text-slate-500">{r.club_name}</p>
                        {r.start_date && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(r.start_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                            {r.end_date && <> – {new Date(r.end_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</>}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900 text-lg">{fmtMoney(r.fee_cents, r.currency)}</p>
                        <button onClick={() => setPaying(r)}
                          className="mt-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-white transition-colors">
                          Pay now
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {others.map(r => {
            const s = STATUS[r.status] ?? STATUS.invited
            return (
              <div key={r.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex items-center gap-4">
                {r.club_logo
                  ? <img src={r.club_logo} alt={r.club_name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                  : <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black shrink-0">{r.club_name?.[0]}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">{r.season_name}</p>
                  <p className="text-sm text-slate-500">{r.club_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${s.color}`}>{s.label}</span>
                  {r.paid_at && <p className="text-xs text-slate-400 mt-0.5">{new Date(r.paid_at).toLocaleDateString('en-AU')}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {paying && (
        <PayModal
          reg={paying}
          onClose={() => setPaying(null)}
          onPaid={() => { setPaying(null); load() }}
        />
      )}
    </div>
  )
}
