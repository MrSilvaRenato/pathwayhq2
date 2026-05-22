import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'

// Marketing
import Home           from './pages/marketing/Home'
import Clubs          from './pages/marketing/Clubs'
import ClubProfile    from './pages/marketing/ClubProfile'
import AthleteProfile from './pages/marketing/AthleteProfile'
import Brisbane       from './pages/marketing/Brisbane2032'

// App layout + pages
import AppLayout     from './components/layout/AppLayout'
import Dashboard     from './pages/app/Dashboard'
import Athletes      from './pages/app/Athletes'
import AthleteDetail from './pages/app/AthleteDetail'
import Squads        from './pages/app/Squads'
import Calendar      from './pages/app/Calendar'
import Announcements from './pages/app/Announcements'
import Volunteering  from './pages/app/Volunteering'
import Milestones    from './pages/app/Milestones'
import ClubTrophies  from './pages/app/ClubTrophies'
import Analytics     from './pages/app/Analytics'
import Settings      from './pages/app/Settings'
import SiteAdmin     from './pages/app/SiteAdmin'
import ClaimProfile  from './pages/ClaimProfile'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>
  if (!user) return <Navigate to="/?modal=login" replace />
  return children
}

function SmartRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? '/dashboard' : '/'} replace />
}

export default function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Marketing */}
          <Route path="/"              element={<Home />} />
          <Route path="/clubs"            element={<Clubs />} />
          <Route path="/club/:slug"      element={<ClubProfile />} />
          <Route path="/athlete/:slug"   element={<AthleteProfile />} />
          <Route path="/brisbane-2032"   element={<Brisbane />} />

          {/* Auth — redirect old URLs to home modal */}
          <Route path="/login"  element={<Navigate to="/?modal=login"  replace />} />
          <Route path="/signup" element={<Navigate to="/?modal=signup" replace />} />
          <Route path="/claim/:token" element={<ClaimProfile />} />

          {/* App */}
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="dashboard"     element={<Dashboard />} />
            <Route path="athletes"      element={<Athletes />} />
            <Route path="athletes/:id"  element={<AthleteDetail />} />
            <Route path="squad"         element={<Squads />} />
            <Route path="calendar"      element={<Calendar />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="volunteering"  element={<Volunteering />} />
            <Route path="milestones"    element={<Milestones />} />
            <Route path="trophies"      element={<ClubTrophies />} />
            <Route path="analytics"     element={<Analytics />} />
            <Route path="settings"      element={<Settings />} />
            <Route path="site-admin"    element={<SiteAdmin />} />
          </Route>

          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  )
}
