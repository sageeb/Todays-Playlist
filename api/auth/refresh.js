export default async function handler(req, res) {
  const { refresh_token } = req.query

  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh_token' })
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
    })

    if (!tokenRes.ok) {
      return res.status(401).json({ error: 'Token refresh failed' })
    }

    const tokens = await tokenRes.json()

    // Get updated user profile
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json()

    res.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || refresh_token,
      expires_in: tokens.expires_in,
      user: { displayName: profile.display_name, id: profile.id },
    })
  } catch (err) {
    console.error('Token refresh error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}
