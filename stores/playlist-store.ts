'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpotifyPlaylist } from '@/lib/spotify'

interface PlaylistState {
  // State
  playlists: SpotifyPlaylist[]
  selectedPlaylist: SpotifyPlaylist | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null

  // Actions
  setPlaylists: (playlists: SpotifyPlaylist[]) => void
  setSelectedPlaylist: (playlist: SpotifyPlaylist | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchPlaylists: () => Promise<void>
  clearPlaylists: () => void
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      // Initial state
      playlists: [],
      selectedPlaylist: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      // Actions
      setPlaylists: (playlists) => 
        set({ 
          playlists, 
          lastFetched: Date.now(),
          error: null 
        }),

      setSelectedPlaylist: (playlist) => 
        set({ selectedPlaylist: playlist }),

      setLoading: (loading) => 
        set({ isLoading: loading }),

      setError: (error) => 
        set({ error, isLoading: false }),

      fetchPlaylists: async () => {
        const { isLoading, lastFetched } = get()
        
        // Avoid duplicate requests
        if (isLoading) return
        
        // Cache for 5 minutes
        if (lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) {
          return
        }

        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/spotify/playlists?limit=50')
          
          if (!response.ok) {
            throw new Error(`Failed to fetch playlists: ${response.status}`)
          }

          const data = await response.json()
          
          if (data.error) {
            throw new Error(data.error)
          }

          set({ 
            playlists: data.items || [],
            isLoading: false,
            error: null,
            lastFetched: Date.now()
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch playlists'
          set({ 
            error: errorMessage,
            isLoading: false,
            playlists: []
          })
        }
      },

      clearPlaylists: () => 
        set({ 
          playlists: [], 
          selectedPlaylist: null,
          error: null,
          lastFetched: null
        }),
    }),
    {
      name: 'shakabra-playlists',
      partialize: (state) => ({
        playlists: state.playlists,
        lastFetched: state.lastFetched,
        selectedPlaylist: state.selectedPlaylist,
      }),
    }
  )
)