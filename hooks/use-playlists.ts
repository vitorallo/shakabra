'use client'

import { useEffect } from 'react'
import { usePlaylistStore } from '@/stores/playlist-store'
import { useAuth } from '@/hooks/use-auth'

export function usePlaylists() {
  const { isAuthenticated, hasSpotifyToken } = useAuth()
  const {
    playlists,
    selectedPlaylist,
    isLoading,
    error,
    fetchPlaylists,
    setSelectedPlaylist,
    clearPlaylists,
  } = usePlaylistStore()

  // Auto-fetch playlists when user is authenticated
  useEffect(() => {
    if (isAuthenticated && hasSpotifyToken) {
      fetchPlaylists()
    } else {
      clearPlaylists()
    }
  }, [isAuthenticated, hasSpotifyToken, fetchPlaylists, clearPlaylists])

  return {
    playlists,
    selectedPlaylist,
    isLoading,
    error,
    hasPlaylists: playlists.length > 0,
    selectPlaylist: setSelectedPlaylist,
    refetchPlaylists: fetchPlaylists,
  }
}