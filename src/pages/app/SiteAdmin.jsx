import { useState, useEffect } from 'react'
import { Shield, Users, Building2, RefreshCw } from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'

export default function SiteAdmin() {
  const toast = useToast()
  const [clubs, setClubs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/clubs/all')
      .then(r => setClubs(r.data))
      .catch(() => toast.error('Failed to load clubs'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Shield className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Site Admin</h1>
          <p className="text-sm text-slate-500">Platform-wide overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Clubs</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{clubs.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Public Clubs</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{clubs.filter(c => c.is_public).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sports</span>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {new Set(clubs.map(c => c.sport)).size}
          </p>
        </div>
      </div>

      {/* Clubs table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">All Clubs</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No clubs registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Club</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Sport</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Plan</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Visibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clubs.map(club => (
                  <tr key={club.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{club.name}</p>
                      {club.slug && <p className="text-xs text-slate-400 mt-0.5">/{club.slug}</p>}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-500 capitalize">{club.sport}</td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-500">
                      {[club.city, club.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 capitalize">
                        {club.subscription_tier ?? 'free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        club.is_public
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {club.is_public ? 'Public' : 'Private'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
