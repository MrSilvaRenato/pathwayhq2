import { useState, useEffect, useMemo } from 'react'
import {
  Shield, Users, Building2, RefreshCw, CheckCircle, XCircle, Loader2,
  Copy, Check, RotateCcw, Plus, Search, X, Pencil, Trash2,
  Globe, ExternalLink, Dumbbell, Activity, UserCog, Megaphone, Clock,
  UserCheck,
} from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { SPORTS, FTEM_PHASES } from '../../lib/constants'

// ── Shared helpers ────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs font-mono text-slate-700 transition-colors">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {text}
    </button>
  )
}

function StatCard({ icon: Icon, label, value, color = 'text-slate-500' }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-black text-slate-900">{value ?? <span className="text-slate-300">—</span>}</p>
    </div>
  )
}

const ROLE_META = {
  site_admin: { label: 'Site Admin', color: 'bg-violet-100 text-violet-700' },
  club_admin:  { label: 'Club Admin', color: 'bg-emerald-100 text-emerald-700' },
  coach:       { label: 'Coach',      color: 'bg-blue-100 text-blue-700' },
  athlete:     { label: 'Athlete',    color: 'bg-slate-100 text-slate-600' },
  parent:      { label: 'Parent',     color: 'bg-amber-100 text-amber-700' },
}

