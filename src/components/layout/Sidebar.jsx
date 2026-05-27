import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Layers, Calendar, Trophy, Award,
  BarChart3, Settings, LogOut, Zap, Shield, Dumbbell,
  Megaphone, HandHeart, Globe, X, UserPlus, CalendarDays,
  CreditCard, Building2, Bell,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSidebar } from '../../contexts/SidebarContext'
import api from '../../lib/api'

// Nav definitions — grouped by category
// Settings lives in the bottom user section, not here

const COACH_NAV = [
  {
    group: null,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'My Club',
    items: [
      { name: 'Athletes',      href: '/athletes',      icon: Users },
      { name: 'Squads',        href: '/squad',         icon: Layers,   badge: 'squadRequests' },
      { name: 'Join Requests', href: '/join-requests', icon: UserPlus, badge: 'joinRequests' },
      { name: 'Search Clubs',  href: '/clubs',         icon: Building2 },
    ],
  },
  {
    group: 'Schedule',
    items: [
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      { name: 'Seasons',  href: '/seasons',  icon: CalendarDays },
    ],
  },
  {
    group: 'Communicate',
    items: [
      { name: 'Announcements', href: '/announcements',  icon: Megaphone },
      { name: 'Broadcast',     href: '/club-broadcast', icon: Bell },
    ],
  },
  {
    group: 'Achievements',
    items: [
      { name: 'Milestones',     href: '/milestones', icon: Trophy },
      { name: 'Trophy Cabinet', href: '/trophies',   icon: Award },
    ],
  },
  {
    group: 'Insights',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
]

const ADMIN_NAV = COACH_NAV

const ATHLETE_NAV = [
  {
    group: null,
    items: [
      { name: 'My Dashboard', href: '/dashboard', icon: Dumbbell },
    ],
  },
  {
    group: 'My Club',
    items: [
      { name: 'Browse Clubs',     href: '/clubs',            icon: Building2 },
      { name: 'My Registrations', href: '/my-registrations', icon: CreditCard },
    ],
  },
  {
    group: 'Activity',
    items: [
      { name: 'Announcements', href: '/announcements', icon: Megaphone },
      { name: 'Calendar',      href: '/calendar',      icon: Calendar },
    ],
  },
  {
    group: 'Achievements',
    items: [
      { name: 'Milestones', href: '/milestones', icon: Trophy },
    ],
  },
  {
    group: 'Community',
    items: [
      { name: 'Volunteering', href: '/volunteering', icon: HandHeart },
    ],
  },
]

const PARENT_NAV = [
  {
    group: null,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'My Club',
    items: [
      { name: 'Browse Clubs',     href: '/clubs',            icon: Building2 },
      { name: 'My Registrations', href: '/my-registrations', icon: CreditCard },
    ],
  },
  {
    group: 'Activity',
    items: [
      { name: 'Announcements', href: '/announcements', icon: Megaphone },
      { name: 'Calendar',      href: '/calendar',      icon: Calendar },
    ],
  },
  {
    group: 'Achievements',
    items: [
      { name: 'Milestones', href: '/milestones', icon: Trophy },
    ],
  },
  {
    group: 'Community',
    items: [
      { name: 'Volunteering', href: '/volunteering', icon: HandHeart },
    ],
  },
]

const SITE_ADMIN_NAV = [
  {
    group: 'Platform',
    items: [
      { name: 'Site Admin', href: '/site-admin', icon: Shield },
    ],
  },
  {
    group: 'Personal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
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

function roleLabel(role = '') {
  const map = {
    site_admin: 'Site Admin',
    club_admin:  'Club Admin',
    coach:       'Coach',
    athlete:     'Athlete',
    parent:      'Parent / Guardian',
  }
  return map[role] ?? role
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { open, setOpen } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const groups = getNav(user?.role)

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

  function getBadgeCount(badge) {
    if (badge === 'squadRequests') return squadRequestCount
    if (badge === 'joinRequests')  return joinRequestCount
    return 0
  }

  const content = (
    <div className="flex h-full flex-col bg-white">

      {/* ── Logo header ── */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 shadow-sm shadow-emerald-500/30">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-black text-slate-900 tracking-tight">PathwayHQ</span>
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.group && (
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = location.pathname === item.href ||
                  (item.href !== '/dashboard' && item.href !== '/site-admin' && location.pathname.startsWith(item.href))
                const badgeCount = getBadgeCount(item.badge)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {badgeCount > 0 ? (
                      <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                        active ? 'bg-white/30 text-white' : 'bg-amber-400 text-white'
                      }`}>
                        {badgeCount}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Public site link ── */}
      <div className="px-3 pb-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          View public site
        </a>
      </div>

      {/* ── User section ── */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-1">
        {/* User card */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 ring-2 ring-white">
            {initials(user?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{roleLabel(user?.role)}</p>
          </div>
        </div>
        {/* Settings */}
        <Link
          to="/settings"
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            location.pathname === '/settings'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className={`h-4 w-4 shrink-0 ${location.pathname === '/settings' ? 'text-white' : 'text-slate-400'}`} />
          Settings
        </Link>
        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-slate-100 bg-white shrink-0">
        {content}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl lg:hidden flex flex-col">
            {content}
          </aside>
        </>
      )}
    </>
  )
}
