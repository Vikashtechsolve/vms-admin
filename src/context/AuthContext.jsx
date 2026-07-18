import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loginApi, getStoredToken, setStoredToken } from '../services/api.js'

const STORAGE_KEY = 'traineradda_admin_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const token = getStoredToken()
      if (stored && token) {
        const parsed = JSON.parse(stored)
        if (parsed?.name && parsed?.username) setUser(parsed)
      } else if (!token) {
        setUser(null)
      }
    } catch (_) {}
    setReady(true)
  }, [])

  const login = useCallback(async (username, password) => {
    try {
      const data = await loginApi(username, password)
      if (data?.token && data?.user) {
        setStoredToken(data.token)
        const u = { username: data.user.username, name: data.user.name }
        setUser(u)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
        return { success: true }
      }
      return { success: false, error: 'Invalid response from server' }
    } catch (err) {
      const isNetworkError = !err.response && err.message === 'Network Error'
      const message = isNetworkError
        ? 'Cannot reach the API server. Check your connection or contact support.'
        : err.response?.data?.error || err.message || 'Login failed'
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setStoredToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = { user, login, logout, ready }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
