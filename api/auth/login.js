export default function handler(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI
  const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-email',
    'user-read-private',
  ].join(' ')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    show_dialog: 'true',
  })

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
}
