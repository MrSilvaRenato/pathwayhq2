import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await AsyncStorage.getItem('phq_token')
        if (!token) {
          setLoading(false)
          return
        }
        const adminToken = await AsyncStorage.getItem('phq_admin_token')
        setIsImpersonating(!!adminToken)
        const r = await api.get('/auth/me')
        setUser(r.data)
      } catch {
        await AsyncStorage.removeItem('phq_token')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    await AsyncStorage.setItem('phq_token', data.token)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    await AsyncStorage.setItem('phq_token', data.token)
    setUser(data.user)
    return data.user
  }

  async function refreshUser() {
    const r = await api.get('/auth/me')
    setUser(r.data)
  }

  async function logout() {
    await AsyncStorage.removeItem('phq_token')
    await AsyncStorage.removeItem('phq_admin_token')
    setUser(null)
    setIsImpersonating(false)
  }

  const isAdmin = user?.role === 'club_admin' || user?.role === 'site_admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isImpersonating,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
