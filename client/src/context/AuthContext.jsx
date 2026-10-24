import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../api/authApi.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const data = await getCurrentUser()
        if (isMounted && data?.user) {
          setUser(data.user)
        }
      } catch {
        // A 401 simply means the visitor is logged out
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    function handleLogoutEvent() {
      setUser(null)
    }

    window.addEventListener('auth:logout', handleLogoutEvent)
    return () => {
      isMounted = false
      window.removeEventListener('auth:logout', handleLogoutEvent)
    }
  }, [])

  async function login({ email, password }) {
    const data = await loginUser({ email, password })
    setUser(data.user)
    return data.user
  }

  async function register({ name, email, phone, password }) {
    const data = await registerUser({ name, email, phone, password })
    setUser(data.user)
    return data.user
  }

  async function logout() {
    try {
      await logoutUser()
    } finally {
      setUser(null)
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const isDelivery = user?.role === 'DELIVERY'

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAdmin,
    isDelivery,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

