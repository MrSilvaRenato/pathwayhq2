import { useState, useEffect } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, MapPin, Clock, Users } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const TYPE_COLORS = {
  training: 'bg-blue-500',
  match:    'bg-emerald-500',
  camp:     'bg-purple-500',
  other:    'bg-slate-400',
}

const TYPE_DOT_COLORS = {
  training: 'bg-blue-500',
  match:    'bg-emerald-500',
  camp:     'bg-purple-500',
  other:    'bg-slate-400',
}

const TYPE_LABELS = {
  training: 'Training',
  match:    'Match',
  camp:     'Camp',
  other:    'Other',
}

const DAYS_FULL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAYS_SHORT = ['S','M','T','W','T','F','S']

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function toLocalDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function parseLocalDate(dateStr) {
  return new Date(dateStr)
}

export default function Calendar() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()

  const today = new Date()

  const [events, setEvents]               = useState([])
  const [squads, setSquads]               = useState([])
  const [selectedDate, setSelectedDate]   = useState(today)
  const [currentMonth, setCurrentMonth]   = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [saving, setSaving]               = useState(false)
  const [showModal, setShowModal]         = useState(false)
  const [showDetail, setShowDetail]       = useState(false)
  const [rsvping, setRsvping]             = useState({})
  const [deletingId, setDeletingId]       = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    start_time: '', end_time: '', event_type: 'training', squad_id: '',
  })

  async function loadEvents() {
    try {
      const { data } = await api.get('/events')
      setEvents(data)
    } catch {
      toast.error('Failed to load events')
    }
  }

  useEffect(() => {
    loadEvents()
    api.get('/squads')
      .then(r => setSquads(r.data))
      .catch(() => {})
  }, [])

  const year  = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDow   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const eventsByDay = {}
  for (const ev of events) {
    const d   = parseLocalDate(ev.start_time)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push(ev)
  }

  const selectedKey    = toLocalDateKey(selectedDate)
  const selectedEvents = (eventsByDay[selectedKey] || [])
    .slice()
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  function prevMonth() { setCurrentMonth(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentMonth(new Date(year, month + 1, 1)) }
  function goToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
    setShowDetail(false)
  }

  function selectDay(day) {
    const d = new Date(year, month, day)
    setSelectedDate(d)
    setShowDetail(true)
  }

  async function handleRsvp(eventId, status) {
    setRsvping(p => ({ ...p, [eventId]: status }))
    try {
      await api.post(`/events/${eventId}/rsvp`, { status })
      await loadEvents()
      toast.success('RSVP updated')
    } catch {
      toast.error('Failed to save RSVP')
    } finally {
      setRsvping(p => ({ ...p, [eventId]: null }))
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/events', { ...form, squad_id: form.squad_id || null })
      await loadEvents()
      setShowModal(false)
      setForm({ title:'', description:'', location:'', start_time:'', end_time:'', event_type:'training', squad_id:'' })
      toast.success('Event added')
    } catch {
      toast.error('Failed to add event')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (deletingId === id) {
      try {
        await api.delete(`/events/${id}`)
        setEvents(p => p.filter(ev => ev.id !== id))
        setDeletingId(null)
        toast.success('Event deleted')
      } catch {
        toast.error('Failed to delete event')
        setDeletingId(null)
      }
    } else {
      setDeletingId(id)
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="pb-24 md:pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 md:px-8 md:pt-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
        </div>
        {/* Desktop "Add event" button — hidden on mobile (FAB used instead) */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="hidden md:flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" /> Add event
          </button>
        )}
      </div>

      <div className="px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Monthly grid ── */}
          <div className="flex-1 min-w-0">
            {/* Month navigation */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={prevMonth}
                className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  {MONTHS[month]} {year}
                </h2>
                <button
                  onClick={goToday}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 border border-emerald-200 hover:border-emerald-300 rounded-lg px-3 py-1.5 transition-colors min-h-[36px]"
                >
                  Today
                </button>
              </div>
              <button
                onClick={nextMonth}
                className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FULL.map((d, i) => (
                <div key={d} className="text-center py-1">
                  <span className="hidden sm:inline text-xs font-semibold text-slate-400">{d}</span>
                  <span className="sm:hidden text-xs font-semibold text-slate-400">{DAYS_SHORT[i]}</span>
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 border-l border-t border-slate-200 rounded-xl overflow-hidden">
              {cells.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="border-r border-b border-slate-200 bg-slate-50/50 h-14 md:min-h-[80px]"
                    />
                  )
                }

                const cellDate   = new Date(year, month, day)
                const cellKey    = toLocalDateKey(cellDate)
                const dayEvs     = eventsByDay[cellKey] || []
                const isToday    = isSameDay(cellDate, today)
                const isSelected = isSameDay(cellDate, selectedDate)
                const hasEvents  = dayEvs.length > 0

                return (
                  <div
                    key={day}
                    onClick={() => selectDay(day)}
                    className={[
                      'border-r border-b border-slate-200 h-14 md:min-h-[80px] p-1 md:p-1.5 flex flex-col transition-colors cursor-pointer select-none',
                      isSelected ? 'bg-emerald-50 ring-inset ring-2 ring-emerald-400' : 'bg-white active:bg-slate-100 hover:bg-slate-50/60',
                    ].join(' ')}
                  >
                    {/* Day number */}
                    <span className={[
                      'text-xs font-bold self-start w-6 h-6 flex items-center justify-center rounded-full mb-1 shrink-0',
                      isToday ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' : 'text-slate-600',
                      isSelected && !isToday ? 'text-emerald-700 font-black' : '',
                    ].join(' ')}>
                      {day}
                    </span>

                    {/* Mobile: dots only */}
                    <div className="flex flex-wrap gap-0.5 md:hidden">
                      {dayEvs.slice(0, 3).map(ev => (
                        <span
                          key={ev.id}
                          className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT_COLORS[ev.event_type] || 'bg-slate-400'}`}
                        />
                      ))}
                    </div>

                    {/* Desktop: text pills */}
                    <div className="hidden md:flex flex-col gap-0.5">
                      {dayEvs.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          className={`${TYPE_COLORS[ev.event_type] || 'bg-slate-400'} rounded px-1 py-0.5 text-white text-[10px] font-semibold truncate leading-tight`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvs.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium pl-0.5">
                          +{dayEvs.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Detail panel — desktop sidebar ── */}
          <div className="hidden lg:block lg:w-80 xl:w-96 shrink-0">
            <div className="sticky top-6">
              <DetailPanel
                selectedDate={selectedDate}
                selectedEvents={selectedEvents}
                isAdmin={isAdmin}
                rsvping={rsvping}
                deletingId={deletingId}
                onRsvp={handleRsvp}
                onDelete={handleDelete}
                onClose={null}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile detail drawer ── */}
      {showDetail && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDetail(false)}
          />
          <div className="relative z-10 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {selectedDate.toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long' })}
                </p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {selectedEvents.length === 0 ? 'No events' : `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <EventList
                selectedEvents={selectedEvents}
                isAdmin={isAdmin}
                rsvping={rsvping}
                deletingId={deletingId}
                onRsvp={handleRsvp}
                onDelete={handleDelete}
                mobile
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Admin FAB (mobile) ── */}
      {isAdmin && (
        <button
          onClick={() => setShowModal(true)}
          className="lg:hidden fixed bottom-20 right-4 z-20 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-colors"
          aria-label="Add event"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      )}

      {/* ── Add event modal / bottom sheet ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full md:max-w-md md:rounded-2xl bg-white md:shadow-2xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-black text-slate-900">Add event</h2>
              <button
                onClick={() => setShowModal(false)}
                className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleAdd} className="space-y-3" id="add-event-form">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className={inputCls}
                    placeholder="Event name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                    <select
                      value={form.event_type}
                      onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="training">Training</option>
                      <option value="match">Match</option>
                      <option value="camp">Camp</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Squad</label>
                    <select
                      value={form.squad_id}
                      onChange={e => setForm(p => ({ ...p, squad_id: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">All squads</option>
                      {squads.map(sq => (
                        <option key={sq.id} value={sq.id}>{sq.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Location</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className={inputCls}
                    placeholder="Venue or address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Start</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.start_time}
                      onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">End</label>
                    <input
                      type="datetime-local"
                      value={form.end_time}
                      onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className={inputCls}
                    placeholder="Optional notes…"
                  />
                </div>
              </form>
            </div>
            <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-event-form"
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 min-h-[44px]"
              >
                {saving ? 'Saving…' : 'Add event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared event list component ───────────────────────────────────────────────
function EventList({ selectedEvents, isAdmin, rsvping, deletingId, onRsvp, onDelete, mobile = false }) {
  if (selectedEvents.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p className="text-sm">No events this day</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {selectedEvents.map(ev => {
        const start    = new Date(ev.start_time)
        const end      = ev.end_time ? new Date(ev.end_time) : null
        const timeStr  = start.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' }) +
          (end ? ` – ${end.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}` : '')
        const myStatus = ev.my_rsvp_status
        const counts   = ev.rsvp_counts || { yes:0, maybe:0, no:0 }
        const isDeleting = deletingId === ev.id

        return (
          <div key={ev.id} className={`p-4 ${mobile ? 'px-5' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`${TYPE_COLORS[ev.event_type] || 'bg-slate-400'} text-white text-[10px] font-bold rounded px-2 py-0.5`}>
                  {TYPE_LABELS[ev.event_type] || ev.event_type}
                </span>
                {ev.squad_name && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="h-3 w-3" />{ev.squad_name}
                  </span>
                )}
              </div>
              {isAdmin && (
                isDeleting ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Remove?</span>
                    <button
                      onClick={() => onDelete(ev.id)}
                      className="min-h-[36px] px-2.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => onDelete('__cancel__')}
                      className="min-h-[36px] px-2.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onDelete(ev.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )
              )}
            </div>

            <h3 className="font-bold text-slate-900 text-sm mb-1">{ev.title}</h3>

            <div className="space-y-1 mb-2">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3 w-3 shrink-0" />{timeStr}
              </p>
              {ev.location && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />{ev.location}
                </p>
              )}
            </div>

            {ev.description && (
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{ev.description}</p>
            )}

            {isAdmin ? (
              <p className="text-xs text-slate-400 font-medium">
                {counts.yes} going · {counts.maybe} maybe · {counts.no} no
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                {[
                  { status:'yes',   label:'✓ Going',        active:'bg-emerald-500 text-white', inactive:'border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300' },
                  { status:'maybe', label:'? Maybe',         active:'bg-amber-400 text-white',   inactive:'border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-300' },
                  { status:'no',    label:"✗ Can't make it", active:'bg-red-400 text-white',     inactive:'border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300' },
                ].map(({ status, label, active, inactive }) => (
                  <button
                    key={status}
                    disabled={rsvping[ev.id] != null}
                    onClick={() => onRsvp(ev.id, status)}
                    className={[
                      'flex-1 rounded-lg py-2.5 text-xs font-bold transition-colors disabled:opacity-50 min-h-[44px]',
                      myStatus === status ? active : inactive,
                    ].join(' ')}
                  >
                    {rsvping[ev.id] === status ? '…' : label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Desktop detail panel ──────────────────────────────────────────────────────
function DetailPanel({ selectedDate, selectedEvents, isAdmin, rsvping, deletingId, onRsvp, onDelete }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {selectedDate.toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long' })}
        </p>
        <p className="text-sm font-bold text-slate-700 mt-0.5">
          {selectedEvents.length === 0
            ? 'No events'
            : `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`}
        </p>
      </div>
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        <EventList
          selectedEvents={selectedEvents}
          isAdmin={isAdmin}
          rsvping={rsvping}
          deletingId={deletingId}
          onRsvp={onRsvp}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
