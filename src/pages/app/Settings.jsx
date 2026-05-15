import { useState, useEffect } from 'react'
import { Save, ExternalLink, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { SPORTS, STATES, SUBSCRIPTION_TIERS } from '../../lib/constants'

export default function Settings() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()

  const [profile, setProfile]   = useState({ full_name: '', password: '' })
  const [club,    setClub]       = useState(null)
  const [clubForm, setClubForm] = useState({})
  const [saving, setSaving]     = useState(false)
  const [showPw, setShowPw]     = useState(false)

  useEffect(() => {
    api.get('/profile').then(r => {
      const d = r.data
      setProfile({ full_name: d.full_name ?? '', password: '' })
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
    setSaving(true)
    try {
      await api.put('/profile', profile)
      setProfile(p => ({ ...p, password: '' }))
      toast.success('Profile saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function saveClub(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/club', clubForm)
      toast.success('Club details saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save club details')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Settings</h1>

      {/* Profile card */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 mb-5">
        <h2 className="font-bold text-slate-900 mb-5">Your account</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className={labelCls}>Full name</label>
            <input
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input value={user?.email ?? ''} disabled className={inputCls + ' opacity-60 cursor-not-allowed bg-slate-50'} />
          </div>
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
                className={inputCls + ' pr-11'}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-all shadow-sm shadow-emerald-500/20">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      {/* Club card */}
      {club && isAdmin && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 mb-5">
          <h2 className="font-bold text-slate-900 mb-5">Club details</h2>
          <form onSubmit={saveClub} className="space-y-4">
            <div>
              <label className={labelCls}>Club name</label>
              <input required value={clubForm.name} onChange={e => setClubForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input value={clubForm.city} onChange={e => setClubForm(p => ({ ...p, city: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select value={clubForm.state} onChange={e => setClubForm(p => ({ ...p, state: e.target.value }))} className={inputCls + ' cursor-pointer'}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Primary sport</label>
              <select value={clubForm.sport} onChange={e => setClubForm(p => ({ ...p, sport: e.target.value }))} className={inputCls + ' cursor-pointer'}>
                {SPORTS.filter(s => s.in2032).map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={clubForm.description} onChange={e => setClubForm(p => ({ ...p, description: e.target.value }))} rows={3} className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input value={clubForm.website} onChange={e => setClubForm(p => ({ ...p, website: e.target.value }))} className={inputCls} placeholder="https://" />
            </div>
            <div>
              <label className={labelCls}>Contact email</label>
              <input type="email" value={clubForm.contact_email} onChange={e => setClubForm(p => ({ ...p, contact_email: e.target.value }))} className={inputCls} />
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
                  <div className="w-9 h-5 rounded-full bg-slate-300 peer-checked:bg-emerald-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
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
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-all shadow-sm shadow-emerald-500/20">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save club details'}
            </button>
          </form>
        </div>
      )}

      {/* Plan */}
      {club && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Current plan</h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xl font-black text-emerald-600 capitalize">{club.subscription_tier ?? 'free'}</span>
              <p className="text-xs text-slate-400 mt-0.5">
                {SUBSCRIPTION_TIERS?.[club.subscription_tier]?.athletes} · {SUBSCRIPTION_TIERS?.[club.subscription_tier]?.price}
              </p>
            </div>
            <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all">
              Contact us to upgrade
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
