import { useLocation, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const LABELS = {
  dashboard: 'Dashboard', athletes: 'Athletes', squad: 'Squads',
  calendar: 'Calendar', announcements: 'Announcements', volunteering: 'Volunteering',
  milestones: 'Milestones', analytics: 'Analytics', settings: 'Settings',
  athlete: 'My Dashboard', parent: 'My Child', 'site-admin': 'Site Admin',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const isId = /^[0-9a-f-]{20,}$/i.test(seg)
    const label = isId ? 'Detail' : (LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1))
    return { label, href }
  })

  return (
    <div className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-slate-100 bg-white/95 backdrop-blur-sm px-4 lg:px-6">
      <nav className="flex items-center gap-1 text-sm min-w-0 flex-1">
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
    </div>
  )
}
