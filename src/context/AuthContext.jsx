import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('spotify_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.expiresAt > Date.now()) {
          setUser(parsed)
        } else {
          refreshToken(parsed.refreshToken)
        }
      } catch {
        localStorage.removeItem('spotify_auth')
      }
    }
    setLoading(false)
  }, [])

  async function refreshToken(refreshToken) {
    try {
      const res = await fetch(`/api/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`)
      if (!res.ok) throw new Error('Refresh failed')
      const data = await res.json()
      const authData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
        user: data.user,
      }
      localStorage.setItem('spotify_auth', JSON.stringify(authData))
      setUser(authData)
    } catch {
      logout()
    }
  }

  function login(authData) {
    localStorage.setItem('spotify_auth', JSON.stringify(authData))
    setUser(authData)
  }

  function logout() {
    localStorage.removeItem('spotify_auth')
    setUser(null)
  }

  function getAccessToken() {
    if (!user) return null
    if (user.expiresAt < Date.now()) {
      refreshToken(user.refreshToken)
      return null
    }
    return user.accessToken
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
