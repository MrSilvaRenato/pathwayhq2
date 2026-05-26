import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Layers, Calendar, Trophy, Award,
  BarChart3, Settings, LogOut, Zap, Shield, Dumbbell,
  Megaphone, HandHeart, Globe, X, UserPlus, CalendarDays, CreditCard, Building2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSidebar } from '../../contexts/SidebarContext'
import api from '../../lib/api'

const COACH_NAV = [
  { name: 'Dashboard',      href: '/dashboard',      icon: LayoutDashboard },
  { name: 'Join Requests',  href: '/join-requests',  icon: UserPlus,      badge: 'joinRequests' },
  { name: 'Athletes',       href: '/athletes',       icon: Users },
  { name: 'Squads',         href: '/squad',          icon: Layers,        badge: 'squadRequests' },
  { name: 'Seasons',        href: '/seasons',        icon: CalendarDays },
  { name: 'Calendar',       href: '/calendar',       icon: Calendar },
  { name: 'Announcements',  href: '/announcements',  icon: Megaphone },
  { name: 'Broadcast',      href: '/club-broadcast', icon: Zap },
  { name: 'Volunteering',   href: '/volunteering',   icon: HandHeart },
  { name: 'Milestones',     href: '/milestones',     icon: Trophy },
  { name: 'Trophy Cabinet', href: '/trophies',       icon: Award },
  { name: 'Analytics',      href: '/analytics',      icon: BarChart3 },
  { name: 'Settings',       href: '/settings',       icon: Settings },
]
const ADMIN_NAV    = COACH_NAV
const PARENT_NAV   = [
  { name: 'Dashboard',        href: '/dashboard',       icon: LayoutDashboard },
  { name: 'Browse Clubs',     href: '/clubs',           icon: Building2 },
  { name: 'My Registrations', href: '/my-registrations',icon: CreditCard },
  { name: 'Announcements',    href: '/announcements',   icon: Megaphone },
  { name: 'Calendar',         href: '/calendar',        icon: Calendar },
  { name: 'Milestones',       href: '/milestones',      icon: Trophy },
  { name: 'Volunteering',     href: '/volunteering',    icon: HandHeart },
  { name: 'Settings',         href: '/settings',        icon: Settings },
]
const ATHLETE_NAV  = [
  { name: 'My Dashboard',     href: '/dashboard',       icon: Dumbbell },
  { name: 'Browse Clubs',     href: '/clubs',           icon: Building2 },
  { name: 'My Registrations', href: '/my-registrations',icon: CreditCard },
  { name: 'Announcements',    href: '/announcements',   icon: Megaphone },
  { name: 'Calendar',         href: '/calendar',        icon: Calendar },
  { name: 'Milestones',       href: '/milestones',      icon: Trophy },
  { name: 'Volunteering',     href: '/volunteering',    icon: HandHeart },
  { name: 'Settings',         href: '/settings',        icon: Settings },
]
const SITE_ADMIN_NAV = [
  { name: 'Site Admin',    href: '/site-admin',    icon: Shield },
  { name: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { name: 'Settings',      href: '/settings',      icon: Settings },
]

function getNav(role) {
  if (role === 'site_admin') return SITE_ADMIN_NAV
  if (role === 'club_admin') return ADMIN_NAV
  if (role === 'parent')     return PARENT_NAV
  if (role === 'athlete')    return ATHLETE_NAV
  return COACH_NAV
}

function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { open, setOpen } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const nav = getNav(user?.role)
  const [squadRequestCount, setSquadRequestCount] = useState(0)
  const [joinRequestCount,  setJoinRequestCount]  = useState(0)

  useEffect(() => {
    if (user?.role !== 'club_admin' && user?.role !== 'coach') return
    api.get('/squad-requests').then(r => setSquadRequestCount(r.data?.length ?? 0)).catch(() => {})
    api.get('/club/join-requests').then(r => setJoinRequestCount((r.data ?? []).filter(x => x.status === 'pending').length)).catch(() => {})
  }, [user?.role, location.pathname])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">PathwayHQ</span>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const active = location.pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/site-admin' && location.pathname.startsWith(item.href))
          return (
            <Link key={item.name} to={item.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}>
              <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
              {item.name}
              {(() => {
                const count = item.badge === 'squadRequests' ? squadRequestCount
                            : item.badge === 'joinRequests'  ? joinRequestCount
                            : 0
                if (count > 0) return (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-white">
                    {count}
                  </span>
                )
                if (active) return <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
                return null
              })()}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-2">
        <Link to="/" target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <Globe className="h-3.5 w-3.5" /> View public site
        </Link>
      </div>

      <div className="border-t border-slate-200 p-3 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            {initials(user?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
          <LogOut className="h-4 w-4 text-slate-400" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-60 flex-col border-r border-slate-200 bg-white shrink-0">
        {content}
      </aside>

      {/* Mobile overlay — triggered by Topbar or BottomNav More tab */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-white shadow-xl lg:hidden">{content}</aside>
        </>
      )}
    </>
  )
}
