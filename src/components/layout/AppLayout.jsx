import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import { SidebarProvider } from '../../contexts/SidebarContext'
import { useAuth } from '../../contexts/AuthContext'

function ImpersonationBanner() {
  const { user, isImpersonating, stopImpersonating } = useAuth()
  if (!isImpersonating) return null

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900 z-50 shrink-0">
      <span>👁 Impersonating <strong>{user?.full_name ?? user?.email}</strong> ({user?.role})</span>
      <button
        onClick={stopImpersonating}
        className="rounded-lg bg-amber-900/20 hover:bg-amber-900/30 px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap"
      >
        Stop impersonating
      </button>
    </div>
  )
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <ImpersonationBanner />
          <Topbar />
          <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  )
}
