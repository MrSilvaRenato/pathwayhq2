import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Trophy, HandHeart,
  Settings, Users, MoreHorizontal,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSidebar } from '../../contexts/SidebarContext'

const COACH_TABS = [
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Athletes',    href: '/athletes',    icon: Users },
  { label: 'Calendar',    href: '/calendar',    icon: Calendar },
  { label: 'Milestones',  href: '/milestones',  icon: Trophy },
  { label: 'More',        href: null,           icon: MoreHorizontal },
]

const ATHLETE_TABS = [
  { label: 'Dashboard',    href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Calendar',     href: '/calendar',    icon: Calendar },
  { label: 'Milestones',   href: '/milestones',  icon: Trophy },
  { label: 'Volunteering', href: '/volunteering', icon: HandHeart },
  { label: 'Settings',     href: '/settings',    icon: Settings },
]

const PARENT_TABS = [
  { label: 'Dashboard',    href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Calendar',     href: '/calendar',    icon: Calendar },
  { label: 'Milestones',   href: '/milestones',  icon: Trophy },
  { label: 'Volunteering', href: '/volunteering', icon: HandHeart },
  { label: 'Settings',     href: '/settings',    icon: Settings },
]

function getTabs(role) {
  if (role === 'athlete') return ATHLETE_TABS
  if (role === 'parent') return PARENT_TABS
  return COACH_TABS
}

export default function BottomNav() {
  const { user } = useAuth()
  const { setOpen } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const tabs = getTabs(user?.role)

  function isActive(tab) {
    if (!tab.href) return false
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
      className="flex lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      <div className="flex w-full h-16">
        {tabs.map(tab => {
          const active = isActive(tab)
          const Icon = tab.icon
          return (
            <button
              key={tab.label}
              onClick={() => handleTab(tab)}
              className="flex flex-col flex-1 items-center justify-center gap-0.5 min-h-[44px] relative"
              aria-label={tab.label}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-500" />
              )}
              <Icon
                style={{ width: 28, height: 28 }}
                className={active ? 'text-emerald-600' : 'text-slate-400'}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] font-medium leading-none ${
                  active ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
