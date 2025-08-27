'use client'

import { useSession } from 'next-auth/react'
import { useCallback } from 'react'
import type { SpotifyUser, SpotifyPlaylist, SpotifyTrack, SpotifyAudioFeatures } from '@/lib/spotify'

interface UseSpotifyReturn {
  isConnected: boolean
  fetchProfile: () => Promise<SpotifyUser | null>
  fetchPlaylists: (limit?: number, offset?: number) => Promise<{
    items: SpotifyPlaylist[]
    total: number
    limit: number
    offset: number
    next: string | null
  } | null>
  fetchPlaylistTracks: (playlistId: string, limit?: number, offset?: number) => Promise<{
    items: Array<{
      track: SpotifyTrack
      added_at: string
    }>
    total: number
    limit: number
    offset: number
    next: string | null
  } | null>
  fetchAudioFeatures: (trackIds: string[]) => Promise<{
    audio_features: SpotifyAudioFeatures[]
  } | null>
  isLoading: boolean
  error: string | null
}

export function useSpotify(): UseSpotifyReturn {
  const { data: session, status } = useSession()
  
  const isConnected = !!session?.accessToken
  const isLoading = status === 'loading'

  const apiCall = useCallback(async <T>(endpoint: string, options?: RequestInit): Promise<T | null> => {
    if (!isConnected) {
      console.warn('No Spotify connection available')
      return null
    }

    try {
      const response = await fetch(`/api/spotify${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Spotify API error for ${endpoint}:`, error)
      return null
    }
  }, [isConnected])

  const fetchProfile = useCallback(async (): Promise<SpotifyUser | null> => {
    return apiCall<SpotifyUser>('/profile')
  }, [apiCall])

  const fetchPlaylists = useCallback(async (limit = 50, offset = 0) => {
    return apiCall<{
      items: SpotifyPlaylist[]
      total: number
      limit: number
      offset: number
      next: string | null
    }>(`/playlists?limit=${limit}&offset=${offset}`)
  }, [apiCall])

  const fetchPlaylistTracks = useCallback(async (
    playlistId: string, 
    limit = 50, 
    offset = 0
  ) => {
    return apiCall<{
      items: Array<{
        track: SpotifyTrack
        added_at: string
      }>
      total: number
      limit: number
      offset: number
      next: string | null
    }>(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`)
  }, [apiCall])

  const fetchAudioFeatures = useCallback(async (trackIds: string[]) => {
    if (trackIds.length === 0) return null
    
    const idsString = trackIds.join(',')
    return apiCall<{
      audio_features: SpotifyAudioFeatures[]
    }>(`/audio-features?ids=${idsString}`)
  }, [apiCall])

  return {
    isConnected,
    fetchProfile,
    fetchPlaylists,
    fetchPlaylistTracks,
    fetchAudioFeatures,
    isLoading,
    error: session?.error || null,
  }
}