'use client'

import { useState, useCallback } from 'react'
import { AudioFeatures } from '@/lib/ai-mixing/audio-analysis'

interface UseTrackAnalysisReturn {
  analyzeTracks: (trackIds: string[]) => Promise<AudioFeatures[]>
  isLoading: boolean
  error: string | null
  clearError: () => void
}

/**
 * Modern track analysis hook that uses intelligent estimation
 * instead of the deprecated audio-features API
 */
export function useTrackAnalysis(): UseTrackAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const analyzeTracks = useCallback(async (trackIds: string[]): Promise<AudioFeatures[]> => {
    if (trackIds.length === 0) {
      return []
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/spotify/analyze-tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackIds }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || `Failed to analyze tracks: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      console.log(`Analyzed ${data.analyzed_count} tracks using ${data.method}`)
      return data.tracks || []

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze tracks'
      console.error('Track analysis error:', errorMessage)
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    analyzeTracks,
    isLoading,
    error,
    clearError
  }
}

/**
 * Hook for analyzing a single track
 */
export function useSingleTrackAnalysis() {
  const { analyzeTracks, isLoading, error, clearError } = useTrackAnalysis()
  
  const analyzeTrack = useCallback(async (trackId: string): Promise<AudioFeatures | null> => {
    const features = await analyzeTracks([trackId])
    return features.length > 0 ? features[0] : null
  }, [analyzeTracks])

  return {
    analyzeTrack,
    isLoading,
    error,
    clearError
  }
}

/**
 * Hook for batch analyzing playlist tracks
 */
export function usePlaylistAnalysis() {
  const { analyzeTracks, isLoading, error, clearError } = useTrackAnalysis()
  const [progress, setProgress] = useState(0)

  const analyzePlaylist = useCallback(async (
    trackIds: string[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<AudioFeatures[]> => {
    setProgress(0)
    
    // Process in reasonable batches
    const batchSize = 50
    const batches: string[][] = []
    
    for (let i = 0; i < trackIds.length; i += batchSize) {
      batches.push(trackIds.slice(i, i + batchSize))
    }

    const allFeatures: AudioFeatures[] = []

    for (let i = 0; i < batches.length; i++) {
      const batchFeatures = await analyzeTracks(batches[i])
      allFeatures.push(...batchFeatures)
      
      const currentProgress = ((i + 1) / batches.length) * 100
      setProgress(currentProgress)
      
      if (onProgress) {
        onProgress(i + 1, batches.length)
      }
    }

    setProgress(100)
    return allFeatures
  }, [analyzeTracks])

  return {
    analyzePlaylist,
    isLoading,
    error,
    progress,
    clearError
  }
}