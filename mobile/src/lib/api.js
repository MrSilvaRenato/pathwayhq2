import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const baseURL =
  Constants.expoConfig?.extra?.apiUrl ?? 'https://ausfairgo.com.au/api'

const api = axios.create({ baseURL })

api.interceptors.request.use(async (cfg) => {
  const token = await AsyncStorage.getItem('phq_token')
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const url = err.config?.url ?? ''
    const isAuthRoute   = ['/auth/login', '/auth/register'].some((p) => url.includes(p))
    const isPublicRoute = url.includes('/clubs/public/')
    if (err.response?.status === 401 && !isAuthRoute && !isPublicRoute) {
      await AsyncStorage.removeItem('phq_token')
    }
    return Promise.reject(err)
  }
)

export default api
