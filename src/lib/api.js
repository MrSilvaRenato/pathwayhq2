import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('phq_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    const isAuthRoute = ['/auth/login', '/auth/register'].some(p =>
      err.config?.url?.includes(p)
    )
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('phq_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
