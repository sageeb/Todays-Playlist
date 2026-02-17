import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const expiresIn = searchParams.get('expires_in')
    const displayName = searchParams.get('display_name')
    const userId = searchParams.get('user_id')
    const error = searchParams.get('error')

    if (error) {
      navigate('/')
      return
    }

    if (accessToken) {
      login({
        accessToken,
        refreshToken,
        expiresAt: Date.now() + Number(expiresIn) * 1000,
        user: { displayName, id: userId },
      })
      navigate('/today')
    } else {
      navigate('/')
    }
  }, [searchParams, login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">🎵</div>
        <p className="text-gray-400">Connecting to Spotify...</p>
      </div>
    </div>
  )
}
