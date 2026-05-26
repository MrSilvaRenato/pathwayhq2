import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Trophy, HandHeart,
  Dumbbell, Users, MoreHorizontal, Shield, Settings,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSidebar } from '../../contexts/SidebarContext'

// Only the most-used 4 destinations + More (which opens the full sidebar)
const COACH_TABS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Athletes',  href: '/athletes',  icon: Users },
  { label: 'Calendar',  href: '/calendar',  icon: Calendar },
  { label: 'Awards',    href: '/milestones', icon: Trophy },
  { label: 'More',      href: null,          icon: MoreHorizontal },
]

const ATHLETE_TABS = [
  { label: 'Dashboard',  href: '/dashboard',   icon: Dumbbell },
  { label: 'Calendar',   href: '/calendar',    icon: Calendar },
  { label: 'Milestones', href: '/milestones',  icon: Trophy },
  { label: 'Volunteer',  href: '/volunteering', icon: HandHeart },
  { label: 'Settings',   href: '/settings',    icon: Settings },
]

const PARENT_TABS = [
  { label: 'Dashboard',  href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Calendar',   href: '/calendar',    icon: Calendar },
  { label: 'Milestones', href: '/milestones',  icon: Trophy },
  { label: 'Volunteer',  href: '/volunteering', icon: HandHeart },
  { label: 'Settings',   href: '/settings',    icon: Settings },
]

const SITE_ADMIN_TABS = [
  { label: 'Admin',     href: '/site-admin', icon: Shield },
  { label: 'Dashboard', href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Settings',  href: '/settings',   icon: Settings },
]

function getTabs(role) {
  if (role === 'athlete')    return ATHLETE_TABS
  if (role === 'parent')     return PARENT_TABS
  if (role === 'site_admin') return SITE_ADMIN_TABS
  return COACH_TABS
}

export default function BottomNav() {
  const { user }      = useAuth()
  const { setOpen }   = useSidebar()
  const location      = useLocation()
  const navigate      = useNavigate()
  const tabs          = getTabs(user?.role)

  function isTabActive(tab) {
    if (!tab.href) {
      // "More" is active when current path isn't covered by any named tab
      return tabs.filter(t => t.href).every(t => !isPathActive(t))
    }
    return isPathActive(tab)
  }

  function isPathActive(tab) {
    if (tab.href === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(tab.href)
  }

  function handleTab(tab) {
    if (!tab.href) {
      setOpen(true)
    } else {
      navigate(tab.href)
    }
  }

  return (
    <nav
      className="flex lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      <div className="flex w-full h-16">
        {tabs.map(tab => {
          const active = isTabActive(tab)
          const Icon   = tab.icon
          return (
            <button
              key={tab.label}
              onClick={() => handleTab(tab)}
              className="flex flex-col flex-1 items-center justify-center gap-1 relative min-h-[44px]"
              aria-label={tab.label}
            >
              {/* Active pill indicator */}
              {active && (
                <span className="absolute top-0 inset-x-2 h-0.5 rounded-full bg-emerald-500" />
              )}
              <Icon
                className={`transition-colors ${active ? 'text-emerald-600' : 'text-slate-400'}`}
                style={{ width: 24, height: 24 }}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] leading-none font-semibold transition-colors ${
                active ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
