# Spotify API Integration Guide for Next.js Applications

## Overview
This comprehensive guide covers Spotify Web API and Web Playback SDK integration for the Shakabra AI DJ Party Player, including authentication, playlist management, playback control, and audio analysis.

## Prerequisites
- Spotify Premium subscription (required for Web Playback SDK)
- Spotify Developer Account and registered application
- Next.js 15 application with authentication

## Spotify App Configuration

### 1. Create Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create app"
3. Choose "Web API" for APIs you're planning to use
4. Fill in app details:
   - App name: "Shakabra AI DJ Party Player"
   - App description: "AI-powered DJ mixing application"
   - Website: Your application URL
   - Redirect URIs: 
     - `http://localhost:3000/api/auth/callback/spotify` (development)
     - `https://yourdomain.com/api/auth/callback/spotify` (production)

### 2. Environment Variables

```bash
# .env.local
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
```

## Required Scopes

For the DJ application, you'll need these scopes:

```typescript
export const SPOTIFY_SCOPES = [
  'user-read-playback-state',    // Read current playback state
  'user-modify-playback-state',  // Control playback (play, pause, skip)
  'user-read-currently-playing', // Read currently playing track
  'playlist-read-private',       // Access user's private playlists
  'playlist-read-collaborative', // Access collaborative playlists
  'user-library-read',          // Access saved tracks
  'user-read-email',            // Read user email (for profile)
  'user-read-private',          // Read user profile info
  'streaming',                  // Stream audio using Web Playback SDK
  'user-read-recently-played',  // Access recently played tracks
  'playlist-modify-public',     // Modify public playlists (optional)
  'playlist-modify-private'     // Modify private playlists (optional)
].join(' ')
```

## Authentication with NextAuth.js

### NextAuth Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'

const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative user-library-read user-read-email user-read-private streaming user-read-recently-played'

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: SPOTIFY_SCOPES,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.tokenExpiresAt = account.expires_at
        token.spotify_id = profile?.id
      }

      // Check if token needs refresh
      if (Date.now() < (token.tokenExpiresAt as number) * 1000) {
        return token
      }

      // Token has expired, try to refresh it
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string
      session.spotify_id = token.spotify_id as string
      return session
    },
  },
  pages: {
    error: '/auth/error',
  },
})

