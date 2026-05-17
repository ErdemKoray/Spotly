import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spotly_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Token süresi dolmuşsa localStorage'ı temizle ve login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('spotly_token')
      localStorage.removeItem('spotly_user')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
