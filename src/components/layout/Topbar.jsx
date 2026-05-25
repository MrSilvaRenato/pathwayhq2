import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ChevronRight, Bell, Menu } from 'lucide-react'
import api from '../../lib/api'
import { useSidebar } from '../../contexts/SidebarContext'

const LABELS = {
  dashboard: 'Dashboard', athletes: 'Athletes', squad: 'Squads',
  calendar: 'Calendar', announcements: 'Announcements', volunteering: 'Volunteering',
  milestones: 'Milestones', analytics: 'Analytics', settings: 'Settings',
  athlete: 'My Dashboard', parent: 'My Child', 'site-admin': 'Site Admin',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { setOpen: setSidebarOpen } = useSidebar()
  const segments = pathname.split('/').filter(Boolean)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const unread = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {})
  }, [pathname])

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function markRead(id, link) {
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
    api.put(`/notifications/${id}/read`).catch(() => {})
    setOpen(false)
    if (link) navigate(link)
  }

  async function markAllRead() {
    setNotifications(p => p.map(n => ({ ...n, is_read: true })))
    await api.put('/notifications/read-all')
  }

  async function clearAll() {
    setNotifications([])
    setOpen(false)
    await api.delete('/notifications').catch(() => {})
  }

  const crumbs = segments.map((seg, i) => {
    const href  = '/' + segments.slice(0, i + 1).join('/')
    const isId  = /^[0-9a-f-]{20,}$/i.test(seg)
    const label = isId ? 'Detail' : (LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1))
    return { label, href }
  })

  const pageTitle = crumbs.length > 0 ? crumbs[crumbs.length - 1].label : 'PathwayHQ'

  return (
    <div className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-slate-100 bg-white/95 backdrop-blur-sm px-3 lg:px-6">
      {/* Mobile menu button — opens sidebar overlay */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb — hidden on mobile, replaced by page title */}
      <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0 flex-1">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i < crumbs.length - 1 ? (
              <>
                <Link to={crumb.href} className="text-slate-400 hover:text-slate-700 transition-colors shrink-0">
                  {crumb.label}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
              </>
            ) : (
              <span className="font-semibold text-slate-800 truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Mobile page title — centered */}
      <span className="sm:hidden flex-1 text-center text-sm font-semibold text-slate-800 truncate">
        {pageTitle}
      </span>

      {/* Notifications bell */}
      <div className="relative shrink-0" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-10 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-fade-in z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-emerald-600 hover:text-emerald-500 font-semibold transition-colors">
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors">
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id, n.link)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 transition-colors ${n.link ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'} ${!n.is_read ? 'bg-emerald-50/50' : ''}`}>
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-emerald-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
