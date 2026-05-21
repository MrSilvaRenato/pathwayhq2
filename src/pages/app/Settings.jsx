import { useState, useEffect } from 'react'
import { Save, ExternalLink, Eye, EyeOff, Phone } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { SPORTS, STATES, SUBSCRIPTION_TIERS } from '../../lib/constants'

// ── Avatar initials circle ────────────────────────────────────────────────────
function AvatarCircle({ name, role }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  const roleLabel = {
    admin:   { label: 'Admin',   cls: 'bg-purple-100 text-purple-700' },
    coach:   { label: 'Coach',   cls: 'bg-blue-100 text-blue-700' },
    athlete: { label: 'Athlete', cls: 'bg-emerald-100 text-emerald-700' },
    parent:  { label: 'Parent',  cls: 'bg-amber-100 text-amber-700' },
  }[role] ?? { label: role ?? 'Member', cls: 'bg-slate-100 text-slate-600' }

  return (
    <div className="flex flex-col items-center py-6 border-b border-slate-100 mb-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white text-2xl font-black shadow-lg shadow-emerald-500/20 mb-3">
        {initials}
      </div>
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
  const { user, isAdmin } = useAuth()
  const toast = useToast()

  const [profile,  setProfile]  = useState({ full_name: '', phone: '', password: '' })
  const [club,     setClub]     = useState(null)
  const [clubForm, setClubForm] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingClub,    setSavingClub]    = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  useEffect(() => {
    api.get('/profile').then(r => {
      const d = r.data
      setProfile({ full_name: d.full_name ?? '', phone: d.phone ?? '', password: '' })
      if (d.club_id) {
        setClub(d)
        setClubForm({
          name:          d.club_name      ?? '',
          city:          d.city           ?? '',
          state:         d.state          ?? 'QLD',
          sport:         d.sport          ?? 'soccer',
          slug:          d.slug           ?? '',
          description:   d.description   ?? '',
          website:       d.website        ?? '',
          contact_email: d.contact_email  ?? '',
          is_public:     d.is_public      ?? false,
        })
      }
    }).catch(() => toast.error('Failed to load profile'))
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await api.put('/profile', profile)
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

  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all min-h-[48px]"
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"

  return (
    <div className="px-4 py-4 md:p-6 lg:p-8 max-w-2xl mx-auto pb-28 md:pb-8">
      <h1 className="text-2xl font-black text-slate-900 mb-5">Settings</h1>

      {/* Avatar + name + role badge */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm mb-4">
        <AvatarCircle name={profile.full_name || user?.full_name} role={user?.role} />
      </div>

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
            <label className={labelCls}>Email</label>
            <input
              value={user?.email ?? ''}
              disabled
              className={inputCls + ' opacity-60 cursor-not-allowed bg-slate-50'}
            />
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

          {/* Save button — sticky on mobile */}
          <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-slate-100 py-3 px-4 md:static md:border-0 md:p-0 md:bg-transparent md:z-auto">
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
            <div>
              <label className={labelCls}>Club name</label>
              <input
                required
                value={clubForm.name}
                onChange={e => setClubForm(p => ({ ...p, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input
                  value={clubForm.city}
                  onChange={e => setClubForm(p => ({ ...p, city: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select
                  value={clubForm.state}
                  onChange={e => setClubForm(p => ({ ...p, state: e.target.value }))}
                  className={inputCls + ' cursor-pointer'}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Primary sport</label>
              <select
                value={clubForm.sport}
                onChange={e => setClubForm(p => ({ ...p, sport: e.target.value }))}
                className={inputCls + ' cursor-pointer'}>
                {SPORTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={clubForm.description}
                onChange={e => setClubForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className={inputCls + ' resize-none h-auto min-h-0'}
              />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input
                value={clubForm.website}
                onChange={e => setClubForm(p => ({ ...p, website: e.target.value }))}
                className={inputCls}
                placeholder="https://"
              />
            </div>
            <div>
              <label className={labelCls}>Contact email</label>
              <input
                type="email"
                value={clubForm.contact_email}
                onChange={e => setClubForm(p => ({ ...p, contact_email: e.target.value }))}
                className={inputCls}
              />
            </div>

            {/* Public toggle */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={clubForm.is_public}
                    onChange={e => setClubForm(p => ({ ...p, is_public: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 rounded-full bg-slate-300 peer-checked:bg-emerald-500 transition-colors" />
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Make club profile public</p>
                  <p className="text-xs text-slate-400 mt-0.5">Athletes and parents can discover your club online</p>
                </div>
              </label>
              {clubForm.slug && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500">Public URL:</span>
                  <code className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">/club/{clubForm.slug}</code>
                  <a href={`/club/${clubForm.slug}`} target="_blank" rel="noreferrer"
                    className="text-emerald-500 hover:text-emerald-600 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingClub}
              className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 px-6 py-3 text-sm font-bold text-white transition-all shadow-sm shadow-emerald-500/20 min-h-[48px]">
              <Save className="h-4 w-4" />
              {savingClub ? 'Saving…' : 'Save club details'}
            </button>
          </form>
        </SectionCard>
      )}

      {/* ── Current plan section ──────────────────────────────────── */}
      {club && (
        <SectionCard title="Current plan">
          <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
            <div>
              <span className="text-xl font-black text-emerald-600 capitalize">{club.subscription_tier ?? 'free'}</span>
              <p className="text-xs text-slate-400 mt-0.5">
                {SUBSCRIPTION_TIERS?.[club.subscription_tier]?.athletes} · {SUBSCRIPTION_TIERS?.[club.subscription_tier]?.price}
              </p>
            </div>
            <button className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all min-h-[44px]">
              Contact us to upgrade
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