function RoleBadge({ role }) {
  const meta = ROLE_META[role] ?? { label: role, color: 'bg-slate-100 text-slate-500' }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.color}`}>
      {meta.label}
    </span>
  )
}

const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

// ── Clubs tab ─────────────────────────────────────────────────────────────────

const CLUB_EMPTY = { name: '', sport: 'soccer', city: '', state: '', description: '', website: '', contact_email: '', phone: '', is_public: false, is_claimed: false }

function ClubsTab() {
  const toast = useToast()
  const [clubs,    setClubs]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [q,        setQ]        = useState('')
  const [modal,    setModal]    = useState(null) // null | 'add' | club-object
  const [form,     setForm]     = useState(CLUB_EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    api.get('/clubs/all')
      .then(r => setClubs(r.data))
      .catch(() => toast.error('Failed to load clubs'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return clubs.filter(c => !q || c.name.toLowerCase().includes(ql) || c.slug?.includes(ql))
  }, [clubs, q])

  function openAdd()      { setForm(CLUB_EMPTY);  setModal('add') }
  function openEdit(club) { setForm({ ...club });  setModal(club) }
  function closeModal()   { setModal(null); setForm(CLUB_EMPTY) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'add') {
        const { data } = await api.post('/admin/clubs', form)
        setClubs(p => [data, ...p])
        toast.success('Club created')
      } else {
        const { data } = await api.put(`/admin/clubs/${modal.id}`, form)
        setClubs(p => p.map(c => c.id === modal.id ? { ...c, ...data.club } : c))
        toast.success('Club updated')
      }
      closeModal()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"?\n\nThis permanently removes the club and ALL its data including athletes, seasons, and events.`)) return
    setDeleting(id)
    try {
      await api.delete(`/admin/clubs/${id}`)
      setClubs(p => p.filter(c => c.id !== id))
      toast.success('Club deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search clubs…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          {q && <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-sm shadow-emerald-500/20">
          <Plus className="h-4 w-4" /> Add Club
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>{q ? 'No clubs match your search.' : 'No clubs registered yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Club</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Sport</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(club => (
                  <tr key={club.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{club.name}</p>
                      {club.slug && <p className="text-xs text-slate-400 mt-0.5">/{club.slug}</p>}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-500 capitalize">{club.sport}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500">
                      {[club.city, club.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${club.is_public ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {club.is_public ? 'Public' : 'Private'}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${club.is_claimed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {club.is_claimed ? 'Claimed' : 'Unclaimed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(club)}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDelete(club.id, club.name)} disabled={!!deleting}
                          className="flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 transition-colors disabled:opacity-50">
                          {deleting === club.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <h2 className="text-lg font-black text-slate-900">{modal === 'add' ? 'Add Club' : 'Edit Club'}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSave} className="px-6 py-5 space-y-3 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Club name *</label>
                  <input required value={form.name ?? ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Sport *</label>
                    <select required value={form.sport ?? 'soccer'} onChange={e => setForm(p => ({ ...p, sport: e.target.value }))} className={inputCls}>
                      {SPORTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">City</label>
                    <input value={form.city ?? ''} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">State</label>
                    <input value={form.state ?? ''} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone</label>
                    <input value={form.phone ?? ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Contact email</label>
                  <input type="email" value={form.contact_email ?? ''} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Website</label>
                  <input value={form.website ?? ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className={inputCls} placeholder="https://…" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Description</label>
                  <textarea rows={2} value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputCls} />
                </div>
                <div className="flex gap-6 pt-1">
                  {[['is_public', 'Public'], ['is_claimed', 'Claimed']].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                      <button type="button" onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3 pt-2 pb-2">
                  <button type="button" onClick={closeModal}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors">
                    {saving ? 'Saving…' : modal === 'add' ? 'Create Club' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const toast = useToast()
  const { impersonate } = useAuth()
  const [users,    setUsers]    = useState([])
  const [clubs,    setClubs]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [q,        setQ]        = useState('')
  const [roleF,    setRoleF]    = useState('')
  const [editUser, setEditUser] = useState(null)
  const [form,     setForm]     = useState({})
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/clubs/all')])
      .then(([ur, cr]) => { setUsers(ur.data); setClubs(cr.data) })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return users.filter(u => {
      if (roleF && u.role !== roleF) return false
      if (q && !u.full_name?.toLowerCase().includes(ql) && !u.email?.toLowerCase().includes(ql)) return false
      return true
    })
  }, [users, q, roleF])

  function openEdit(u) {
    setEditUser(u)
    setForm({ full_name: u.full_name ?? '', email: u.email ?? '', role: u.role, club_id: u.club_id ?? '' })
  }
  function closeEdit() { setEditUser(null); setForm({}) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/admin/users/${editUser.id}`, { ...form, club_id: form.club_id || null })
      const clubName = clubs.find(c => c.id === form.club_id)?.name ?? null
      setUsers(p => p.map(u => u.id === editUser.id
        ? { ...u, full_name: form.full_name, email: form.email, role: form.role, club_id: form.club_id || null, club_name: clubName }
        : u))
      toast.success('User updated')
      closeEdit()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(p => p.filter(u => u.id !== id))
      toast.success('User deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const needsClub = ['club_admin', 'coach'].includes(form.role)

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search users…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          {q && <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <select value={roleF} onChange={e => setRoleF(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">All roles</option>
          {Object.entries(ROLE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Club</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{u.full_name ?? '—'}</p>
                      <p className="text-xs text-slate-400 md:hidden truncate">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-500 max-w-[180px] truncate">{u.email}</td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 max-w-[160px] truncate">{u.club_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== 'site_admin' && (
                          <button onClick={() => impersonate(u.id)}
                            title="Log in as this user"
                            className="flex items-center gap-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 text-xs font-bold transition-colors">
                            <UserCheck className="h-3.5 w-3.5" /> Impersonate
                          </button>
                        )}
                        <button onClick={() => openEdit(u)}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDelete(u.id, u.full_name)} disabled={!!deleting}
                          className="flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 transition-colors disabled:opacity-50">
                          {deleting === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editUser && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={closeEdit} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <h2 className="text-lg font-black text-slate-900">Edit User</h2>
                <button onClick={closeEdit} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSave} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Full name</label>
                  <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Role</label>
                  <select value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value, club_id: ['club_admin', 'coach'].includes(e.target.value) ? p.club_id : '' }))}
                    className={inputCls}>
                    {Object.entries(ROLE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                  </select>
                </div>
                {needsClub && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Club</label>
                    <select value={form.club_id ?? ''} onChange={e => setForm(p => ({ ...p, club_id: e.target.value }))} className={inputCls}>
                      <option value="">— No club —</option>
                      {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex gap-3 pt-2 pb-2">
                  <button type="button" onClick={closeEdit}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Athletes tab ──────────────────────────────────────────────────────────────

function AthletesTab() {
  const toast = useToast()
  const [athletes,  setAthletes]  = useState([])
  const [clubs,     setClubs]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [q,         setQ]         = useState('')
  const [clubFilter,setClubFilter]= useState('')

  useEffect(() => {
    Promise.all([api.get('/admin/athletes'), api.get('/clubs/all')])
      .then(([ar, cr]) => { setAthletes(ar.data); setClubs(cr.data) })
      .catch(() => toast.error('Failed to load athletes'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return athletes.filter(a => {
      if (clubFilter && a.club_id !== clubFilter) return false
      if (q && !`${a.first_name} ${a.last_name}`.toLowerCase().includes(ql)) return false
      return true
    })
  }, [athletes, q, clubFilter])

  function initials(a) { return `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase() }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search athletes…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          {q && <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <select value={clubFilter} onChange={e => setClubFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">All clubs</option>
          {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Dumbbell className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>No athletes found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Athlete</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Club</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Sport</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Phase</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(a => {
                  const sport = SPORTS.find(s => s.value === a.sport)
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-emerald-500 text-white text-xs font-black">
                            {a.avatar_url
                              ? <img src={a.avatar_url} alt={a.first_name} className="h-full w-full object-cover" />
                              : initials(a)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{a.first_name} {a.last_name}</p>
                            <p className="text-xs text-slate-400 md:hidden">{a.club_name ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-slate-500">{a.club_name ?? '—'}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500">{sport?.emoji} {sport?.label}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {a.ftem_phase && (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${FTEM_PHASES[a.ftem_phase]?.color ?? ''}`}>
                            {a.ftem_phase}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${a.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {a.slug && (
                          <a href={`/athlete/${a.slug}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" /> View
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Broadcast tab ────────────────────────────────────────────────────────────

function BroadcastTab() {
  const toast = useToast()
  const [clubs,      setClubs]      = useState([])
  const [form,       setForm]       = useState({ title: '', body: '', link: '', target: 'all' })
  const [confirming, setConfirming] = useState(false)
  const [sending,    setSending]    = useState(false)
  const [lastSent,   setLastSent]   = useState(null)

  useEffect(() => {
    api.get('/clubs/all').then(r => setClubs(r.data)).catch(() => {})
  }, [])

  function handleSend(e) {
    e.preventDefault()
    setConfirming(true)
  }

  async function confirmSend() {
    setConfirming(false)
    setSending(true)
    try {
      const { data } = await api.post('/admin/broadcast', form)
      setLastSent({ ...form, count: data.count })
      setForm({ title: '', body: '', link: '', target: 'all' })
      toast.success(`Sent to ${data.count} user${data.count !== 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const targetOptions = [
    { value: 'all',             label: 'All users' },
    { value: 'role:athlete',    label: 'Athletes only' },
    { value: 'role:coach',      label: 'Coaches only' },
    { value: 'role:club_admin', label: 'Club admins only' },
    { value: 'role:parent',     label: 'Parents only' },
    ...clubs.map(c => ({ value: `club:${c.id}`, label: `Club: ${c.name}` })),
  ]

  const audienceLabel = targetOptions.find(o => o.value === form.target)?.label ?? form.target

  return (
    <div className="max-w-2xl">
      {lastSent && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-800 mb-1">✅ Broadcast sent to {lastSent.count} users</p>
          <p className="text-xs text-emerald-700 font-semibold">"{lastSent.title}"</p>
        </div>
      )}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Megaphone className="h-5 w-5 text-violet-500" />
          <h2 className="font-black text-slate-900">Send Platform Notification</h2>
        </div>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Audience</label>
            <select value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} className={inputCls}>
              {targetOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Title *</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={inputCls} placeholder="e.g. Scheduled maintenance tonight" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Message *</label>
            <textarea required rows={3} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              className={inputCls} placeholder="What do you want users to know?" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wide">Link <span className="font-normal text-slate-400">(optional)</span></label>
            <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
              className={inputCls} placeholder="/dashboard or https://…" />
          </div>
          {confirming ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-900 text-center">
                Send to <span className="font-black">{audienceLabel}</span>?
              </p>
              <p className="text-xs text-amber-700 text-center leading-relaxed">"{form.title}"</p>
              <div className="flex gap-2.5">
                <button type="button" onClick={() => setConfirming(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
                <button type="button" onClick={confirmSend}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-violet-500 hover:bg-violet-400 py-3 text-sm font-bold text-white transition-colors">
                  <Megaphone className="h-3.5 w-3.5" /> Yes, send it
                </button>
              </div>
            </div>
          ) : (
            <button type="submit" disabled={sending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              {sending ? 'Sending…' : 'Send broadcast'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Activity log tab ──────────────────────────────────────────────────────────

const ACTION_META = {
  'claim.approved':    { label: 'Approved claim',    color: 'bg-emerald-100 text-emerald-700' },
  'claim.rejected':    { label: 'Rejected claim',    color: 'bg-red-100 text-red-600' },
  'claim.revoked':     { label: 'Revoked claim',     color: 'bg-orange-100 text-orange-700' },
  'club.created':      { label: 'Created club',      color: 'bg-blue-100 text-blue-700' },
  'club.updated':      { label: 'Updated club',      color: 'bg-slate-100 text-slate-600' },
  'club.deleted':      { label: 'Deleted club',      color: 'bg-red-100 text-red-600' },
  'user.role_changed': { label: 'Changed role',      color: 'bg-violet-100 text-violet-700' },
  'user.deleted':      { label: 'Deleted user',      color: 'bg-red-100 text-red-600' },
  'broadcast.sent':    { label: 'Sent broadcast',    color: 'bg-violet-100 text-violet-700' },
  'user.impersonated': { label: 'Impersonated user', color: 'bg-amber-100 text-amber-700' },
}

function ActivityTab() {
  const toast = useToast()
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')

  useEffect(() => {
    api.get('/admin/activity-log')
      .then(r => setLogs(r.data))
      .catch(() => toast.error('Failed to load activity log'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => filter ? logs.filter(l => l.action === filter) : logs, [logs, filter])

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function metaDescription(log) {
    try {
      const m = log.metadata ? JSON.parse(log.metadata) : null
      if (!m) return null
      if (log.action === 'user.role_changed') return `${m.from} → ${m.to}`
      if (log.action === 'broadcast.sent') return `${m.recipients} recipients · target: ${m.target}`
      return null
    } catch { return null }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">All actions</option>
          {Object.entries(ACTION_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
        </select>
        <span className="text-sm text-slate-400">{filtered.length} entries</span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Clock className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(log => {
              const meta = ACTION_META[log.action] ?? { label: log.action, color: 'bg-slate-100 text-slate-500' }
              const desc = metaDescription(log)
              return (
                <div key={log.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{log.admin_name}</span>
                      {log.target_name && <> → <span className="text-slate-500 break-words">{log.target_name}</span></>}
                    </p>
                    {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
                    <p className="text-xs text-slate-400 mt-0.5 sm:hidden">{formatTime(log.created_at)}</p>
                  </div>
                  <span className="hidden sm:block shrink-0 text-xs text-slate-400 whitespace-nowrap">{formatTime(log.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Claims panel (preserved) ──────────────────────────────────────────────────

function ClaimsPanel() {
  const toast = useToast()
  const [claims,      setClaims]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [acting,      setActing]      = useState(null)
  const [credentials, setCredentials] = useState(null)

  useEffect(() => {
    api.get('/club-claims')
      .then(r => setClaims(r.data))
      .catch(() => toast.error('Failed to load claims'))
      .finally(() => setLoading(false))
  }, [])

  async function approve(id) {
    setActing(id + 'approve')
    try {
      const { data } = await api.put(`/club-claims/${id}/approve`)
      setClaims(p => p.map(c => c.id === id ? { ...c, status: 'approved' } : c))
      if (data.temp_password) setCredentials({ email: data.email, password: data.temp_password })
      else toast.success('Claim approved — existing user updated')
    } catch { toast.error('Failed to approve claim') }
    finally { setActing(null) }
  }

  async function reject(id) {
    setActing(id + 'reject')
    try {
      await api.put(`/club-claims/${id}/reject`)
      setClaims(p => p.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
      toast.success('Claim rejected')
    } catch { toast.error('Failed to reject claim') }
    finally { setActing(null) }
  }

  async function revoke(id) {
    setActing(id + 'revoke')
    try {
      await api.put(`/club-claims/${id}/revoke`)
      setClaims(p => p.map(c => c.id === id ? { ...c, status: 'revoked' } : c))
      toast.success('Manager access revoked — club set back to unclaimed')
    } catch { toast.error('Failed to revoke claim') }
    finally { setActing(null) }
  }

  const pending  = claims.filter(c => c.status === 'pending')
  const resolved = claims.filter(c => c.status !== 'pending')

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>

  return (
    <div className="space-y-6">
      {credentials && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5">
          <h3 className="font-black text-emerald-900 mb-1">✅ Account created — share these credentials</h3>
          <p className="text-sm text-emerald-700 mb-3">Send these to the club manager. The password cannot be retrieved again.</p>
          <div className="flex flex-wrap gap-3 items-center">
            <div><p className="text-xs font-semibold text-emerald-800 mb-1">Email</p><CopyButton text={credentials.email} /></div>
            <div><p className="text-xs font-semibold text-emerald-800 mb-1">Temp password</p><CopyButton text={credentials.password} /></div>
          </div>
          <button onClick={() => setCredentials(null)} className="mt-3 text-xs text-emerald-600 hover:text-emerald-800 underline">Dismiss</button>
        </div>
      )}

      {pending.length === 0 && resolved.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Shield className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold">No club claims yet</p>
          <p className="text-sm mt-1">Claims will appear here when clubs submit requests.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Pending claims</h2>
            <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5">{pending.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {pending.map(c => (
              <div key={c.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <span className="text-xs text-slate-400">·</span>
                    <p className="text-sm text-slate-500 truncate">{c.email}</p>
                    {c.phone && <p className="text-sm text-slate-400">{c.phone}</p>}
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 mb-1">
                    {c.club?.name}
                    {c.club?.city && <span className="font-normal text-slate-400"> · {c.club.city}, {c.club.state}</span>}
                  </p>
                  {c.role_at_club && <p className="text-xs text-slate-500 mb-1">Role: <span className="font-semibold text-slate-700">{c.role_at_club}</span></p>}
                  {c.message && <p className="text-xs text-slate-400 italic mt-1 line-clamp-2">"{c.message}"</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => approve(c.id)} disabled={!!acting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3 py-2.5 text-sm font-bold text-white transition-colors">
                    {acting === c.id + 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve
                  </button>
                  <button onClick={() => reject(c.id)} disabled={!!acting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors">
                    {acting === c.id + 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-500">Resolved claims</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {resolved.map(c => (
              <div key={c.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{c.name} <span className="font-normal text-slate-400">— {c.club?.name}</span></p>
                  <p className="text-xs text-slate-400">{c.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${
                    c.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                    : c.status === 'revoked' ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-500'
                  }`}>{c.status}</span>
                  {c.status === 'approved' && (
                    <button onClick={() => revoke(c.id)} disabled={!!acting}
                      className="flex items-center gap-1 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 px-2.5 py-1 text-xs font-bold text-red-600 transition-colors">
                      {acting === c.id + 'revoke' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SiteAdmin() {
  const toast = useToast()
  const [tab,        setTab]        = useState('overview')
  const [stats,      setStats]      = useState(null)
  const [claimBadge, setClaimBadge] = useState(0)

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {})
    api.get('/club-claims').then(r => setClaimBadge(r.data.filter(c => c.status === 'pending').length)).catch(() => {})
  }, [])

  const TABS = [
    { key: 'overview',   label: 'Overview' },
    { key: 'clubs',      label: 'Clubs' },
    { key: 'users',      label: 'Users' },
    { key: 'athletes',   label: 'Athletes' },
    { key: 'claims',     label: 'Claims', badge: claimBadge },
    { key: 'broadcast',  label: 'Broadcast' },
    { key: 'activity',   label: 'Activity' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Shield className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Site Admin</h1>
          <p className="text-sm text-slate-500">Platform control &amp; moderation</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-6 border-b border-slate-200 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.key
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            {t.label}
            {t.badge > 0 && (
              <span className="rounded-full bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 leading-none">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}     label="Total Users"     value={stats?.users_total}                               color="text-blue-500" />
            <StatCard icon={Building2} label="Total Clubs"     value={stats?.clubs_total}                               color="text-emerald-500" />
            <StatCard icon={Dumbbell}  label="Active Athletes" value={stats?.athletes_active}                           color="text-violet-500" />
            <StatCard icon={Shield}    label="Pending Claims"  value={stats?.pending_claims}                            color="text-amber-500" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={UserCog}   label="Club Admins"    value={stats?.users_by_role?.club_admin}                  color="text-emerald-500" />
            <StatCard icon={Users}     label="Coaches"        value={stats?.users_by_role?.coach}                       color="text-blue-500" />
            <StatCard icon={Dumbbell}  label="Athletes"       value={stats?.users_by_role?.athlete}                     color="text-violet-500" />
            <StatCard icon={Activity}  label="Active Seasons" value={stats?.active_seasons}                             color="text-rose-500" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={Globe}       label="Public Clubs"   value={stats?.clubs_public}                             color="text-blue-500" />
            <StatCard icon={CheckCircle} label="Claimed Clubs"  value={stats?.clubs_claimed}                            color="text-emerald-500" />
            <StatCard icon={RefreshCw}   label="Unclaimed"      value={stats != null ? stats.clubs_total - stats.clubs_claimed : null} color="text-amber-500" />
          </div>
        </div>
      )}

      {tab === 'clubs'     && <ClubsTab />}
      {tab === 'users'     && <UsersTab />}
      {tab === 'athletes'  && <AthletesTab />}
      {tab === 'claims'    && <ClaimsPanel />}
      {tab === 'broadcast' && <BroadcastTab />}
      {tab === 'activity'  && <ActivityTab />}
    </div>
  )
}
