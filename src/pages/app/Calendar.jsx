import { useState, useEffect, useRef } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, MapPin, Clock, Users, RefreshCw, Trash2, Pencil, ChevronDown, CheckCircle2, HelpCircle, XCircle, FileText } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const TYPE_META = {
  training: { label: 'Training',  pill: 'bg-blue-500',    dot: 'bg-blue-500',    accent: 'border-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700' },
  match:    { label: 'Match',     pill: 'bg-emerald-500', dot: 'bg-emerald-500', accent: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  camp:     { label: 'Camp',      pill: 'bg-purple-500',  dot: 'bg-purple-500',  accent: 'border-purple-500',  bg: 'bg-purple-50',  text: 'text-purple-700',  badge: 'bg-purple-100 text-purple-700' },
  other:    { label: 'Other',     pill: 'bg-slate-400',   dot: 'bg-slate-400',   accent: 'border-slate-400',   bg: 'bg-slate-50',   text: 'text-slate-600',   badge: 'bg-slate-100 text-slate-600' },
}
const tm = (type) => TYPE_META[type] || TYPE_META.other

// keep legacy aliases so pill/dot refs still work
const TYPE_COLORS     = Object.fromEntries(Object.entries(TYPE_META).map(([k,v]) => [k, v.pill]))
const TYPE_DOT_COLORS = Object.fromEntries(Object.entries(TYPE_META).map(([k,v]) => [k, v.dot]))
const TYPE_LABELS     = Object.fromEntries(Object.entries(TYPE_META).map(([k,v]) => [k, v.label]))

const DAYS_FULL  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
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

function dateToLocal(date, hour = 9) {
  const d = new Date(date)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

function countOccurrences(startDate, repeatUntil, recurrence) {
  let count = 0
  let cur = new Date(startDate)
  const until = new Date(repeatUntil)
  const maxIter = 104
  while (cur <= until && count < maxIter) {
    count++
    if (recurrence === 'daily')         cur.setDate(cur.getDate() + 1)
    else if (recurrence === 'weekly')   cur.setDate(cur.getDate() + 7)
    else if (recurrence === 'biweekly') cur.setDate(cur.getDate() + 14)
    else if (recurrence === 'monthly')  cur.setMonth(cur.getMonth() + 1)
    else break
  }
  return count
}

function defaultRepeatUntil(startDate, recurrence) {
  const d = new Date(startDate)
  if (recurrence === 'daily')         d.setMonth(d.getMonth() + 1)
  else if (recurrence === 'weekly')   d.setMonth(d.getMonth() + 3)
  else if (recurrence === 'biweekly') d.setMonth(d.getMonth() + 3)
  else if (recurrence === 'monthly')  d.setMonth(d.getMonth() + 6)
  return d.toISOString().slice(0, 10)
}

const BLANK_FORM = {
  title: '', description: '', location: '',
  start_time: '', end_time: '', event_type: 'training', squad_id: '',
  recurrence: 'none', repeat_until: '',
}

export default function Calendar() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()

  const today = new Date()

  const [events, setEvents]             = useState([])
  const [squads, setSquads]             = useState([])
  const [selectedDate, setSelectedDate] = useState(today)
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [saving, setSaving]             = useState(false)
  const [showModal, setShowModal]       = useState(false)
  const [showDetail, setShowDetail]     = useState(false)
  const [rsvping, setRsvping]           = useState({})
  const [deletingId, setDeletingId]     = useState(null)

  const [quickForm, setQuickForm]         = useState({ ...BLANK_FORM })
  const [quickSaving, setQuickSaving]     = useState(false)
  const [quickExpanded, setQuickExpanded] = useState(false)
  const [showMoreOpts, setShowMoreOpts]   = useState(false)
  const quickTitleRef = useRef(null)

  const [form, setForm] = useState({ ...BLANK_FORM })

  const [editingEvent, setEditingEvent]   = useState(null)
  const [editForm, setEditForm]           = useState({ ...BLANK_FORM })
  const [editSaving, setEditSaving]       = useState(false)
  // 'choose' → show scope picker | 'one' → edit this only | 'series' → edit whole series
  const [editScope, setEditScope]         = useState('choose')

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
    api.get('/squads').then(r => setSquads(r.data)).catch(() => {})
  }, [])

  const year  = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDow    = new Date(year, month, 1).getDay()
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

    if (isAdmin) {
      const start = dateToLocal(d, 9)
      const end   = dateToLocal(d, 10)
      setQuickForm(prev => ({
        ...BLANK_FORM,
        start_time:   start,
        end_time:     end,
        recurrence:   prev.recurrence ?? 'none',
        repeat_until: '',
      }))
      setQuickExpanded(true)
      setShowMoreOpts(false)
      setTimeout(() => quickTitleRef.current?.focus(), 60)
    }
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

  async function handleDelete(id, seriesMode = false) {
    const ev = events.find(e => e.id === id)
    if (!ev) return

    if (deletingId !== id) {
      setDeletingId(id)
      return
    }

    const url = seriesMode ? `/events/${id}?series=true` : `/events/${id}`
    try {
      await api.delete(url)
      if (seriesMode && ev.series_id) {
        setEvents(p => p.filter(e => e.series_id !== ev.series_id))
      } else {
        setEvents(p => p.filter(e => e.id !== id))
      }
      setDeletingId(null)
      toast.success(seriesMode ? 'Series deleted' : 'Event deleted')
    } catch {
      toast.error('Failed to delete event')
      setDeletingId(null)
    }
  }

  function cancelDelete() {
    setDeletingId(null)
  }

  function openEdit(ev) {
    setEditingEvent(ev)
    setEditForm({
      title:       ev.title       || '',
      description: ev.description || '',
      location:    ev.location    || '',
      start_time:  ev.start_time  ? ev.start_time.slice(0, 16) : '',
      end_time:    ev.end_time    ? ev.end_time.slice(0, 16)   : '',
      event_type:  ev.event_type  || 'training',
      squad_id:    ev.squad_id    || '',
      recurrence:  ev.recurrence  || 'none',
      repeat_until: '',
    })
    // If this event is part of a series, ask the user which scope to edit
    setEditScope(ev.series_id ? 'choose' : 'one')
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editingEvent) return
    setEditSaving(true)
    try {
      const isSeries = editScope === 'series'
      const url      = isSeries
        ? `/events/${editingEvent.id}?series=true`
        : `/events/${editingEvent.id}`

      // For series edits: shared fields only (no times — each occurrence keeps its own)
      const payload = isSeries
        ? {
            title:       editForm.title,
            description: editForm.description || null,
            location:    editForm.location    || null,
            event_type:  editForm.event_type,
            squad_id:    editForm.squad_id    || null,
          }
        : {
            ...editForm,
            squad_id: editForm.squad_id || null,
          }

      await api.put(url, payload)
      await loadEvents()
      setEditingEvent(null)
      toast.success(isSeries ? 'All sessions in series updated' : 'Event updated')
    } catch {
      toast.error('Failed to update event')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleQuickAdd(e) {
    e.preventDefault()
    if (!quickForm.title.trim()) return
    setQuickSaving(true)
    try {
      await api.post('/events', {
        ...quickForm,
        squad_id:     quickForm.squad_id || null,
        recurrence:   quickForm.recurrence || 'none',
        repeat_until: quickForm.recurrence !== 'none' ? quickForm.repeat_until || null : null,
      })
      await loadEvents()
      const start = dateToLocal(selectedDate, 9)
      const end   = dateToLocal(selectedDate, 10)
      const count = quickOccurrenceCount()
      setQuickForm({ ...BLANK_FORM, start_time: start, end_time: end })
      setShowMoreOpts(false)
      toast.success(count > 1 ? `Added ${count} sessions` : 'Event added')
    } catch {
      toast.error('Failed to add event')
    } finally {
      setQuickSaving(false)
    }
  }

  function quickOccurrenceCount() {
    if (!quickForm.recurrence || quickForm.recurrence === 'none') return 1
    if (!quickForm.repeat_until || !quickForm.start_time) return 1
    return countOccurrences(quickForm.start_time, quickForm.repeat_until, quickForm.recurrence)
  }

  function onQuickRecurrenceChange(val) {
    setQuickForm(prev => {
      const until = val !== 'none' && prev.start_time
        ? defaultRepeatUntil(prev.start_time, val)
        : ''
      return { ...prev, recurrence: val, repeat_until: until }
    })
  }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/events', {
        ...form,
        squad_id:     form.squad_id || null,
        recurrence:   form.recurrence || 'none',
        repeat_until: form.recurrence !== 'none' ? form.repeat_until || null : null,
      })
      await loadEvents()
      const count = modalOccurrenceCount()
      setShowModal(false)
      setForm({ ...BLANK_FORM })
      toast.success(count > 1 ? `Added ${count} sessions` : 'Event added')
    } catch {
      toast.error('Failed to add event')
    } finally {
      setSaving(false)
    }
  }

  function modalOccurrenceCount() {
    if (!form.recurrence || form.recurrence === 'none') return 1
    if (!form.repeat_until || !form.start_time) return 1
    return countOccurrences(form.start_time, form.repeat_until, form.recurrence)
  }

  function onModalRecurrenceChange(val) {
    setForm(prev => {
      const until = val !== 'none' && prev.start_time
        ? defaultRepeatUntil(prev.start_time, val)
        : ''
      return { ...prev, recurrence: val, repeat_until: until }
    })
  }

  const inputCls   = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
  const inputSmCls = 'w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500'

  const qCount = quickOccurrenceCount()
  const mCount = modalOccurrenceCount()

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 md:px-8 md:pt-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
        </div>
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

          {/* Monthly grid */}
          <div className="flex-1 min-w-0">
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

            <div className="grid grid-cols-7 mb-1">
              {DAYS_FULL.map((d, i) => (
                <div key={d} className="text-center py-1">
                  <span className="hidden sm:inline text-xs font-semibold text-slate-400">{d}</span>
                  <span className="sm:hidden text-xs font-semibold text-slate-400">{DAYS_SHORT[i]}</span>
                </div>
              ))}
            </div>

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

                return (
                  <div
                    key={day}
                    onClick={() => selectDay(day)}
                    className={[
                      'border-r border-b border-slate-200 h-14 md:min-h-[80px] p-1 md:p-1.5 flex flex-col transition-colors cursor-pointer select-none',
                      isSelected ? 'bg-emerald-50 ring-inset ring-2 ring-emerald-400' : 'bg-white active:bg-slate-100 hover:bg-slate-50/60',
                    ].join(' ')}
                  >
                    <span className={[
                      'text-xs font-bold self-start w-6 h-6 flex items-center justify-center rounded-full mb-1 shrink-0',
                      isToday ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' : 'text-slate-600',
                      isSelected && !isToday ? 'text-emerald-700 font-black' : '',
                    ].join(' ')}>
                      {day}
                    </span>

                    <div className="flex flex-wrap gap-0.5 md:hidden">
                      {dayEvs.slice(0, 3).map(ev => (
                        <span
                          key={ev.id}
                          className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT_COLORS[ev.event_type] || 'bg-slate-400'}`}
                        />
                      ))}
                    </div>

                    <div className="hidden md:flex flex-col gap-0.5">
                      {dayEvs.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          className={`${TYPE_COLORS[ev.event_type] || 'bg-slate-400'} rounded px-1 py-0.5 text-white text-[10px] font-semibold truncate leading-tight flex items-center gap-0.5`}
                          title={ev.title}
                        >
                          {ev.series_id && <RefreshCw className="h-2 w-2 shrink-0 opacity-80" />}
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

          {/* Desktop detail panel */}
          <div className="hidden lg:block lg:w-80 xl:w-96 shrink-0">
            <div className="sticky top-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {selectedDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    {selectedEvents.length === 0 ? 'No events' : `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* Quick-add form — admin only */}
                {isAdmin && (
                  <div className="border-b border-slate-100">
                    <button
                      onClick={() => setQuickExpanded(v => !v)}
                      className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> {quickExpanded ? 'Cancel' : 'Quick add'}
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${quickExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {quickExpanded && (
                      <form onSubmit={handleQuickAdd} className="px-4 pb-4 space-y-2.5">
                        <input
                          ref={quickTitleRef}
                          required
                          value={quickForm.title}
                          onChange={e => setQuickForm(p => ({ ...p, title: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(e) }
                          }}
                          className={inputSmCls}
                          placeholder="e.g. Training session"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={quickForm.event_type}
                            onChange={e => setQuickForm(p => ({ ...p, event_type: e.target.value }))}
                            className={inputSmCls}
                          >
                            <option value="training">Training</option>
                            <option value="match">Match</option>
                            <option value="camp">Camp</option>
                            <option value="other">Other</option>
                          </select>
                          <select
                            value={quickForm.squad_id}
                            onChange={e => setQuickForm(p => ({ ...p, squad_id: e.target.value }))}
                            className={inputSmCls}
                          >
                            <option value="">All squads</option>
                            {squads.map(sq => (
                              <option key={sq.id} value={sq.id}>{sq.name}</option>
                            ))}
                          </select>
                        </div>

                        <select
                          value={quickForm.recurrence}
                          onChange={e => onQuickRecurrenceChange(e.target.value)}
                          className={inputSmCls}
                        >
                          <option value="none">No repeat</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Every 2 weeks</option>
                          <option value="monthly">Monthly</option>
                        </select>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Start</label>
                            <input
                              type="datetime-local"
                              required
                              value={quickForm.start_time}
                              onChange={e => setQuickForm(p => ({ ...p, start_time: e.target.value }))}
                              className={inputSmCls}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 mb-1 block">End</label>
                            <input
                              type="datetime-local"
                              value={quickForm.end_time}
                              onChange={e => setQuickForm(p => ({ ...p, end_time: e.target.value }))}
                              className={inputSmCls}
                            />
                          </div>
                        </div>

                        {quickForm.recurrence !== 'none' && (
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Repeat until</label>
                            <input
                              type="date"
                              value={quickForm.repeat_until}
                              onChange={e => setQuickForm(p => ({ ...p, repeat_until: e.target.value }))}
                              className={inputSmCls}
                            />
                            {quickForm.repeat_until && qCount > 1 && (
                              <p className="text-[10px] text-emerald-600 font-medium mt-1">
                                Will create {qCount} sessions
                              </p>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowMoreOpts(v => !v)}
                          className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showMoreOpts ? 'Hide options' : 'More options'}
                        </button>

                        {showMoreOpts && (
                          <div className="space-y-2">
                            <input
                              value={quickForm.location}
                              onChange={e => setQuickForm(p => ({ ...p, location: e.target.value }))}
                              className={inputSmCls}
                              placeholder="Location"
                            />
                            <textarea
                              value={quickForm.description}
                              onChange={e => setQuickForm(p => ({ ...p, description: e.target.value }))}
                              rows={2}
                              className={inputSmCls}
                              placeholder="Description"
                            />
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={quickSaving || !quickForm.title.trim()}
                          className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 py-2 text-xs font-bold text-white disabled:opacity-50 transition-colors min-h-[36px]"
                        >
                          {quickSaving ? 'Saving...' : qCount > 1 ? `Add ${qCount} sessions` : 'Add event'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                  <EventList
                    selectedEvents={selectedEvents}
                    isAdmin={isAdmin}
                    rsvping={rsvping}
                    deletingId={deletingId}
                    onRsvp={handleRsvp}
                    onDelete={handleDelete}
                    onCancelDelete={cancelDelete}
                    onEdit={openEdit}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile detail drawer */}
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
                  {selectedDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                onCancelDelete={cancelDelete}
                onEdit={openEdit}
                mobile
              />
            </div>
          </div>
        </div>
      )}

      {/* Admin FAB (mobile) */}
      {isAdmin && (
        <button
          onClick={() => setShowModal(true)}
          className="lg:hidden fixed bottom-20 right-4 z-20 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-colors"
          aria-label="Add event"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Add event modal / bottom sheet */}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Repeat</label>
                    <select
                      value={form.recurrence}
                      onChange={e => onModalRecurrenceChange(e.target.value)}
                      className={inputCls}
                    >
                      <option value="none">No repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  {form.recurrence !== 'none' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Until</label>
                      <input
                        type="date"
                        value={form.repeat_until}
                        onChange={e => setForm(p => ({ ...p, repeat_until: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>

                {form.recurrence !== 'none' && form.repeat_until && mCount > 1 && (
                  <p className="text-xs text-emerald-600 font-medium">
                    Will create {mCount} sessions
                  </p>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className={inputCls}
                    placeholder="Optional notes..."
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
                {saving ? 'Saving...' : mCount > 1 ? `Add ${mCount} sessions` : 'Add event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit event modal ── */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full md:max-w-md md:rounded-2xl bg-white md:shadow-2xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">

            {/* Drag handle on mobile */}
            <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editScope === 'choose' ? 'Edit recurring event' : editScope === 'series' ? 'Edit all sessions' : 'Edit event'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{editingEvent.title}</p>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── Scope chooser (only for series events) ── */}
            {editScope === 'choose' ? (
              <div className="px-6 py-6 flex flex-col gap-3">
                <p className="text-sm text-slate-500 mb-1">
                  This event is part of a repeating series. Which sessions do you want to edit?
                </p>

                <button
                  onClick={() => setEditScope('one')}
                  className="flex items-start gap-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 p-4 text-left transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-100">
                    <RefreshCw className="h-5 w-5 text-blue-500 group-hover:text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">This session only</p>
                    <p className="text-xs text-slate-400 mt-0.5">Edit the date, time, and details of just this one occurrence.</p>
                  </div>
                </button>

                <button
                  onClick={() => setEditScope('series')}
                  className="flex items-start gap-4 rounded-2xl border-2 border-slate-200 hover:border-violet-400 hover:bg-violet-50 p-4 text-left transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-100">
                    <RefreshCw className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">All sessions in series</p>
                    <p className="text-xs text-slate-400 mt-0.5">Update the title, type, squad, location and notes across every session. Each session keeps its own date and time.</p>
                  </div>
                </button>

                <button
                  onClick={() => setEditingEvent(null)}
                  className="mt-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                {/* ── Edit form ── */}
                {editScope === 'series' && (
                  <div className="mx-6 mt-4 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 flex items-start gap-2.5 shrink-0">
                    <RefreshCw className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-violet-700 font-medium leading-relaxed">
                      Editing all sessions — date &amp; time fields are hidden since each session keeps its own schedule.
                    </p>
                  </div>
                )}

                <div className="overflow-y-auto flex-1 px-6 py-4">
                  <form onSubmit={handleUpdate} className="space-y-3" id="edit-event-form">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
                      <input
                        required
                        value={editForm.title}
                        onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                        className={inputCls}
                        placeholder="Event name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                        <select
                          value={editForm.event_type}
                          onChange={e => setEditForm(p => ({ ...p, event_type: e.target.value }))}
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
                          value={editForm.squad_id}
                          onChange={e => setEditForm(p => ({ ...p, squad_id: e.target.value }))}
                          className={inputCls}
                        >
                          <option value="">All squads</option>
                          {squads.map(sq => (
                            <option key={sq.id} value={sq.id}>{sq.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Time fields — only for single-event edits */}
                    {editScope === 'one' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">Start</label>
                          <input
                            type="datetime-local"
                            required
                            value={editForm.start_time}
                            onChange={e => setEditForm(p => ({ ...p, start_time: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">End</label>
                          <input
                            type="datetime-local"
                            value={editForm.end_time}
                            onChange={e => setEditForm(p => ({ ...p, end_time: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Location</label>
                      <input
                        value={editForm.location}
                        onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                        className={inputCls}
                        placeholder="Venue or address"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                        rows={2}
                        className={inputCls}
                        placeholder="Optional notes..."
                      />
                    </div>
                  </form>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 flex gap-3">
                  {editingEvent.series_id && (
                    <button
                      type="button"
                      onClick={() => setEditScope('choose')}
                      className="h-12 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
                      title="Change scope"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-event-form"
                    disabled={editSaving}
                    className={`flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 min-h-[44px] transition-colors ${
                      editScope === 'series'
                        ? 'bg-violet-600 hover:bg-violet-500'
                        : 'bg-emerald-500 hover:bg-emerald-400'
                    }`}
                  >
                    {editSaving
                      ? 'Saving…'
                      : editScope === 'series'
                        ? 'Update all sessions'
                        : 'Save changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EventList({
  selectedEvents,
  isAdmin,
  rsvping,
  deletingId,
  onRsvp,
  onDelete,
  onCancelDelete,
  onEdit,
  mobile = false,
}) {
  if (selectedEvents.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p className="text-sm">No events this day</p>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      {selectedEvents.map(ev => {
        const meta       = tm(ev.event_type)
        const start      = new Date(ev.start_time)
        const end        = ev.end_time ? new Date(ev.end_time) : null
        const timeStart  = start.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
        const timeEnd    = end ? end.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : null
        const myStatus   = ev.my_rsvp_status
        const counts     = ev.rsvp_counts || { yes: 0, maybe: 0, no: 0 }
        const totalRsvp  = counts.yes + counts.maybe + counts.no
        const isDeleting = deletingId === ev.id

        // Days until event
        const today    = new Date(); today.setHours(0,0,0,0)
        const evDay    = new Date(start); evDay.setHours(0,0,0,0)
        const diffDays = Math.round((evDay - today) / 86400000)
        const daysLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : diffDays > 1 ? `In ${diffDays} days` : diffDays === -1 ? 'Yesterday' : `${Math.abs(diffDays)} days ago`
        const isPast   = diffDays < 0

        return (
          <div key={ev.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${isPast ? 'opacity-60' : ''}`}>
            {/* Coloured top stripe */}
            <div className={`h-1.5 w-full ${meta.pill}`} />

            <div className={`p-4 ${mobile ? 'px-5' : ''}`}>

              {/* Row 1: badges + admin actions */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${meta.badge}`}>
                    {meta.label}
                  </span>
                  {ev.squad_name && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5">
                      <Users className="h-2.5 w-2.5" />{ev.squad_name}
                    </span>
                  )}
                  {ev.series_id && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-200 rounded-full px-2 py-0.5">
                      <RefreshCw className="h-2.5 w-2.5" /> Series
                    </span>
                  )}
                </div>

                {/* Days-until chip */}
                <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 shrink-0 ${
                  diffDays === 0 ? 'bg-emerald-100 text-emerald-700' :
                  diffDays > 0  ? 'bg-slate-100 text-slate-500' :
                  'bg-slate-50 text-slate-400'}`}>
                  {daysLabel}
                </span>
              </div>

              {/* Row 2: title */}
              <h3 className="font-black text-slate-900 text-base leading-tight mb-2">{ev.title}</h3>

              {/* Row 3: time block */}
              <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 mb-3 ${meta.bg}`}>
                <Clock className={`h-4 w-4 shrink-0 ${meta.text}`} />
                <div>
                  <p className={`text-sm font-black ${meta.text}`}>{timeStart}{timeEnd ? ` — ${timeEnd}` : ''}</p>
                  {timeEnd && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {Math.round((end - start) / 60000)} min session
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: location + description */}
              {ev.location && (
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 font-medium">{ev.location}</p>
                </div>
              )}
              {ev.description && (
                <div className="flex items-start gap-2 mb-3">
                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">{ev.description}</p>
                </div>
              )}

              {/* Row 5: attendance */}
              {(isAdmin || totalRsvp > 0) && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Attendance</span>
                    <span className="text-[10px] text-slate-400">{counts.yes + counts.maybe} / {totalRsvp} responded</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">{counts.yes}</span>
                      <span className="text-[10px] text-slate-400">going</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-amber-500">{counts.maybe}</span>
                      <span className="text-[10px] text-slate-400">maybe</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-xs font-bold text-red-500">{counts.no}</span>
                      <span className="text-[10px] text-slate-400">no</span>
                    </div>
                  </div>
                  {totalRsvp > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                      {counts.yes   > 0 && <div className="bg-emerald-400 h-full transition-all" style={{ width: `${(counts.yes/totalRsvp)*100}%` }} />}
                      {counts.maybe > 0 && <div className="bg-amber-300 h-full transition-all"   style={{ width: `${(counts.maybe/totalRsvp)*100}%` }} />}
                      {counts.no    > 0 && <div className="bg-red-300 h-full transition-all"     style={{ width: `${(counts.no/totalRsvp)*100}%` }} />}
                    </div>
                  )}
                </div>
              )}

              {/* Row 6: RSVP (athletes/parents) OR admin actions */}
              {isAdmin ? (
                isDeleting ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                    {ev.series_id ? (
                      <>
                        <p className="text-xs font-bold text-red-600 mb-2">Delete which sessions?</p>
                        <div className="flex gap-2">
                          <button onClick={() => onDelete(ev.id, false)}
                            className="flex-1 rounded-lg bg-orange-500 text-white text-xs font-bold py-2 hover:bg-orange-600 transition-colors">
                            This only
                          </button>
                          <button onClick={() => onDelete(ev.id, true)}
                            className="flex-1 rounded-lg bg-red-500 text-white text-xs font-bold py-2 hover:bg-red-600 transition-colors">
                            All series
                          </button>
                          <button onClick={onCancelDelete}
                            className="flex-1 rounded-lg bg-white text-slate-600 text-xs font-bold py-2 border border-slate-200 hover:bg-slate-50 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-red-600 mb-2">Delete this event?</p>
                        <div className="flex gap-2">
                          <button onClick={() => onDelete(ev.id, false)}
                            className="flex-1 rounded-lg bg-red-500 text-white text-xs font-bold py-2 hover:bg-red-600 transition-colors">
                            Yes, delete
                          </button>
                          <button onClick={onCancelDelete}
                            className="flex-1 rounded-lg bg-white text-slate-600 text-xs font-bold py-2 border border-slate-200 hover:bg-slate-50 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => onEdit(ev)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors min-h-[40px]">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => onDelete(ev.id, false)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 py-2.5 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors min-h-[40px]">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )
              ) : (
                <div>
                  {myStatus && (
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-2 text-xs font-semibold ${
                      myStatus === 'yes'   ? 'bg-emerald-50 text-emerald-700' :
                      myStatus === 'maybe' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-600'}`}>
                      {myStatus === 'yes'   ? <CheckCircle2 className="h-4 w-4" /> :
                       myStatus === 'maybe' ? <HelpCircle   className="h-4 w-4" /> :
                                              <XCircle      className="h-4 w-4" />}
                      You said: <strong>{myStatus === 'yes' ? 'Going' : myStatus === 'maybe' ? 'Maybe' : "Can't make it"}</strong>
                      <span className="ml-auto text-[10px] opacity-60">Tap to change</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { status: 'yes',   label: '✓ Going',   activeCs: 'bg-emerald-500 text-white shadow-sm shadow-emerald-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                      { status: 'maybe', label: '? Maybe',   activeCs: 'bg-amber-400 text-white shadow-sm shadow-amber-200',   icon: <HelpCircle   className="h-3.5 w-3.5" /> },
                      { status: 'no',    label: '✗ No',      activeCs: 'bg-red-400 text-white shadow-sm shadow-red-200',       icon: <XCircle      className="h-3.5 w-3.5" /> },
                    ].map(({ status, label, activeCs }) => (
                      <button key={status}
                        disabled={rsvping[ev.id] != null}
                        onClick={() => onRsvp(ev.id, status)}
                        className={[
                          'rounded-xl py-2.5 text-xs font-bold transition-all disabled:opacity-50 min-h-[44px]',
                          myStatus === status ? activeCs : 'border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        {rsvping[ev.id] === status ? '…' : label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