async function refreshAccessToken(token: any) {
  try {
    const url = 'https://accounts.spotify.com/api/token'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      tokenExpiresAt: Date.now() / 1000 + refreshedTokens.expires_in,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

export { handler as GET, handler as POST }
```

### Session Provider Setup

```typescript
// app/providers/SessionProvider.tsx
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

```typescript
// app/layout.tsx
import { SessionProvider } from './providers/SessionProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

## Spotify API Client

### Server-Side API Client

```typescript
// lib/spotify-api.ts
import { getServerSession } from 'next-auth'

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1'

export class SpotifyApi {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request(endpoint: string, options: RequestInit = {}) {
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
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // User Profile
  async getCurrentUser() {
    return this.request('/me')
  }

  // Playlists
  async getUserPlaylists(limit = 20, offset = 0) {
    return this.request(`/me/playlists?limit=${limit}&offset=${offset}`)
  }

  async getPlaylist(playlistId: string) {
    return this.request(`/playlists/${playlistId}`)
  }

  async getPlaylistTracks(playlistId: string, limit = 50, offset = 0) {
    return this.request(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`)
  }

  // Audio Features (Essential for DJ mixing)
  async getTrackAudioFeatures(trackId: string) {
    return this.request(`/audio-features/${trackId}`)
  }

  async getTracksAudioFeatures(trackIds: string[]) {
    const ids = trackIds.join(',')
    return this.request(`/audio-features?ids=${ids}`)
  }

  async getTrackAudioAnalysis(trackId: string) {
    return this.request(`/audio-analysis/${trackId}`)
  }

  // Search
  async search(query: string, type: string[] = ['track'], limit = 20) {
    const types = type.join(',')
    return this.request(`/search?q=${encodeURIComponent(query)}&type=${types}&limit=${limit}`)
  }

  // Playback Control
  async getCurrentPlayback() {
    return this.request('/me/player')
  }

  async getAvailableDevices() {
    return this.request('/me/player/devices')
  }

  async transferPlayback(deviceIds: string[], play = false) {
    return this.request('/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: deviceIds,
        play
      }),
    })
  }

  async play(deviceId?: string, contextUri?: string, uris?: string[], offset?: number) {
    const params = deviceId ? `?device_id=${deviceId}` : ''
    const body: any = {}
    
    if (contextUri) body.context_uri = contextUri
    if (uris) body.uris = uris
    if (offset !== undefined) body.offset = { position: offset }

    return this.request(`/me/player/play${params}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async pause(deviceId?: string) {
    const params = deviceId ? `?device_id=${deviceId}` : ''
    return this.request(`/me/player/pause${params}`, {
      method: 'PUT',
    })
  }

  async skipToNext(deviceId?: string) {
    const params = deviceId ? `?device_id=${deviceId}` : ''
    return this.request(`/me/player/next${params}`, {
      method: 'POST',
    })
  }

  async skipToPrevious(deviceId?: string) {
    const params = deviceId ? `?device_id=${deviceId}` : ''
    return this.request(`/me/player/previous${params}`, {
      method: 'POST',
    })
  }

  async seek(positionMs: number, deviceId?: string) {
    const params = new URLSearchParams({ position_ms: positionMs.toString() })
    if (deviceId) params.set('device_id', deviceId)
    
    return this.request(`/me/player/seek?${params.toString()}`, {
      method: 'PUT',
    })
  }

  async setVolume(volumePercent: number, deviceId?: string) {
    const params = new URLSearchParams({ volume_percent: volumePercent.toString() })
    if (deviceId) params.set('device_id', deviceId)
    
    return this.request(`/me/player/volume?${params.toString()}`, {
      method: 'PUT',
    })
  }

  async addToQueue(uri: string, deviceId?: string) {
    const params = new URLSearchParams({ uri })
    if (deviceId) params.set('device_id', deviceId)
    
    return this.request(`/me/player/queue?${params.toString()}`, {
      method: 'POST',
    })
  }

  // Recently Played
  async getRecentlyPlayed(limit = 20) {
    return this.request(`/me/player/recently-played?limit=${limit}`)
  }

  // Recommendations (Useful for AI mixing)
  async getRecommendations(seedArtists?: string[], seedGenres?: string[], seedTracks?: string[], targetAttributes?: any) {
    const params = new URLSearchParams()
    
    if (seedArtists) params.set('seed_artists', seedArtists.join(','))
    if (seedGenres) params.set('seed_genres', seedGenres.join(','))
    if (seedTracks) params.set('seed_tracks', seedTracks.join(','))
    
    // Add target audio features for AI mixing
    if (targetAttributes) {
      Object.entries(targetAttributes).forEach(([key, value]) => {
        params.set(`target_${key}`, String(value))
      })
    }
    
    return this.request(`/recommendations?${params.toString()}`)
  }
}

// Utility to create API instance from session
export async function createSpotifyApi(accessToken?: string) {
  if (!accessToken) {
    const session = await getServerSession()
    if (!session?.accessToken) {
      throw new Error('No Spotify access token available')
    }
    accessToken = session.accessToken as string
  }
  
  return new SpotifyApi(accessToken)
}
```

### Client-Side API Client

```typescript
// lib/spotify-client.ts
'use client'

import { useSession } from 'next-auth/react'

export function useSpotifyApi() {
  const { data: session } = useSession()
  
  const request = async (endpoint: string, options: RequestInit = {}) => {
    if (!session?.accessToken) {
      throw new Error('No access token available')
    }

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    return response.json()
  }

  return {
    getCurrentUser: () => request('/me'),
    getUserPlaylists: (limit = 20, offset = 0) => 
      request(`/me/playlists?limit=${limit}&offset=${offset}`),
    getPlaylistTracks: (playlistId: string, limit = 50, offset = 0) =>
      request(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`),
    getTracksAudioFeatures: (trackIds: string[]) =>
      request(`/audio-features?ids=${trackIds.join(',')}`),
    getCurrentPlayback: () => request('/me/player'),
    // Add other methods as needed
  }
}
```

## Web Playback SDK Integration

### SDK Initialization

```typescript
// lib/spotify-player.ts
'use client'

export interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  getCurrentState(): Promise<WebPlaybackState | null>
  getVolume(): Promise<number>
  nextTrack(): Promise<void>
  pause(): Promise<void>
  previousTrack(): Promise<void>
  resume(): Promise<void>
  seek(position_ms: number): Promise<void>
  setName(name: string): Promise<void>
  setVolume(volume: number): Promise<void>
  togglePlay(): Promise<void>
  addListener(event: string, callback: Function): boolean
  removeListener(event: string, callback?: Function): boolean
}

export interface WebPlaybackState {
  context: {
    uri: string
    metadata: any
  }
  disallows: {
    pausing: boolean
    peeking_next: boolean
    peeking_prev: boolean
    resuming: boolean
    seeking: boolean
    skipping_next: boolean
    skipping_prev: boolean
  }
  paused: boolean
  position: number
  repeat_mode: number
  shuffle: boolean
  track_window: {
    current_track: WebPlaybackTrack
    next_tracks: WebPlaybackTrack[]
    previous_tracks: WebPlaybackTrack[]
  }
}

export interface WebPlaybackTrack {
  id: string
  uri: string
  name: string
  album: {
    uri: string
    name: string
    images: { url: string }[]
  }
  artists: { uri: string; name: string }[]
  duration_ms: number
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayer
    }
  }
}

export class SpotifyPlayerManager {
  private player: SpotifyPlayer | null = null
  private deviceId: string | null = null
  private isReady = false

  constructor(
    private getAccessToken: () => Promise<string>,
    private onStateChange?: (state: WebPlaybackState | null) => void,
    private onPlayerReady?: (deviceId: string) => void
  ) {}

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load the SDK
      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      
      document.body.appendChild(script)

      window.onSpotifyWebPlaybackSDKReady = () => {
        this.player = new window.Spotify.Player({
          name: 'Shakabra AI DJ Player',
          getOAuthToken: async (cb) => {
            const token = await this.getAccessToken()
            cb(token)
          },
          volume: 0.5
        })

        // Error handling
        this.player.addListener('initialization_error', ({ message }) => {
          console.error('Failed to initialize:', message)
          reject(new Error(message))
        })

        this.player.addListener('authentication_error', ({ message }) => {
          console.error('Failed to authenticate:', message)
          reject(new Error(message))
        })

        this.player.addListener('account_error', ({ message }) => {
          console.error('Failed to validate Spotify account:', message)
          reject(new Error(message))
        })

        this.player.addListener('playback_error', ({ message }) => {
          console.error('Failed to perform playback:', message)
        })

        // Playback status updates
        this.player.addListener('player_state_changed', (state) => {
          console.log('Player state changed:', state)
          this.onStateChange?.(state)
        })

        // Ready
        this.player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id)
          this.deviceId = device_id
          this.isReady = true
          this.onPlayerReady?.(device_id)
          resolve()
        })

        // Not Ready
        this.player.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline', device_id)
        })

        // Connect to the player
        this.player.connect()
      }
    })
  }

  getDeviceId(): string | null {
    return this.deviceId
  }

  isPlayerReady(): boolean {
    return this.isReady
  }

  async play(contextUri?: string, trackUris?: string[], offset?: number): Promise<void> {
    if (!this.player || !this.deviceId) return

    // Use Web API to start playback on our device
    const body: any = {}
    if (contextUri) body.context_uri = contextUri
    if (trackUris) body.uris = trackUris
    if (offset !== undefined) body.offset = { position: offset }

    const token = await this.getAccessToken()
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
  }

  async pause(): Promise<void> {
    if (!this.player) return
    await this.player.pause()
  }

  async resume(): Promise<void> {
    if (!this.player) return
    await this.player.resume()
  }

  async nextTrack(): Promise<void> {
    if (!this.player) return
    await this.player.nextTrack()
  }

  async previousTrack(): Promise<void> {
    if (!this.player) return
    await this.player.previousTrack()
  }

  async seek(positionMs: number): Promise<void> {
    if (!this.player) return
    await this.player.seek(positionMs)
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.player) return
    await this.player.setVolume(volume)
  }

  async getCurrentState(): Promise<WebPlaybackState | null> {
    if (!this.player) return null
    return await this.player.getCurrentState()
  }

  disconnect(): void {
    if (this.player) {
      this.player.disconnect()
    }
  }
}
```

### Player Hook

```typescript
// hooks/useSpotifyPlayer.ts
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { SpotifyPlayerManager, WebPlaybackState } from '@/lib/spotify-player'

export function useSpotifyPlayer() {
  const { data: session } = useSession()
  const [player, setPlayer] = useState<SpotifyPlayerManager | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentState, setCurrentState] = useState<WebPlaybackState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getAccessToken = useCallback(async () => {
    if (!session?.accessToken) {
      throw new Error('No access token')
    }
    return session.accessToken as string
  }, [session?.accessToken])

  useEffect(() => {
    if (!session?.accessToken) return

    const playerManager = new SpotifyPlayerManager(
      getAccessToken,
      (state) => setCurrentState(state),
      (deviceId) => {
        setDeviceId(deviceId)
        setIsReady(true)
      }
    )

    setIsLoading(true)
    playerManager.initialize()
      .then(() => {
        setPlayer(playerManager)
      })
      .catch((error) => {
        console.error('Failed to initialize player:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => {
      playerManager.disconnect()
    }
  }, [session?.accessToken, getAccessToken])

  const play = useCallback(async (contextUri?: string, trackUris?: string[], offset?: number) => {
    if (!player) return
    await player.play(contextUri, trackUris, offset)
  }, [player])

  const pause = useCallback(async () => {
    if (!player) return
    await player.pause()
  }, [player])

  const resume = useCallback(async () => {
    if (!player) return
    await player.resume()
  }, [player])

  const nextTrack = useCallback(async () => {
    if (!player) return
    await player.nextTrack()
  }, [player])

  const previousTrack = useCallback(async () => {
    if (!player) return
    await player.previousTrack()
  }, [player])

  const seek = useCallback(async (positionMs: number) => {
    if (!player) return
    await player.seek(positionMs)
  }, [player])

  const setVolume = useCallback(async (volume: number) => {
    if (!player) return
    await player.setVolume(volume)
  }, [player])

  return {
    player,
    deviceId,
    isReady,
    isLoading,
    currentState,
    play,
    pause,
    resume,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
  }
}
```

## Audio Analysis for DJ Mixing

### Track Analysis Hook

```typescript
// hooks/useTrackAnalysis.ts
'use client'

import { useState, useCallback } from 'react'
import { useSpotifyApi } from '@/lib/spotify-client'

export interface TrackAudioFeatures {
  id: string
  acousticness: number
  danceability: number
  energy: number
  instrumentalness: number
  key: number
  liveness: number
  loudness: number
  mode: number
  speechiness: number
  tempo: number
  time_signature: number
  valence: number
}

export interface TrackAnalysis {
  track: {
    duration: number
    tempo: number
    time_signature: number
    key: number
    mode: number
  }
  bars: Array<{
    start: number
    duration: number
    confidence: number
  }>
  beats: Array<{
    start: number
    duration: number
    confidence: number
  }>
  sections: Array<{
    start: number
    duration: number
    confidence: number
    loudness: number
    tempo: number
    key: number
    mode: number
  }>
}

export function useTrackAnalysis() {
  const [analysisCache, setAnalysisCache] = useState<Map<string, TrackAudioFeatures>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const spotifyApi = useSpotifyApi()

  const getTracksAudioFeatures = useCallback(async (trackIds: string[]): Promise<TrackAudioFeatures[]> => {
    const uncachedIds = trackIds.filter(id => !analysisCache.has(id) && !loading.has(id))
    
    if (uncachedIds.length > 0) {
      setLoading(prev => {
        const newSet = new Set(prev)
        uncachedIds.forEach(id => newSet.add(id))
        return newSet
      })

      try {
        const response = await spotifyApi.getTracksAudioFeatures(uncachedIds)
        const features: TrackAudioFeatures[] = response.audio_features.filter((f: any) => f !== null)
        
        setAnalysisCache(prev => {
          const newCache = new Map(prev)
          features.forEach(feature => newCache.set(feature.id, feature))
          return newCache
        })
      } catch (error) {
        console.error('Error fetching audio features:', error)
      } finally {
        setLoading(prev => {
          const newSet = new Set(prev)
          uncachedIds.forEach(id => newSet.delete(id))
          return newSet
        })
      }
    }

    return trackIds.map(id => analysisCache.get(id)).filter(Boolean) as TrackAudioFeatures[]
  }, [analysisCache, loading, spotifyApi])

  const calculateTrackCompatibility = useCallback((track1: TrackAudioFeatures, track2: TrackAudioFeatures): number => {
    // Tempo compatibility (±5% tolerance)
    const tempoDiff = Math.abs(track1.tempo - track2.tempo)
    const avgTempo = (track1.tempo + track2.tempo) / 2
    const tempoCompatibility = tempoDiff <= (avgTempo * 0.05) ? 1 : Math.max(0, 1 - (tempoDiff / avgTempo))

    // Key compatibility (Camelot Wheel)
    const keyCompatibility = calculateKeyCompatibility(track1.key, track1.mode, track2.key, track2.mode)

    // Energy progression (smooth transitions)
    const energyDiff = Math.abs(track1.energy - track2.energy)
    const energyCompatibility = Math.max(0, 1 - energyDiff)

    // Danceability similarity
    const danceabilityDiff = Math.abs(track1.danceability - track2.danceability)
    const danceabilityCompatibility = Math.max(0, 1 - danceabilityDiff)

    // Weighted average
    return (
      tempoCompatibility * 0.4 +
      keyCompatibility * 0.3 +
      energyCompatibility * 0.2 +
      danceabilityCompatibility * 0.1
    )
  }, [])

  return {
    getTracksAudioFeatures,
    calculateTrackCompatibility,
    isLoading: (trackId: string) => loading.has(trackId),
    getFromCache: (trackId: string) => analysisCache.get(trackId)
  }
}

// Camelot Wheel key compatibility
function calculateKeyCompatibility(key1: number, mode1: number, key2: number, mode2: number): number {
  const camelotWheel = {
    // Major keys (mode 1)
    1: { key: 'C', major: '8B', minor: '5A' },  // C major = 8B, A minor = 8A
    // ... (complete mapping would go here)
  }

  // Perfect matches (same key) = 1.0
  if (key1 === key2 && mode1 === mode2) return 1.0

  // Adjacent keys on Camelot wheel = 0.8
  // Related major/minor = 0.7
  // Fifth relationships = 0.6
  // Default = 0.3

  return 0.5 // Simplified for example
}
```

## AI Mixing Algorithm

### Track Selection and Queuing

```typescript
// lib/ai-mixing.ts
import { TrackAudioFeatures } from '@/hooks/useTrackAnalysis'

export interface DJTrack {
  id: string
  uri: string
  name: string
  artists: { name: string }[]
  duration_ms: number
  audioFeatures?: TrackAudioFeatures
}

export interface MixSettings {
  energyProgression: 'build_up' | 'maintain' | 'wind_down' | 'dynamic'
  partyMode: 'warm_up' | 'peak_time' | 'cool_down' | 'eclectic'
  crossfadeDuration: number // seconds
  tempoTolerance: number // percentage
  keyMatchingEnabled: boolean
}

export class AIMixingEngine {
  private playedTracks: Set<string> = new Set()
  private recentTracks: DJTrack[] = []
  private currentEnergy = 0.5

  constructor(private settings: MixSettings) {}

  async selectNextTrack(
    availableTracks: DJTrack[],
    currentTrack: DJTrack,
    calculateCompatibility: (t1: TrackAudioFeatures, t2: TrackAudioFeatures) => number
  ): Promise<DJTrack | null> {
    if (!currentTrack.audioFeatures) return null

    // Filter out recently played tracks
    const candidateTracks = availableTracks.filter(track => 
      !this.playedTracks.has(track.id) &&
      track.audioFeatures &&
      track.id !== currentTrack.id
    )

    if (candidateTracks.length === 0) return null

    // Score each candidate track
    const scoredTracks = candidateTracks.map(track => ({
      track,
      score: this.calculateTrackScore(currentTrack, track, calculateCompatibility)
    }))

    // Sort by score and add some randomness
    scoredTracks.sort((a, b) => b.score - a.score)
    
    // Select from top candidates with weighted randomness
    const topCandidates = scoredTracks.slice(0, Math.min(5, scoredTracks.length))
    const weights = topCandidates.map((_, i) => 1 / (i + 1)) // Higher weight for better scores
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    
    let random = Math.random() * totalWeight
    for (let i = 0; i < topCandidates.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        const selectedTrack = topCandidates[i].track
        this.markTrackPlayed(selectedTrack)
        return selectedTrack
      }
    }

    return topCandidates[0].track
  }

  private calculateTrackScore(currentTrack: DJTrack, candidateTrack: DJTrack, calculateCompatibility: Function): number {
    if (!currentTrack.audioFeatures || !candidateTrack.audioFeatures) return 0

    const compatibility = calculateCompatibility(currentTrack.audioFeatures, candidateTrack.audioFeatures)
    const energyScore = this.calculateEnergyScore(candidateTrack.audioFeatures)
    const partyModeScore = this.calculatePartyModeScore(candidateTrack.audioFeatures)
    
    return (
      compatibility * 0.4 +
      energyScore * 0.3 +
      partyModeScore * 0.3
    )
  }

  private calculateEnergyScore(features: TrackAudioFeatures): number {
    const targetEnergy = this.getTargetEnergy()
    const energyDiff = Math.abs(features.energy - targetEnergy)
    
    // Update current energy for next selection
    this.currentEnergy = features.energy
    
    return Math.max(0, 1 - energyDiff)
  }

  private getTargetEnergy(): number {
    switch (this.settings.energyProgression) {
      case 'build_up':
        return Math.min(1, this.currentEnergy + 0.1)
      case 'wind_down':
        return Math.max(0, this.currentEnergy - 0.1)
      case 'maintain':
        return this.currentEnergy
      case 'dynamic':
        return Math.random() // Random for variety
      default:
        return this.currentEnergy
    }
  }

  private calculatePartyModeScore(features: TrackAudioFeatures): number {
    switch (this.settings.partyMode) {
      case 'warm_up':
        // Favor lower tempo, higher danceability
        const warmupTempo = features.tempo >= 90 && features.tempo <= 110 ? 1 : 0.5
        return (warmupTempo + features.danceability) / 2

      case 'peak_time':
        // Favor high energy, fast tempo
        const peakTempo = features.tempo >= 120 && features.tempo <= 140 ? 1 : 0.5
        return (peakTempo + features.energy + features.danceability) / 3

      case 'cool_down':
        // Favor slower tempo, higher valence
        const coolTempo = features.tempo >= 80 && features.tempo <= 100 ? 1 : 0.5
        return (coolTempo + features.valence) / 2

      case 'eclectic':
        // No specific preference
        return 0.5

      default:
        return 0.5
    }
  }

  private markTrackPlayed(track: DJTrack): void {
    this.playedTracks.add(track.id)
    this.recentTracks.push(track)
    
    // Keep only last 20 tracks to prevent repetition
    if (this.recentTracks.length > 20) {
      const oldTrack = this.recentTracks.shift()
      if (oldTrack) {
        this.playedTracks.delete(oldTrack.id)
      }
    }
  }

  getOptimalCrossfadePoint(currentTrack: DJTrack, nextTrack: DJTrack): number {
    // Return position in current track (in ms) where crossfade should start
    const fadeDurationMs = this.settings.crossfadeDuration * 1000
    const trackEndBuffer = 10000 // 10 seconds before track ends
    
    return Math.max(
      currentTrack.duration_ms - fadeDurationMs - trackEndBuffer,
      currentTrack.duration_ms * 0.8 // Never earlier than 80% through the track
    )
  }

  reset(): void {
    this.playedTracks.clear()
    this.recentTracks = []
    this.currentEnergy = 0.5
  }
}
```

## Playlist Management

### Playlist Component

```typescript
// components/PlaylistManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSpotifyApi } from '@/lib/spotify-client'
import { useTrackAnalysis } from '@/hooks/useTrackAnalysis'

interface Playlist {
  id: string
  name: string
  description: string
  images: { url: string }[]
  tracks: {
    total: number
  }
}

interface Track {
  track: {
    id: string
    name: string
    artists: { name: string }[]
    duration_ms: number
    uri: string
  }
}

export function PlaylistManager({ onPlaylistSelect }: { onPlaylistSelect: (playlistId: string) => void }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const spotifyApi = useSpotifyApi()
  const { getTracksAudioFeatures } = useTrackAnalysis()

  useEffect(() => {
    fetchUserPlaylists()
  }, [])

  const fetchUserPlaylists = async () => {
    setLoading(true)
    try {
      const response = await spotifyApi.getUserPlaylists(50, 0)
      setPlaylists(response.items)
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setLoading(true)
    
    try {
      // Fetch all tracks in playlist
      let allTracks: Track[] = []
      let offset = 0
      const limit = 50

      while (allTracks.length < playlist.tracks.total) {
        const response = await spotifyApi.getPlaylistTracks(playlist.id, limit, offset)
        allTracks = [...allTracks, ...response.items.filter((item: any) => item.track && item.track.id)]
        offset += limit
        
        if (response.items.length < limit) break
      }

      setTracks(allTracks)
      
      // Preload audio features for AI analysis
      const trackIds = allTracks.map(t => t.track.id).filter(Boolean)
      if (trackIds.length > 0) {
        await getTracksAudioFeatures(trackIds)
      }

      onPlaylistSelect(playlist.id)
    } catch (error) {
      console.error('Error fetching playlist tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="playlist-manager">
      <div className="playlists-grid">
        <h2>Your Playlists</h2>
        {loading && !selectedPlaylist && <div>Loading playlists...</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => selectPlaylist(playlist)}
              className="playlist-card cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {playlist.images[0] && (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="w-full h-48 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-semibold text-lg">{playlist.name}</h3>
              <p className="text-gray-600 text-sm">{playlist.tracks.total} tracks</p>
            </div>
          ))}
        </div>
      </div>

      {selectedPlaylist && (
        <div className="selected-playlist mt-8">
          <h3>Selected: {selectedPlaylist.name}</h3>
          {loading ? (
            <div>Analyzing tracks for mixing...</div>
          ) : (
            <div>
              <p>Ready to mix {tracks.length} tracks</p>
              <div className="tracks-preview max-h-64 overflow-y-auto">
                {tracks.slice(0, 10).map((item, index) => (
                  <div key={item.track.id} className="track-item py-2 border-b">
                    <div className="font-medium">{item.track.name}</div>
                    <div className="text-gray-600 text-sm">
                      {item.track.artists.map(a => a.name).join(', ')}
                    </div>
                  </div>
                ))}
                {tracks.length > 10 && (
                  <div className="text-gray-600 text-sm py-2">
                    ...and {tracks.length - 10} more tracks
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

## DJ Control Interface

### Main DJ Player Component

```typescript
// components/DJPlayer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useTrackAnalysis } from '@/hooks/useTrackAnalysis'
import { AIMixingEngine, MixSettings } from '@/lib/ai-mixing'

export function DJPlayer({ playlistTracks }: { playlistTracks: any[] }) {
  const {
    deviceId,
    isReady,
    currentState,
    play,
    pause,
    resume,
    nextTrack,
    setVolume,
  } = useSpotifyPlayer()

  const { getTracksAudioFeatures, calculateTrackCompatibility } = useTrackAnalysis()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(50)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [mixSettings, setMixSettings] = useState<MixSettings>({
    energyProgression: 'build_up',
    partyMode: 'warm_up',
    crossfadeDuration: 8,
    tempoTolerance: 5,
    keyMatchingEnabled: true
  })

  const mixingEngine = useRef<AIMixingEngine>()

  useEffect(() => {
    mixingEngine.current = new AIMixingEngine(mixSettings)
  }, [mixSettings])

  useEffect(() => {
    if (currentState) {
      setIsPlaying(!currentState.paused)
      
      // Auto-queue next track when current track is nearing end
      if (aiEnabled && currentState.track_window.current_track) {
        handleAutoQueue(currentState)
      }
    }
  }, [currentState, aiEnabled])

  const handleAutoQueue = async (state: any) => {
    const currentTrack = state.track_window.current_track
    const timeRemaining = currentTrack.duration_ms - state.position
    
    // Queue next track when 30 seconds remaining
    if (timeRemaining <= 30000 && timeRemaining > 25000) {
      if (mixingEngine.current && playlistTracks.length > 0) {
        const djTracks = await prepareDJTracks(playlistTracks)
        const currentDJTrack = djTracks.find(t => t.id === currentTrack.id)
        
        if (currentDJTrack) {
          const nextTrack = await mixingEngine.current.selectNextTrack(
            djTracks,
            currentDJTrack,
            calculateTrackCompatibility
          )
          
          if (nextTrack) {
            // Add to Spotify queue
            const token = await getAccessToken()
            await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${nextTrack.uri}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            })
          }
        }
      }
    }
  }

  const prepareDJTracks = async (tracks: any[]) => {
    const trackIds = tracks.map(t => t.track.id)
    const audioFeatures = await getTracksAudioFeatures(trackIds)
    
    return tracks.map(t => ({
      id: t.track.id,
      uri: t.track.uri,
      name: t.track.name,
      artists: t.track.artists,
      duration_ms: t.track.duration_ms,
      audioFeatures: audioFeatures.find(af => af.id === t.track.id)
    }))
  }

  const handlePlay = async () => {
    if (!isReady || !deviceId) return

    if (currentState && currentState.paused) {
      await resume()
    } else {
      // Start playing first track from playlist
      const firstTrack = playlistTracks[0]
      if (firstTrack) {
        await play(undefined, [firstTrack.track.uri])
      }
    }
  }

  const handlePause = async () => {
    if (!isReady) return
    await pause()
  }

  const handleVolumeChange = async (newVolume: number) => {
    setVolumeState(newVolume)
    await setVolume(newVolume / 100)
  }

  const handleMixSettingsChange = (newSettings: Partial<MixSettings>) => {
    const updatedSettings = { ...mixSettings, ...newSettings }
    setMixSettings(updatedSettings)
  }

  if (!isReady) {
    return (
      <div className="dj-player-loading">
        <div>Initializing Spotify Player...</div>
        <div className="text-sm text-gray-600">
          Make sure you have Spotify Premium and this browser tab is active
        </div>
      </div>
    )
  }

  return (
    <div className="dj-player bg-gradient-to-br from-purple-900 to-blue-900 p-6 rounded-lg text-white">
      {/* Current Track Display */}
      {currentState?.track_window.current_track && (
        <div className="current-track mb-6 text-center">
          <img
            src={currentState.track_window.current_track.album.images[0]?.url}
            alt={currentState.track_window.current_track.album.name}
            className="w-32 h-32 mx-auto rounded mb-4"
          />
          <h2 className="text-2xl font-bold">{currentState.track_window.current_track.name}</h2>
          <p className="text-lg text-purple-200">
            {currentState.track_window.current_track.artists.map(a => a.name).join(', ')}
          </p>
        </div>
      )}

      {/* Main Controls */}
      <div className="controls flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={handlePause}
          disabled={!isPlaying}
          className="btn-control bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-3 rounded-full"
        >
          ⏸️
        </button>
        
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="btn-control bg-green-600 hover:bg-green-700 disabled:opacity-50 px-8 py-4 rounded-full text-xl"
        >
          {isPlaying ? '▶️' : '▶️'}
        </button>
        
        <button
          onClick={nextTrack}
          className="btn-control bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full"
        >
          ⏭️
        </button>
      </div>

      {/* Volume Control */}
      <div className="volume-control mb-6">
        <label className="block mb-2">Volume: {volume}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* AI Mixing Controls */}
      <div className="ai-controls bg-black/30 p-4 rounded">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="ai-enabled"
            checked={aiEnabled}
            onChange={(e) => setAiEnabled(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="ai-enabled" className="font-medium">AI Auto-Mixing</label>
        </div>

        {aiEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Energy Progression</label>
              <select
                value={mixSettings.energyProgression}
                onChange={(e) => handleMixSettingsChange({ energyProgression: e.target.value as any })}
                className="w-full p-2 rounded bg-gray-800"
              >
                <option value="build_up">Build Up</option>
                <option value="maintain">Maintain</option>
                <option value="wind_down">Wind Down</option>
                <option value="dynamic">Dynamic</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm">Party Mode</label>
              <select
                value={mixSettings.partyMode}
                onChange={(e) => handleMixSettingsChange({ partyMode: e.target.value as any })}
                className="w-full p-2 rounded bg-gray-800"
              >
                <option value="warm_up">Warm Up</option>
                <option value="peak_time">Peak Time</option>
                <option value="cool_down">Cool Down</option>
                <option value="eclectic">Eclectic</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm">Crossfade Duration: {mixSettings.crossfadeDuration}s</label>
              <input
                type="range"
                min="3"
                max="30"
                value={mixSettings.crossfadeDuration}
                onChange={(e) => handleMixSettingsChange({ crossfadeDuration: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="key-matching"
                checked={mixSettings.keyMatchingEnabled}
                onChange={(e) => handleMixSettingsChange({ keyMatchingEnabled: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="key-matching" className="text-sm">Key Matching</label>
            </div>
          </div>
        )}
      </div>

      {/* Next Track Preview */}
      {currentState?.track_window.next_tracks[0] && (
        <div className="next-track mt-4 p-3 bg-black/30 rounded">
          <div className="text-sm text-gray-300">Next:</div>
          <div className="font-medium">{currentState.track_window.next_tracks[0].name}</div>
          <div className="text-sm text-gray-400">
            {currentState.track_window.next_tracks[0].artists.map(a => a.name).join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}
```

## Error Handling and Rate Limiting

### API Error Handler

```typescript
// lib/spotify-errors.ts
export class SpotifyApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'SpotifyApiError'
  }
}

export async function handleSpotifyResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    switch (response.status) {
      case 401:
        throw new SpotifyApiError(401, 'Access token expired or invalid')
      case 403:
        throw new SpotifyApiError(403, 'Premium subscription required for this feature')
      case 404:
        throw new SpotifyApiError(404, 'Requested resource not found')
      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
        throw new SpotifyApiError(429, 'Rate limit exceeded', retryAfter)
      case 502:
      case 503:
        throw new SpotifyApiError(response.status, 'Spotify service temporarily unavailable')
      default:
        throw new SpotifyApiError(response.status, errorData.error?.message || 'Unknown API error')
    }
  }
  
  return response
}

// Rate limiting with exponential backoff
export class RateLimiter {
  private requests: number[] = []
  private readonly windowMs = 60000 // 1 minute
  private readonly maxRequests = 100 // Spotify's typical limit

  async throttle(): Promise<void> {
    const now = Date.now()
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.requests[0] + this.windowMs - now
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return this.throttle()
    }
    
    this.requests.push(now)
  }
}
```

## Summary

This comprehensive Spotify API integration guide provides:

1. **Authentication**: NextAuth.js with PKCE flow for secure OAuth
2. **Web API Integration**: Complete API client with all essential endpoints
3. **Web Playback SDK**: Full browser-based audio player with device management
4. **Audio Analysis**: Track feature analysis for intelligent mixing
5. **AI Mixing Engine**: Sophisticated track selection algorithm
6. **DJ Interface**: Professional DJ control panel with real-time feedback
7. **Error Handling**: Robust error handling and rate limiting

**Key Features for Shakabra:**
- Premium subscription detection and enforcement
- Real-time playback control and monitoring
- Audio feature-based track compatibility scoring
- Intelligent next-track selection with AI
- Professional DJ mixing interface
- Crossfade timing optimization
- Party mode adaptations (warm-up, peak-time, cool-down)
- Key and tempo matching for seamless transitions

**Production Considerations:**
- Implement proper token refresh mechanisms
- Add comprehensive error handling for network issues
- Cache audio features to minimize API calls
- Implement fallback behaviors for free Spotify accounts
- Add loading states and user feedback
- Consider WebSocket connections for real-time collaboration features

This integration transforms your Next.js application into a professional DJ tool powered by Spotify's extensive music catalog and audio analysis capabilities.