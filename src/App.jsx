import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import OpenInAppBanner from './components/OpenInAppBanner'

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
import AthleteDetail      from './pages/app/AthleteDetail'
import AthleteProfileView from './pages/app/AthleteProfileView'
import Squads        from './pages/app/Squads'
import Calendar      from './pages/app/Calendar'
import Announcements from './pages/app/Announcements'
import Volunteering  from './pages/app/Volunteering'
import Milestones    from './pages/app/Milestones'
import ClubTrophies  from './pages/app/ClubTrophies'
import Analytics     from './pages/app/Analytics'
import Settings      from './pages/app/Settings'
import SiteAdmin     from './pages/app/SiteAdmin'
import ClaimProfile          from './pages/ClaimProfile'
import ResetPassword         from './pages/ResetPassword'
import SubscriptionSuccess   from './pages/SubscriptionSuccess'
import SubscriptionCancel    from './pages/SubscriptionCancel'
import Pricing               from './pages/marketing/Pricing'
import JoinRequests     from './pages/app/JoinRequests'
import Seasons          from './pages/app/Seasons'
import MyRegistrations  from './pages/app/MyRegistrations'
import ClubBroadcast    from './pages/app/ClubBroadcast'

const SPINNER = <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return SPINNER
  if (!user) return <Navigate to="/?modal=login" replace />
  return children
}

function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return SPINNER
  if (!user) return <Navigate to="/?modal=login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />
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
        <OpenInAppBanner />
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
          <Route path="/claim/:token"          element={<ClaimProfile />} />
          <Route path="/reset-password"        element={<ResetPassword />} />
          <Route path="/pricing"               element={<Pricing />} />
          <Route path="/subscription/success"  element={<SubscriptionSuccess />} />
          <Route path="/subscription/cancel"   element={<SubscriptionCancel />} />

          {/* App */}
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            {/* All authenticated users */}
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="settings"     element={<Settings />} />
            <Route path="volunteering" element={<Volunteering />} />
            <Route path="milestones"   element={<Milestones />} />
            <Route path="trophies"     element={<ClubTrophies />} />
            <Route path="announcements" element={<Announcements />} />

            {/* Club managers and coaches only */}
            <Route path="athletes"     element={<RoleRoute roles={['club_admin','coach','site_admin']}><Athletes /></RoleRoute>} />
            <Route path="athletes/:id"         element={<RoleRoute roles={['club_admin','coach','site_admin']}><AthleteDetail /></RoleRoute>} />
            <Route path="athletes/:id/profile" element={<RoleRoute roles={['club_admin','coach','site_admin']}><AthleteProfileView /></RoleRoute>} />
            <Route path="squad"        element={<RoleRoute roles={['club_admin','coach','site_admin']}><Squads /></RoleRoute>} />
            <Route path="calendar"     element={<Calendar />} />
            <Route path="analytics"    element={<RoleRoute roles={['club_admin','coach','site_admin']}><Analytics /></RoleRoute>} />
            <Route path="join-requests"  element={<RoleRoute roles={['club_admin','coach','site_admin']}><JoinRequests /></RoleRoute>} />
            <Route path="seasons"        element={<RoleRoute roles={['club_admin','coach','site_admin']}><Seasons /></RoleRoute>} />
            <Route path="club-broadcast" element={<RoleRoute roles={['club_admin','site_admin']}><ClubBroadcast /></RoleRoute>} />

            {/* Athletes and parents only */}
            <Route path="my-registrations" element={<RoleRoute roles={['athlete','parent']}><MyRegistrations /></RoleRoute>} />

            {/* Site admin only */}
            <Route path="site-admin" element={<RoleRoute roles={['site_admin']}><SiteAdmin /></RoleRoute>} />
          </Route>

          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  )
}
