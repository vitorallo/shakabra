'use client'

import { useState, useCallback } from 'react'
import { AudioFeatures } from '@/lib/ai-mixing/audio-analysis'

interface UseAudioFeaturesReturn {
  getAudioFeatures: (trackIds: string[]) => Promise<AudioFeatures[]>
  isLoading: boolean
  error: string | null
  clearError: () => void
}

/**
 * Custom hook for fetching audio features from Spotify
 * Handles batch requests and error management
 */
export function useAudioFeatures(): UseAudioFeaturesReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getAudioFeatures = useCallback(async (trackIds: string[]): Promise<AudioFeatures[]> => {
    if (trackIds.length === 0) {
      return []
    }

    try {
      setIsLoading(true)
      setError(null)

      // Spotify API allows up to 100 tracks per request
      const batchSize = 100
      const batches: string[][] = []
      
      for (let i = 0; i < trackIds.length; i += batchSize) {
        batches.push(trackIds.slice(i, i + batchSize))
      }

      const allFeatures: AudioFeatures[] = []

      // Process batches sequentially to avoid rate limiting
      for (const batch of batches) {
        const response = await fetch(`/api/spotify/audio-features?ids=${batch.join(',')}`)
        
        if (!response.ok) {
          // Try to get the error message from the response
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
          
          if (response.status === 401) {
            throw new Error(errorData.error || 'Authentication required. Please log in again.')
          }
          if (response.status === 403) {
            // Use the server's error message which is more accurate
            throw new Error(errorData.error || 'Access denied to audio features.')
          }
          if (response.status === 429) {
            throw new Error(errorData.error || 'Rate limit exceeded. Please try again in a moment.')
          }
          throw new Error(errorData.error || `Failed to fetch audio features: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        // Spotify returns null for tracks without audio features
        const validFeatures = (data.audio_features || []).filter(
          (features: AudioFeatures | null) => features !== null
        ) as AudioFeatures[]

        allFeatures.push(...validFeatures)

        // Add small delay between batches to be respectful to API
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      return allFeatures

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audio features'
      console.error('Audio features error:', errorMessage)
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    getAudioFeatures,
    isLoading,
    error,
    clearError
  }
}

/**
 * Hook for getting audio features for a single track
 */
export function useSingleAudioFeatures() {
  const { getAudioFeatures, isLoading, error, clearError } = useAudioFeatures()
  
  const getSingleFeatures = useCallback(async (trackId: string): Promise<AudioFeatures | null> => {
    const features = await getAudioFeatures([trackId])
    return features.length > 0 ? features[0] : null
  }, [getAudioFeatures])

  return {
    getSingleFeatures,
    isLoading,
    error,
    clearError
  }
}

/**
 * Hook for batch processing playlist tracks with audio features
 */
export function usePlaylistAudioFeatures() {
  const { getAudioFeatures, isLoading, error, clearError } = useAudioFeatures()
  const [progress, setProgress] = useState(0)

  const getPlaylistFeatures = useCallback(async (
    trackIds: string[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<AudioFeatures[]> => {
    setProgress(0)
    
    const batchSize = 50 // Smaller batches for progress tracking
    const batches: string[][] = []
    
    for (let i = 0; i < trackIds.length; i += batchSize) {
      batches.push(trackIds.slice(i, i + batchSize))
    }

    const allFeatures: AudioFeatures[] = []

    for (let i = 0; i < batches.length; i++) {
      const batchFeatures = await getAudioFeatures(batches[i])
      allFeatures.push(...batchFeatures)
      
      const currentProgress = ((i + 1) / batches.length) * 100
      setProgress(currentProgress)
      
      if (onProgress) {
        onProgress(i + 1, batches.length)
      }
    }

    setProgress(100)
    return allFeatures
  }, [getAudioFeatures])

  return {
    getPlaylistFeatures,
    isLoading,
    error,
    progress,
    clearError
  }
}

/**
 * Utility function to validate audio features
 */
export function validateAudioFeatures(features: any): features is AudioFeatures {
  return features &&
    typeof features.acousticness === 'number' &&
    typeof features.danceability === 'number' &&
    typeof features.energy === 'number' &&
    typeof features.instrumentalness === 'number' &&
    typeof features.liveness === 'number' &&
    typeof features.loudness === 'number' &&
    typeof features.speechiness === 'number' &&
    typeof features.valence === 'number' &&
    typeof features.tempo === 'number' &&
    typeof features.key === 'number' &&
    typeof features.mode === 'number' &&
    typeof features.time_signature === 'number' &&
    typeof features.duration_ms === 'number'
}

/**
 * Utility function to create mock audio features for testing
 */
export function createMockAudioFeatures(): AudioFeatures {
  return {
    acousticness: Math.random(),
    danceability: Math.random(),
    energy: Math.random(),
    instrumentalness: Math.random(),
    liveness: Math.random(),
    loudness: -60 + (Math.random() * 60), // -60 to 0 dB
    speechiness: Math.random(),
    valence: Math.random(),
    tempo: 60 + (Math.random() * 140), // 60-200 BPM
    key: Math.floor(Math.random() * 12), // 0-11
    mode: Math.round(Math.random()), // 0 or 1
    time_signature: 4, // Most common
    duration_ms: 180000 + (Math.random() * 120000) // 3-5 minutes
  }
}