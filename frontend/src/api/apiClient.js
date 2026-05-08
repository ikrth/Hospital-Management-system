import axios from 'axios'
import { useAuthStore } from '../store/authStore.js'
import toast from 'react-hot-toast'

let baseURL = 'http://localhost:5000/api/v1'
try {
  if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
    baseURL = import.meta.env.VITE_API_URL
  }
} catch (e) {
  // import.meta may be undefined in some test environments
}

const apiClient = axios.create({ baseURL })

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      const { logout } = useAuthStore.getState()
      logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // parse field-level validation errors (422) into a normalized object
    if (status === 422) {
      const data = error?.response?.data || {}
      let fieldErrors = {}
      // common shapes: { errors: { field: 'msg' } } or { errors: [{ field, message }] }
      if (data.errors && typeof data.errors === 'object') {
        if (Array.isArray(data.errors)) {
          data.errors.forEach((e) => {
            if (e.field) fieldErrors[e.field] = e.message || e.msg || JSON.stringify(e)
          })
        } else {
          fieldErrors = data.errors
        }
      }
      // also support { field: ['msg'] } style
      if (Object.keys(fieldErrors).length === 0 && data?.fields) {
        fieldErrors = data.fields
      }

      const message = data?.message || data?.error || 'Validation failed'
      toast.error(message)
      error.fieldErrors = fieldErrors
      return Promise.reject(error)
    }

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Request failed'

    toast.error(message)
    return Promise.reject(new Error(message))
  }
)

export default apiClient
