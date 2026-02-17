import { useState } from 'react'

export default function SpotifyButton({ songs, selected, accessToken }) {
  const [creating, setCreating] = useState(false)
  const [playlistUrl, setPlaylistUrl] = useState(null)
  const [error, setError] = useState(null)

  async function handleCreate() {
    if (selected.size === 0) return

    setCreating(true)
    setError(null)
    setPlaylistUrl(null)

    try {
      const selectedSongs = songs.filter((_, i) => selected.has(i))
      const trackUris = selectedSongs
        .map(s => s.spotifyUri)
        .filter(Boolean)

      if (trackUris.length === 0) {
        setError('No Spotify tracks found for selected songs')
        return
      }

      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ trackUris }),
      })

      if (!res.ok) throw new Error('Failed to create playlist')

      const data = await res.json()
      setPlaylistUrl(data.playlistUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (playlistUrl) {
    return (
      <div className="text-center">
        <a
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold px-8 py-3 rounded-full transition-colors"
        >
          Open in Spotify
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 3h7v7h-2V6.41L4.71 12.7 3.29 11.29 9.59 5H6V3z"/>
          </svg>
        </a>
        <button
          onClick={() => setPlaylistUrl(null)}
          className="block mx-auto mt-2 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
        >
          Create another
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={handleCreate}
        disabled={creating || selected.size === 0}
        className={`inline-flex items-center gap-2 font-semibold px-8 py-3 rounded-full transition-colors cursor-pointer ${
          selected.size === 0
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : creating
              ? 'bg-[#1DB954]/50 text-black/50 cursor-wait'
              : 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
        }`}
      >
        {creating ? (
          <>
            <span className="animate-spin">🎵</span>
            Creating...
          </>
        ) : (
          <>
            🎧 Spotify me!
            {selected.size > 0 && (
              <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">
                {selected.size}
              </span>
            )}
          </>
        )}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
