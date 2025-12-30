import { useState } from 'react'
import { useAuthStore } from './authStore'
import { authApi } from '../api/authApi'

export function useAuth() {
  const { user, isAuthenticated, setUser, setToken, setLoading, setError, logout: logoutStore } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      setLoading(true)
      setError(null)

      const { user, token } = await authApi.login({ username, password })
      
      setUser(user)
      setToken(token)
      
      return { success: true, user }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  const register = async (userData: {
    username: string
    password: string
    email: string
    phone?: string
  }) => {
    try {
      setIsLoading(true)
      setLoading(true)
      setError(null)

      const { user, token } = await authApi.register(userData)
      
      setUser(user)
      setToken(token)
      
      return { success: true, user }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      logoutStore()
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  }
}
