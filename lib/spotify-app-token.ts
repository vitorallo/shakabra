// Client Credentials flow for app-only endpoints
// This is used for endpoints that don't require user context

let cachedAppToken: { token: string; expiresAt: number } | null = null

export async function getSpotifyAppToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedAppToken && Date.now() < cachedAppToken.expiresAt) {
    return cachedAppToken.token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify client credentials not configured')
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error(`Failed to get app token: ${response.status}`)
    }

    const data = await response.json()

    // Cache the token with 5 minute buffer before expiry
    cachedAppToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000
    }

    console.log('Successfully obtained Spotify app token')
    return data.access_token
  } catch (error) {
    console.error('Error getting Spotify app token:', error)
    throw error
  }
}