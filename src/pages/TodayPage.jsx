import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import SongCard from '../components/SongCard.jsx'
import SpotifyButton from '../components/SpotifyButton.jsx'
import TasteFeedback from '../components/TasteFeedback.jsx'
import FeedbackHistory from '../components/FeedbackHistory.jsx'

export default function TodayPage() {
  const { user, loading: authLoading, logout, getAccessToken } = useAuth()
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedbackHistory, setFeedbackHistory] = useState([])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      fetchSuggestions()
      fetchFeedback()
    }
  }, [user])

  async function fetchSuggestions() {
    setLoading(true)
    setError(null)
    try {
      const token = getAccessToken()
      if (!token) return
      const res = await fetch('/api/suggestions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch suggestions')
      const data = await res.json()
      setSongs(data.songs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchFeedback() {
    try {
      const token = getAccessToken()
      if (!token) return
      const res = await fetch('/api/feedback', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFeedbackHistory(data.feedback || [])
      }
    } catch {
      // Non-critical
    }
  }

  function toggleSong(index) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  function selectAll() {
    if (selected.size === songs.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(songs.map((_, i) => i)))
    }
  }

  async function handleFeedbackSubmit(text) {
    try {
      const token = getAccessToken()
      if (!token) return
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      })
      await fetchFeedback()
    } catch {
      // Non-critical
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">🎵</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              Today's Playlist
            </h1>
            <p className="text-xs text-gray-500">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user.user?.displayName}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Song list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchSuggestions}
              className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {selected.size} of {songs.length} selected
              </p>
              <button
                onClick={selectAll}
                className="text-sm text-green-400 hover:text-green-300 transition-colors cursor-pointer"
              >
                {selected.size === songs.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="space-y-2">
              {songs.map((song, i) => (
                <SongCard
                  key={i}
                  song={song}
                  checked={selected.has(i)}
                  onToggle={() => toggleSong(i)}
                />
              ))}
            </div>
          </>
        )}

        {/* Spotify Button */}
        {!loading && !error && songs.length > 0 && (
          <div className="sticky bottom-0 py-4 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e] to-transparent">
            <SpotifyButton
              songs={songs}
              selected={selected}
              accessToken={getAccessToken()}
              onSuccess={fetchSuggestions}
            />
          </div>
        )}

        {/* Taste Feedback */}
        <div className="mt-8 pb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">Your Taste</h2>
          <p className="text-sm text-gray-500 mb-4">
            Tell us what you like and we'll personalize your suggestions.
          </p>
          <FeedbackHistory feedback={feedbackHistory} />
          <TasteFeedback onSubmit={handleFeedbackSubmit} />
        </div>
      </main>
    </div>
  )
}
