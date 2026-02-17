// Extract Spotify user ID from access token
export async function getSpotifyUserId(accessToken) {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to get Spotify user')
  const data = await res.json()
  return data.id
}

// Search Spotify for a track
export async function searchTrack(query, accessToken) {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: '1',
  })

  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return null

  const data = await res.json()
  const track = data.tracks?.items?.[0]

  if (!track) return null

  return {
    spotifyUri: track.uri,
    albumArt: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null,
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls?.spotify,
  }
}
