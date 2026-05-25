import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  const isImpersonating = !!sessionStorage.getItem('phq_admin_token')

  useEffect(() => {
    const token = localStorage.getItem('phq_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('phq_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('phq_token', data.token)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    localStorage.setItem('phq_token', data.token)
    setUser(data.user)
    return data.user
  }

  function logout() {
    sessionStorage.removeItem('phq_admin_token')
    localStorage.removeItem('phq_token')
    setUser(null)
  }

  async function impersonate(userId) {
    const { data } = await api.post(`/admin/impersonate/${userId}`)
    sessionStorage.setItem('phq_admin_token', localStorage.getItem('phq_token'))
    localStorage.setItem('phq_token', data.token)
    window.location.href = '/dashboard'
  }

  function stopImpersonating() {
    const adminToken = sessionStorage.getItem('phq_admin_token')
    sessionStorage.removeItem('phq_admin_token')
    localStorage.setItem('phq_token', adminToken)
    window.location.href = '/site-admin'
  }

  const isAdmin = user?.role === 'club_admin' || user?.role === 'site_admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isImpersonating, impersonate, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
