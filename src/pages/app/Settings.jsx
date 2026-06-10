import { useState, useEffect } from 'react'
import { Save, ExternalLink, Eye, EyeOff, Phone, Globe, Instagram, Facebook, Twitter, Image, Lock, Unlock, Users, Trophy, Calendar, Megaphone, Zap, CreditCard, Building2, ArrowUpRight, CheckCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { SPORTS, STATES, SUBSCRIPTION_TIERS } from '../../lib/constants'
import ImageUpload from '../../components/ImageUpload'

// ── Avatar initials circle ────────────────────────────────────────────────────
function AvatarCircle({ name, role, imageUrl }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  const roleLabel = {
    admin:      { label: 'Admin',   cls: 'bg-purple-100 text-purple-700' },
    club_admin: { label: 'Manager', cls: 'bg-violet-100 text-violet-700' },
    coach:      { label: 'Coach',   cls: 'bg-blue-100 text-blue-700' },
    athlete:    { label: 'Athlete', cls: 'bg-emerald-100 text-emerald-700' },
    parent:     { label: 'Parent',  cls: 'bg-amber-100 text-amber-700' },
  }[role] ?? { label: role ?? 'Member', cls: 'bg-slate-100 text-slate-600' }

  return (
    <div className="flex flex-col items-center py-6 border-b border-slate-100 mb-6">
      {imageUrl ? (
        <img src={imageUrl} alt={name}
          className="h-20 w-20 rounded-full object-cover shadow-lg mb-3 border-2 border-slate-100" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white text-2xl font-black shadow-lg shadow-emerald-500/20 mb-3">
          {initials}
        </div>
      )}
      <p className="font-bold text-slate-900 text-base">{name || 'Your account'}</p>
      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${roleLabel.cls}`}>
        {roleLabel.label}
      </span>
    </div>
  )
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden mb-4">
      <div className="px-4 md:px-6 pt-5 pb-1">
        <h2 className="font-bold text-slate-900 text-base">{title}</h2>
      </div>
      <div className="px-4 md:px-6 pb-5">
        {children}
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, isAdmin, refreshUser } = useAuth()
  const toast = useToast()

  const [searchParams] = useSearchParams()

  const [profile,  setProfile]  = useState({ full_name: '', email: '', phone: '', password: '' })
  const [club,     setClub]     = useState(null)
  const [clubForm, setClubForm] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingClub,    setSavingClub]    = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [athleteProfile, setAthleteProfile] = useState(null)
  const [savingAthlete,  setSavingAthlete]  = useState(false)
  const [planInfo,  setPlanInfo]  = useState(null)
  const [connectStatus, setConnectStatus] = useState(null)
  const [loadingCheckout, setLoadingCheckout] = useState(null)
  const [loadingPortal,   setLoadingPortal]   = useState(false)
  const [loadingConnect,  setLoadingConnect]  = useState(false)
  const [loadingConnectLogin, setLoadingConnectLogin] = useState(false)
  const [leavingClub,  setLeavingClub]  = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  useEffect(() => {
    // Handle connect callback params
    const connect = searchParams.get('connect')
    if (connect === 'success') toast.success('Bank account connected successfully!')
    if (connect === 'refresh') toast.error('Connection expired — please try again.')

    if (user?.role === 'athlete') {
      api.get('/athletes/me').then(r => setAthleteProfile(r.data)).catch(() => {})
    }
    api.get('/club/plan').then(r => setPlanInfo(r.data)).catch(() => {})
    api.get('/connect/status').then(r => setConnectStatus(r.data)).catch(() => {})
    api.get('/profile').then(r => {
      const d = r.data
      setProfile({ full_name: d.full_name ?? '', email: d.email ?? '', phone: d.phone ?? '', password: '' })
      if (d.club_id) {
        setClub(d)
        setClubForm({
          name:                d.club_name        ?? '',
          city:                d.city             ?? '',
          state:               d.state            ?? 'QLD',
          sport:               d.sport            ?? 'soccer',
          slug:                d.slug             ?? '',
          description:         d.description      ?? '',
          website:             d.website          ?? '',
          contact_email:       d.contact_email    ?? '',
          phone:               d.phone            ?? '',
          is_public:           d.is_public        ?? false,
          cover_image_url:     d.cover_image_url  ?? '',
          logo_url:            d.logo_url         ?? '',
          founded_year:        d.founded_year     ?? '',
          social_facebook:     d.social_facebook  ?? '',
          social_instagram:    d.social_instagram ?? '',
          social_twitter:      d.social_twitter   ?? '',
          show_milestones:     d.show_milestones     ?? true,
          show_athletes_count: d.show_athletes_count ?? true,
          show_events:         d.show_events         ?? false,
          show_announcements:  d.show_announcements  ?? false,
        })
      }
    }).catch(() => toast.error('Failed to load profile'))
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await api.put('/profile', profile)
      // If email changed the backend issues a fresh token — store it and refresh auth state
      if (data.token) {
        localStorage.setItem('phq_token', data.token)
        await refreshUser()
      }
      setProfile(p => ({ ...p, password: '' }))
      toast.success('Profile saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveClub(e) {
    e.preventDefault()
    setSavingClub(true)
    try {
      await api.put('/club', clubForm)
      toast.success('Club details saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save club details')
    } finally {
      setSavingClub(false)
    }
  }

  async function saveAthleteProfile(patch) {
    setSavingAthlete(true)
    try {
      await api.put('/athletes/me', patch)
      setAthleteProfile(p => ({ ...p, ...patch }))
      toast.success('Athlete profile saved')
    } catch {
      toast.error('Failed to save athlete profile')
    } finally {
      setSavingAthlete(false)
    }
  }

  async function handleUpgrade(plan) {
    setLoadingCheckout(plan)
    try {
      const { data } = await api.post('/subscription/checkout', { plan })
      window.location.href = data.url
    } catch { setLoadingCheckout(null) }
  }

  async function handlePortal() {
    setLoadingPortal(true)
    try {
      const { data } = await api.post('/subscription/portal')
      window.location.href = data.url
    } catch { setLoadingPortal(false) }
  }

  async function handleLeaveClub() {
    setLeavingClub(true)
    try {
      await api.delete('/athletes/me/leave')
      setAthleteProfile(null)
      setConfirmLeave(false)
      toast.success('You have left the club. Your history is preserved.')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not leave club.')
    } finally {
      setLeavingClub(false)
    }
  }

  async function handleConnectOnboard() {
    setLoadingConnect(true)
    try {
      const { data } = await api.post('/connect/onboard')
      window.location.href = data.url
    } catch { setLoadingConnect(false) }
  }

  async function handleConnectLogin() {
    setLoadingConnectLogin(true)
    try {
      const { data } = await api.post('/connect/login-link')
      window.open(data.url, '_blank')
    } catch { toast.error('Could not open dashboard.') }
    finally { setLoadingConnectLogin(false) }
  }

  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all min-h-[48px]"
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"

  return (
    <div className="px-4 py-4 md:p-6 lg:p-8 max-w-2xl mx-auto pb-28 md:pb-8">
      <h1 className="text-2xl font-black text-slate-900 mb-5">Settings</h1>

      {/* Avatar + name + role badge */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm mb-4">
        <AvatarCircle name={profile.full_name || user?.full_name} role={user?.role} imageUrl={athleteProfile?.avatar_url} />
      </div>

      {/* ── Athlete profile photo ────────────────────────────────── */}
      {user?.role === 'athlete' && athleteProfile !== undefined && (
        <SectionCard title="Athlete Profile Photo">
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Your photo is shown to your club manager, coaches, and on your public profile if enabled.
            </p>
            <div className="flex items-start gap-5">
              {/* Current avatar preview */}
              <div className="shrink-0">
                {athleteProfile?.avatar_url ? (
                  <img src={athleteProfile.avatar_url} alt="Your photo"
                    className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 shadow" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-emerald-100 border-2 border-slate-200 flex items-center justify-center text-2xl font-black text-emerald-600">
                    {athleteProfile ? `${athleteProfile.first_name?.[0] ?? ''}${athleteProfile.last_name?.[0] ?? ''}`.toUpperCase() : '?'}
                  </div>
                )}
              </div>
              {/* Upload control */}
              <div className="flex-1 min-w-0">
                <ImageUpload
                  value={athleteProfile?.avatar_url || null}
                  onChange={url => saveAthleteProfile({ avatar_url: url ?? '' })}
                  type="avatar"
                  aspectHint="Square photo recommended"
                  previewClass="max-h-40 w-auto rounded-full mx-auto"
                />
                {savingAthlete && <p className="text-xs text-slate-400 mt-1">Saving…</p>}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Athlete public profile visibility ────────────────────── */}
      {user?.role === 'athlete' && athleteProfile !== undefined && (
        <SectionCard title="Public Profile">
          <div className="mt-4 space-y-3">
            <div className={`rounded-xl p-4 ${athleteProfile?.is_public ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {athleteProfile?.is_public
                    ? <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
                    : <Lock  className="h-4 w-4 text-slate-400 shrink-0" />}
                  <div>
                    <p className={`text-sm font-bold ${athleteProfile?.is_public ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {athleteProfile?.is_public ? 'Profile is public' : 'Profile is private'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {athleteProfile?.is_public
                        ? 'Anyone with the link can view your profile page.'
                        : 'Only your club managers and coaches can see your details.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => saveAthleteProfile({ is_public: !athleteProfile?.is_public })}
                  disabled={savingAthlete}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${athleteProfile?.is_public ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${athleteProfile?.is_public ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {athleteProfile?.is_public && athleteProfile?.slug && (
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 font-mono">
                  {window.location.origin}/athlete/{athleteProfile.slug}
                </span>
                <a
                  href={`/athlete/${athleteProfile.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View
                </a>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              This is your choice. Club managers can view your details internally regardless of this setting, but cannot make your public profile visible without your consent.
            </p>
          </div>
        </SectionCard>
      )}

      {/* ── Profile section ───────────────────────────────────────── */}
      <SectionCard title="Profile">
        <form onSubmit={saveProfile} className="space-y-4 mt-4">
          <div>
            <label className={labelCls}>Full name</label>
            <input
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className={inputCls}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className={labelCls}>Email address</label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className={inputCls}
              placeholder="you@example.com"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">This is your login email. Changing it takes effect immediately.</p>
          </div>
          <div>
            <label className={labelCls}>
              Mobile phone
              <span className="normal-case font-normal text-slate-400 ml-1">— visible to coaches &amp; admins</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                className={inputCls + ' pl-10'}
                placeholder="+61 4xx xxx xxx"
              />
            </div>
          </div>

          {/* ── Security sub-section ──────────────────────────────── */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Security</p>
            <div>
              <label className={labelCls}>
                New password{' '}
                <span className="normal-case font-normal text-slate-400">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={profile.password}
                  onChange={e => setProfile(p => ({ ...p, password: e.target.value }))}
                  className={inputCls + ' pr-12'}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Save button — sticky on mobile, floats above the bottom nav bar */}
          <div className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-slate-100 py-3 px-4 md:static md:border-0 md:p-0 md:bg-transparent md:z-auto md:bottom-auto">
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 px-6 py-3 text-sm font-bold text-white transition-all shadow-sm shadow-emerald-500/20 min-h-[48px]">
              <Save className="h-4 w-4" />
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Club details section ──────────────────────────────────── */}
      {club && isAdmin && (
        <SectionCard title="Club details">
          <form onSubmit={saveClub} className="space-y-4 mt-4">

            {/* Basic info */}
            <div>
              <label className={labelCls}>Club name</label>
              <input required value={clubForm.name}
                onChange={e => setClubForm(p => ({ ...p, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input value={clubForm.city}
                  onChange={e => setClubForm(p => ({ ...p, city: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select value={clubForm.state}
                  onChange={e => setClubForm(p => ({ ...p, state: e.target.value }))}
                  className={inputCls + ' cursor-pointer'}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Primary sport</label>
                <select value={clubForm.sport}
                  onChange={e => setClubForm(p => ({ ...p, sport: e.target.value }))}
                  className={inputCls + ' cursor-pointer'}>
                  {SPORTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Founded year</label>
                <input type="number" min="1800" max="2100"
                  value={clubForm.founded_year}
                  onChange={e => setClubForm(p => ({ ...p, founded_year: e.target.value }))}
                  className={inputCls} placeholder="e.g. 1998" />
              </div>
            </div>
            <div>
              <label className={labelCls}>About the club</label>
              <textarea value={clubForm.description}
                onChange={e => setClubForm(p => ({ ...p, description: e.target.value }))}
                rows={3} className={inputCls + ' resize-none h-auto min-h-0'}
                placeholder="Tell people about your club, your mission, and your values…" />
            </div>

            {/* Branding */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Branding</p>
              <div className="space-y-4">
                <ImageUpload
                  label="Club logo"
                  aspectHint="Square image recommended"
                  type="logo"
                  value={clubForm.logo_url || null}
                  onChange={url => setClubForm(p => ({ ...p, logo_url: url ?? '' }))}
                  previewClass="h-32 w-32 rounded-2xl object-cover"
                />
                <ImageUpload
                  label="Cover / banner image"
                  aspectHint="16:9 recommended"
                  type="cover"
                  value={clubForm.cover_image_url || null}
                  onChange={url => setClubForm(p => ({ ...p, cover_image_url: url ?? '' }))}
                  previewClass="h-36"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Contact &amp; links</p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Website</label>
                    <input value={clubForm.website}
                      onChange={e => setClubForm(p => ({ ...p, website: e.target.value }))}
                      className={inputCls} placeholder="https://" />
                  </div>
                  <div>
                    <label className={labelCls}>Contact email</label>
                    <input type="email" value={clubForm.contact_email}
                      onChange={e => setClubForm(p => ({ ...p, contact_email: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" value={clubForm.phone}
                    onChange={e => setClubForm(p => ({ ...p, phone: e.target.value }))}
                    className={inputCls} placeholder="+61 7 xxxx xxxx" />
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Social media</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500 shrink-0" />
                  <input value={clubForm.social_instagram}
                    onChange={e => setClubForm(p => ({ ...p, social_instagram: e.target.value }))}
                    className={inputCls} placeholder="https://instagram.com/yourclub" />
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600 shrink-0" />
                  <input value={clubForm.social_facebook}
                    onChange={e => setClubForm(p => ({ ...p, social_facebook: e.target.value }))}
                    className={inputCls} placeholder="https://facebook.com/yourclub" />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-sky-500 shrink-0" />
                  <input value={clubForm.social_twitter}
                    onChange={e => setClubForm(p => ({ ...p, social_twitter: e.target.value }))}
                    className={inputCls} placeholder="https://x.com/yourclub" />
                </div>
              </div>
            </div>

            {/* Privacy & visibility */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Public profile visibility</p>
              <p className="text-xs text-slate-400 mb-4">Choose what visitors can see on your public club page.</p>

              {/* Master toggle */}
              <div className={`rounded-xl p-4 mb-3 ${clubForm.is_public ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative shrink-0" onClick={() => setClubForm(p => ({ ...p, is_public: !p.is_public }))}>
                    <div className={`w-11 h-6 rounded-full transition-colors ${clubForm.is_public ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${clubForm.is_public ? 'translate-x-5' : ''}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {clubForm.is_public ? <><Unlock className="h-3.5 w-3.5 text-emerald-500" /> Profile is public</> : <><Lock className="h-3.5 w-3.5 text-slate-400" /> Profile is private</>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {clubForm.is_public ? 'Your club appears in the public directory and has a shareable profile page.' : 'Your club is hidden from public search and the directory.'}
                    </p>
                  </div>
                </label>
                {clubForm.is_public && clubForm.slug && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap pl-14">
                    <code className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">/club/{clubForm.slug}</code>
                    <a href={`/club/${clubForm.slug}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Section toggles — only show when public */}
              {clubForm.is_public && (
                <div className="rounded-xl border border-slate-100 bg-white divide-y divide-slate-50">
                  {[
                    { key: 'show_athletes_count', label: 'Athlete count & FTEM breakdown', desc: 'Show how many athletes you have and their development phases', icon: Users,    color: 'text-blue-500' },
                    { key: 'show_milestones',     label: 'Recent achievements',            desc: 'Show milestones marked as shared with parent',              icon: Trophy,   color: 'text-amber-500' },
                    { key: 'show_events',         label: 'Upcoming sessions & matches',   desc: 'Show your next 5 events on your public page',               icon: Calendar, color: 'text-purple-500' },
                    { key: 'show_announcements',  label: 'Club announcements',            desc: 'Show your latest posts and news publicly',                  icon: Megaphone,color: 'text-emerald-600' },
                  ].map(({ key, label, desc, icon: Icon, color }) => (
                    <label key={key} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                      </div>
                      <div className="relative shrink-0" onClick={e => { e.preventDefault(); setClubForm(p => ({ ...p, [key]: !p[key] })) }}>
                        <div className={`w-10 h-5 rounded-full transition-colors ${clubForm[key] ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${clubForm[key] ? 'translate-x-5' : ''}`} />
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={savingClub}
              className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 px-6 py-3 text-sm font-bold text-white transition-all shadow-sm shadow-emerald-500/20 min-h-[48px]">
              <Save className="h-4 w-4" />
              {savingClub ? 'Saving…' : 'Save club details'}
            </button>
          </form>
        </SectionCard>
      )}

      {/* ── Subscription plan ─────────────────────────────────────── */}
      {club && isAdmin && (
        <SectionCard title="Subscription">
          <div className="mt-4 space-y-4">
            {/* Current tier badge */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Zap className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-bold text-slate-900 capitalize">{planInfo?.tier ?? 'free'} Plan</p>
                    <p className="text-xs text-slate-400">{SUBSCRIPTION_TIERS?.[planInfo?.tier]?.price ?? '$0/mo'}</p>
                  </div>
                  {/* Free plan tooltip */}
                  {(!planInfo || planInfo.tier === 'free') && (
                    <div className="relative group/freetip self-start mt-0.5">
                      <button type="button" className="h-4 w-4 rounded-full bg-slate-200 hover:bg-slate-300 border border-slate-300 flex items-center justify-center transition-colors">
                        <span className="text-[9px] font-black text-slate-600 leading-none">?</span>
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-60 rounded-xl bg-slate-900 border border-white/10 shadow-2xl p-3 invisible group-hover/freetip:visible opacity-0 group-hover/freetip:opacity-100 transition-all duration-150 z-50 pointer-events-none">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Free plan limits</p>
                        <ul className="space-y-1.5 mb-3">
                          {[
                            '8 active athletes',
                            '1 squad',
                            '3 announcements / month',
                            'Public club profile',
                            'Athlete join requests',
                          ].map(f => (
                            <li key={f} className="flex items-center gap-2 text-[11px] text-slate-300">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Locked on free</p>
                        <ul className="space-y-1.5">
                          {[
                            'Calendar & sessions',
                            'Season registrations',
                            'Club broadcast messages',
                            'Volunteering management',
                            'Analytics dashboard',
                            'Trophy cabinet',
                          ].map(f => (
                            <li key={f} className="flex items-center gap-2 text-[11px] text-slate-500">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {planInfo?.status === 'active' || planInfo?.tier !== 'free' ? (
                <button onClick={handlePortal} disabled={loadingPortal}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 min-h-[40px]">
                  <CreditCard className="h-3.5 w-3.5" />
                  {loadingPortal ? 'Loading…' : 'Manage billing'}
                </button>
              ) : null}
            </div>

            {/* Usage bars — limits read from frontend constants so display is always correct */}
            {planInfo?.usage && (() => {
              const tier = planInfo.tier ?? 'free'
              const tierLimits = SUBSCRIPTION_TIERS[tier] ?? SUBSCRIPTION_TIERS.free
              return (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                {[
                  { label: 'Athletes', used: planInfo.usage.athletes, limit: tierLimits.athletes },
                  { label: 'Squads',   used: planInfo.usage.squads,   limit: tierLimits.squads   },
                ].map(({ label, used, limit }) => {
                  const unlimited = limit === -1
                  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">{label}</span>
                        <span className="text-slate-400">{used} / {unlimited ? '∞' : limit}</span>
                      </div>
                      {!unlimited && (
                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
            })()}

            {/* Upgrade options — only show for free plan */}
            {(!planInfo || planInfo.tier === 'free') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'pro', name: 'Pro', price: '$29/mo',
                    desc: '100 athletes · 5 squads · full toolkit',
                    benefits: [
                      'Up to 100 active athletes',
                      '5 squads',
                      'Unlimited announcements',
                      'Calendar & sessions',
                      'Season registrations & payments',
                      'Club broadcast messages',
                      'Volunteering management',
                      'Analytics dashboard',
                    ],
                  },
                  {
                    key: 'elite', name: 'Elite', price: '$79/mo',
                    desc: 'Unlimited athletes & squads · trophy cabinet',
                    benefits: [
                      'Unlimited athletes',
                      'Unlimited squads',
                      'Unlimited announcements',
                      'Calendar & sessions',
                      'Season registrations & payments',
                      'Club broadcast messages',
                      'Volunteering management',
                      'Analytics dashboard',
                      'Trophy cabinet',
                      'Remove PathwayHQ branding',
                      'Priority support',
                    ],
                  },
                ].map(p => (
                  <div key={p.key} className="relative">
                    <button
                      onClick={() => handleUpgrade(p.key)}
                      disabled={loadingCheckout === p.key}
                      className="w-full flex flex-col items-start gap-1 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-4 py-3 text-left transition-all disabled:opacity-50 group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-black text-emerald-700">{p.name}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{p.price} AUD/mo</span>
                      <span className="text-xs text-slate-500">{p.desc}</span>
                      {loadingCheckout === p.key && <span className="text-xs text-emerald-600">Redirecting…</span>}
                    </button>
                    {/* Tooltip trigger — sits on top of card, stops click propagation */}
                    <div className="absolute top-2.5 right-8 group/tip">
                      <button
                        type="button"
                        onClick={e => e.stopPropagation()}
                        className="h-4 w-4 rounded-full bg-emerald-200 hover:bg-emerald-300 border border-emerald-300 flex items-center justify-center transition-colors"
                      >
                        <span className="text-[9px] font-black text-emerald-700 leading-none">?</span>
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 w-56 rounded-xl bg-slate-900 border border-white/10 shadow-2xl p-3 invisible group-hover/tip:visible opacity-0 group-hover/tip:opacity-100 transition-all duration-150 z-50 pointer-events-none">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">{p.name} plan includes</p>
                        <ul className="space-y-1.5">
                          {p.benefits.map(b => (
                            <li key={b} className="flex items-center gap-2 text-[11px] text-slate-300">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Club membership (athlete leave) ──────────────────────── */}
      {user?.role === 'athlete' && athleteProfile?.club_name && (
        <SectionCard title="Club membership">
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{athleteProfile.club_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Your history and stats are always preserved, even after leaving.</p>
              </div>
            </div>

            {!confirmLeave ? (
              <button
                onClick={() => setConfirmLeave(true)}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
              >
                Leave this club
              </button>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                <p className="text-sm font-bold text-red-700">Leave {athleteProfile.club_name}?</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You will be removed from their roster. Your history and achievements stay on your profile — you can join another club anytime.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmLeave(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLeaveClub}
                    disabled={leavingClub}
                    className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                  >
                    {leavingClub ? 'Leaving…' : 'Yes, leave club'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Bank account (Stripe Connect) ─────────────────────────── */}
      {club && isAdmin && (
        <SectionCard title="Bank account for season payments">
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect a bank account so athletes can pay season fees directly to your club via Stripe. Funds land in your account automatically — no manual handling.
            </p>
            {connectStatus?.status === 'active' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Bank account connected</p>
                    <p className="text-xs text-slate-500 mt-0.5">Season payments go directly to your account.</p>
                  </div>
                </div>
                <button onClick={handleConnectLogin} disabled={loadingConnectLogin}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
                  <Building2 className="h-3.5 w-3.5" />
                  {loadingConnectLogin ? 'Loading…' : 'View payouts dashboard'}
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            ) : connectStatus?.status === 'pending' ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-bold text-amber-700">Setup incomplete</p>
                  <p className="text-xs text-slate-500 mt-0.5">Complete bank account verification to start accepting payments.</p>
                </div>
                <button onClick={handleConnectOnboard} disabled={loadingConnect}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50">
                  <Building2 className="h-4 w-4" />
                  {loadingConnect ? 'Loading…' : 'Continue setup'}
                </button>
              </div>
            ) : (
              <button onClick={handleConnectOnboard} disabled={loadingConnect}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50">
                <Building2 className="h-4 w-4" />
                {loadingConnect ? 'Loading…' : 'Connect bank account'}
              </button>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
