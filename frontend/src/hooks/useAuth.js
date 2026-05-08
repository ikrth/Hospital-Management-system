import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { login as loginApi, register as registerApi, getMe } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    setAuth,
    logout,
    setLoading,
  } = useAuthStore()

  useEffect(() => {
    const rehydrate = async () => {
      if (!token || user) return
      setLoading(true)
      try {
        const data = await getMe()
        const profile = data?.data?.user || data?.user || null
        if (profile) {
          setAuth(profile, token)
        } else {
          logout()
        }
      } catch (err) {
        logout()
      } finally {
        setLoading(false)
      }
    }

    rehydrate()
  }, [token, user, setAuth, logout, setLoading])

  const login = async (creds) => {
    setLoading(true)
    try {
      const data = await loginApi(creds.email, creds.password)
      setAuth(data.user, data.token)
      toast.success('Logged in')
      return data
    } catch (err) {
      toast.error(err.message || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    setLoading(true)
    try {
      const data = await registerApi(payload)
      setAuth(data.user, data.token)
      toast.success('Account created')
      return data
    } catch (err) {
      toast.error(err.message || 'Registration failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  }
}
