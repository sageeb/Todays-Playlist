export default async function handler(req, res) {
  const { code, error } = req.query

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return res.redirect('/?error=no_code')
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const errData = await tokenRes.text()
      console.error('Token exchange failed:', errData)
      return res.redirect('/?error=token_exchange_failed')
    }

    const tokens = await tokenRes.json()

    // Get user profile
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const profile = await profileRes.json()

    // Redirect to frontend with tokens as query params
    const params = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: String(tokens.expires_in),
      display_name: profile.display_name || '',
      user_id: profile.id,
    })

    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '')
    res.redirect(`${frontendUrl}/callback?${params.toString()}`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    res.redirect('/?error=server_error')
  }
}
