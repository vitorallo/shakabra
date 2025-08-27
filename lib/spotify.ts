import type { Session } from 'next-auth'

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1'

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: Array<{ url: string; height: number; width: number }>
  country: string
  product: 'free' | 'premium'
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images: Array<{ url: string; height: number; width: number }>
  tracks: {
    total: number
    href: string
  }
  owner: {
    id: string
    display_name: string
  }
  public: boolean
  collaborative: boolean
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{
    id: string
    name: string
  }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
    release_date: string
  }
  duration_ms: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
  popularity: number
  available_markets?: string[]
}

export interface SpotifyAudioFeatures {
  id: string
  danceability: number
  energy: number
  key: number
  loudness: number
  mode: number
  speechiness: number
  acousticness: number
  instrumentalness: number
  liveness: number
  valence: number
  tempo: number
  time_signature: number
  duration_ms: number  // Add missing duration property for compatibility
}

export interface PlaybackState {
  is_playing: boolean
  progress_ms: number
  item: SpotifyTrack | null
  device: {
    id: string
    name: string
    type: string
    volume_percent: number
    is_active: boolean
  }
  shuffle_state: boolean
  repeat_state: 'off' | 'track' | 'context'
}

export class SpotifyAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${SPOTIFY_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = ''
      
      // Check if error text is empty (Spotify sometimes returns empty 403s)
      if (!errorText || errorText.trim() === '') {
        if (response.status === 403) {
          errorMessage = 'Access forbidden. This might be due to market restrictions or invalid track IDs.'
        } else {
          errorMessage = `HTTP ${response.status} with no error details`
        }
      } else {
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error?.message || errorJson.error?.reason || JSON.stringify(errorJson) || errorText
        } catch {
          errorMessage = errorText
        }
      }
      
      console.error(`Spotify API ${endpoint} error:`, response.status, errorMessage)
      throw new Error(`Spotify API error: ${response.status} - ${errorMessage}`)
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T
    }

    // Check if response has JSON content
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      // For non-JSON responses (like queue endpoint sometimes returns a string)
      console.log(`Non-JSON response from ${endpoint}, returning empty object`)
      return {} as T
    }

    return response.json()
  }

  // User Profile
  async getProfile(): Promise<SpotifyUser> {
    return this.request<SpotifyUser>('/me')
  }

  // Playlists
  async getPlaylists(limit = 50, offset = 0): Promise<{
    items: SpotifyPlaylist[]
    total: number
    limit: number
    offset: number
    next: string | null
  }> {
    return this.request(`/me/playlists?limit=${limit}&offset=${offset}`)
  }

  async getPlaylist(id: string): Promise<SpotifyPlaylist> {
    return this.request<SpotifyPlaylist>(`/playlists/${id}`)
  }

  async getPlaylistTracks(id: string, limit = 50, offset = 0): Promise<{
    items: Array<{
      track: SpotifyTrack
      added_at: string
    }>
    total: number
    limit: number
    offset: number
    next: string | null
  }> {
    return this.request(`/playlists/${id}/tracks?limit=${limit}&offset=${offset}`)
  }

  // Tracks
  async getTrack(id: string, market?: string): Promise<SpotifyTrack> {
    const url = market ? `/tracks/${id}?market=${market}` : `/tracks/${id}`
    return this.request<SpotifyTrack>(url)
  }

  async getTracks(ids: string[]): Promise<{
    tracks: SpotifyTrack[]
  }> {
    const idsString = ids.join(',')
    return this.request(`/tracks?ids=${idsString}`)
  }

  // Audio Features (Critical for DJ engine)
  async getAudioFeatures(id: string): Promise<SpotifyAudioFeatures> {
    return this.request<SpotifyAudioFeatures>(`/audio-features/${id}`)
  }

  async getMultipleAudioFeatures(ids: string[]): Promise<{
    audio_features: SpotifyAudioFeatures[]
  }> {
    const idsString = ids.join(',')
    return this.request(`/audio-features?ids=${idsString}`)
  }

  // Playback Control
  async getPlaybackState(): Promise<PlaybackState | null> {
    try {
      return this.request<PlaybackState>('/me/player')
    } catch (error) {
      // No active device returns 204, handle gracefully
      return null
    }
  }

  async play(deviceId?: string, uris?: string[], contextUri?: string): Promise<void> {
    const body: any = {}
    if (uris) body.uris = uris
    if (contextUri) body.context_uri = contextUri

    const url = deviceId ? `/me/player/play?device_id=${deviceId}` : '/me/player/play'
    
    await this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async pause(deviceId?: string): Promise<void> {
    const url = deviceId ? `/me/player/pause?device_id=${deviceId}` : '/me/player/pause'
    await this.request(url, { method: 'PUT' })
  }

  async next(deviceId?: string): Promise<void> {
    const url = deviceId ? `/me/player/next?device_id=${deviceId}` : '/me/player/next'
    await this.request(url, { method: 'POST' })
  }

  async previous(deviceId?: string): Promise<void> {
    const url = deviceId ? `/me/player/previous?device_id=${deviceId}` : '/me/player/previous'
    await this.request(url, { method: 'POST' })
  }

  async setVolume(volume: number, deviceId?: string): Promise<void> {
    const url = deviceId 
      ? `/me/player/volume?volume_percent=${volume}&device_id=${deviceId}`
      : `/me/player/volume?volume_percent=${volume}`
    await this.request(url, { method: 'PUT' })
  }

  async seek(position: number, deviceId?: string): Promise<void> {
    const url = deviceId
      ? `/me/player/seek?position_ms=${position}&device_id=${deviceId}`
      : `/me/player/seek?position_ms=${position}`
    await this.request(url, { method: 'PUT' })
  }

  // Queue Management (Essential for DJ mixing)
  async addToQueue(uri: string, deviceId?: string): Promise<void> {
    const url = deviceId
      ? `/me/player/queue?uri=${encodeURIComponent(uri)}&device_id=${deviceId}`
      : `/me/player/queue?uri=${encodeURIComponent(uri)}`
    await this.request(url, { method: 'POST' })
  }

  // Devices
  async getDevices(): Promise<{
    devices: Array<{
      id: string
      is_active: boolean
      is_private_session: boolean
      is_restricted: boolean
      name: string
      type: string
      volume_percent: number
    }>
  }> {
    return this.request('/me/player/devices')
  }

  async transferPlayback(deviceId: string, play = false): Promise<void> {
    await this.request('/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play,
      }),
    })
  }

  // Recently Played (for recommendations)
  async getRecentlyPlayed(limit = 20): Promise<{
    items: Array<{
      track: SpotifyTrack
      played_at: string
      context: {
        type: string
        href: string
        external_urls: { spotify: string }
        uri: string
      } | null
    }>
    next: string | null
    cursors: {
      after: string
      before: string
    }
    limit: number
    href: string
  }> {
    return this.request(`/me/player/recently-played?limit=${limit}`)
  }

  // Artists
  async getArtist(id: string): Promise<{
    id: string
    name: string
    genres: string[]
    popularity: number
    followers: { total: number }
    images: Array<{ url: string; height: number; width: number }>
  }> {
    return this.request(`/artists/${id}`)
  }

  // Recommendations
  async getRecommendations(params: {
    seed_artists?: string
    seed_genres?: string
    seed_tracks?: string
    limit?: number
    [key: string]: any // For target_* parameters
  }): Promise<{
    tracks: SpotifyTrack[]
    seeds: Array<{
      id: string
      type: string
      href: string
    }>
  }> {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value))
      }
    })
    return this.request(`/recommendations?${queryParams.toString()}`)
  }

  // Search (for finding tracks)
  async search(query: string, types: string[] = ['track'], limit = 20, offset = 0): Promise<{
    tracks?: {
      items: SpotifyTrack[]
      total: number
      limit: number
      offset: number
      next: string | null
    }
    playlists?: {
      items: SpotifyPlaylist[]
      total: number
      limit: number
      offset: number  
      next: string | null
    }
  }> {
    const typeString = types.join(',')
    return this.request(`/search?q=${encodeURIComponent(query)}&type=${typeString}&limit=${limit}&offset=${offset}`)
  }
}

// Helper function to create SpotifyAPI instance from session
export function createSpotifyAPI(session: Session): SpotifyAPI {
  if (!session.accessToken) {
    throw new Error('No Spotify access token found in session')
  }
  
  return new SpotifyAPI(session.accessToken)
}

// Helper function to check if user has premium
export async function checkSpotifyPremium(session: Session): Promise<boolean> {
  try {
    const spotify = createSpotifyAPI(session)
    const profile = await spotify.getProfile()
    return profile.product === 'premium'
  } catch (error) {
    console.error('Error checking Spotify premium status:', error)
    return false
  }
}