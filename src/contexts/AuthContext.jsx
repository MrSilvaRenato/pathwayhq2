import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
    localStorage.removeItem('phq_token')
    setUser(null)
  }

  const isAdmin = user?.role === 'club_admin' || user?.role === 'site_admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
