'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AIDJEngine, DJSession, DJSettings, DJTrack, DEFAULT_DJ_SETTINGS } from '@/lib/ai-mixing/dj-engine'
import { AudioFeatures } from '@/lib/ai-mixing/audio-analysis'
import { SpotifyTrack } from '@/lib/spotify'

interface DJState {
  // Core AI DJ Engine
  djEngine: AIDJEngine | null
  currentSession: DJSession | null
  
  // Track Management
  trackPool: DJTrack[]
  currentTrack: DJTrack | null
  nextTrack: DJTrack | null
  playbackHistory: DJTrack[]
  
  // Session State
  isSessionActive: boolean
  sessionStats: {
    tracksPlayed: number
    sessionDuration: number
    averageEnergy: number
    keyTransitions: number
  } | null
  
  // AI Settings
  djSettings: DJSettings
  
  // UI State
  isLoading: boolean
  error: string | null
  showAdvancedSettings: boolean
  
  // Actions
  initializeEngine: (settings?: Partial<DJSettings>) => void
  startSession: (initialTracks: DJTrack[]) => Promise<void>
  endSession: () => void
  getNextTrack: () => Promise<DJTrack | null>
  addTracksToPool: (tracks: SpotifyTrack[], audioFeatures: AudioFeatures[]) => void
  updateDJSettings: (settings: Partial<DJSettings>) => void
  setCurrentTrack: (track: DJTrack | null) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  updateSessionStats: () => void
  clearError: () => void
}

export const useDJStore = create<DJState>()(
  persist(
    (set, get) => ({
      // Initial state
      djEngine: null,
      currentSession: null,
      trackPool: [],
      currentTrack: null,
      nextTrack: null,
      playbackHistory: [],
      isSessionActive: false,
      sessionStats: null,
      djSettings: DEFAULT_DJ_SETTINGS,
      isLoading: false,
      error: null,
      showAdvancedSettings: false,

      // Initialize the AI DJ Engine
      initializeEngine: (settings) => {
        const djSettings = settings ? { ...DEFAULT_DJ_SETTINGS, ...settings } : DEFAULT_DJ_SETTINGS
        const engine = new AIDJEngine(djSettings)
        
        set({
          djEngine: engine,
          djSettings,
          error: null
        })
      },

      // Start a new DJ session
      startSession: async (initialTracks: DJTrack[]) => {
        const { djEngine } = get()
        
        if (!djEngine) {
          set({ error: 'DJ Engine not initialized' })
          return
        }

        try {
          set({ isLoading: true, error: null })
          
          // Start the session
          const session = djEngine.startSession(initialTracks)
          
          // Get the first track
          const firstTrack = djEngine.getCurrentTrack()
          
          // Prepare next track
          const nextTrack = djEngine.getNextTrack()
          
          set({
            currentSession: session,
            isSessionActive: true,
            currentTrack: firstTrack,
            nextTrack,
            trackPool: initialTracks,
            playbackHistory: firstTrack ? [firstTrack] : [],
            isLoading: false
          })

          // Update initial stats
          get().updateSessionStats()

        } catch (error) {
          console.error('Failed to start DJ session:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to start session',
            isLoading: false
          })
        }
      },

      // End the current session
      endSession: () => {
        const { djEngine } = get()
        
        if (djEngine) {
          djEngine.endSession()
        }
        
        set({
          currentSession: null,
          isSessionActive: false,
          currentTrack: null,
          nextTrack: null,
          sessionStats: null
        })
      },

      // Get the next track from AI
      getNextTrack: async () => {
        const { djEngine, currentTrack } = get()
        
        if (!djEngine || !currentTrack) {
          return null
        }

        try {
          set({ isLoading: true, error: null })
          
          const nextTrack = djEngine.getNextTrack()
          
          if (nextTrack) {
            // Update state with new tracks
            set(state => ({
              currentTrack: state.nextTrack, // Move next to current
              nextTrack: nextTrack,          // Set new next track
              playbackHistory: state.nextTrack ? 
                [...state.playbackHistory, state.nextTrack] : 
                state.playbackHistory,
              isLoading: false
            }))

            // Update stats
            get().updateSessionStats()
            
            return nextTrack
          } else {
            set({ 
              error: 'No suitable tracks found for mixing',
              isLoading: false 
            })
            return null
          }

        } catch (error) {
          console.error('Failed to get next track:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to get next track',
            isLoading: false
          })
          return null
        }
      },

      // Add tracks with audio features to the pool
      addTracksToPool: (tracks: SpotifyTrack[], audioFeatures: AudioFeatures[]) => {
        if (tracks.length !== audioFeatures.length) {
          console.error('Tracks and audio features arrays must have the same length')
          return
        }

        const djTracks: DJTrack[] = tracks.map((track, index) => ({
          ...track,
          audioFeatures: audioFeatures[index],
          playCount: 0,
          skipCount: 0,
          userRating: undefined,
          lastPlayed: undefined
        }))

        const { djEngine } = get()
        
        set(state => ({
          trackPool: [...state.trackPool, ...djTracks]
        }))

        // Add to engine if available
        if (djEngine) {
          djEngine.addTracksToPool(djTracks)
        }
      },

      // Update DJ settings
      updateDJSettings: (newSettings) => {
        const updatedSettings = { ...get().djSettings, ...newSettings }
        
        const { djEngine } = get()
        if (djEngine) {
          djEngine.updateSettings(updatedSettings)
        }

        set({ djSettings: updatedSettings })
      },

      // Set current track manually
      setCurrentTrack: (track) => {
        set({ currentTrack: track })
      },

      // Set error message
      setError: (error) => {
        set({ error })
      },

      // Set loading state
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      // Update session statistics
      updateSessionStats: () => {
        const { djEngine } = get()
        if (djEngine) {
          const stats = djEngine.getSessionStats()
          set({ sessionStats: stats })
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'shakabra-dj',
      partialize: (state) => ({
        djSettings: state.djSettings,
        showAdvancedSettings: state.showAdvancedSettings,
        trackPool: state.trackPool.slice(0, 100), // Limit persisted tracks
      }),
    }
  )
)

// Helper hook for DJ session management
export const useDJSession = () => {
  const {
    isSessionActive,
    currentTrack,
    nextTrack,
    sessionStats,
    startSession,
    endSession,
    getNextTrack,
    currentSession
  } = useDJStore()

  return {
    isSessionActive,
    currentTrack,
    nextTrack,
    sessionStats,
    currentSession,
    startSession,
    endSession,
    getNextTrack
  }
}

// Helper hook for DJ settings
export const useDJSettings = () => {
  const {
    djSettings,
    updateDJSettings,
    showAdvancedSettings
  } = useDJStore()

  return {
    djSettings,
    updateDJSettings,
    showAdvancedSettings,
    toggleAdvancedSettings: () => 
      useDJStore.setState(state => ({ 
        showAdvancedSettings: !state.showAdvancedSettings 
      }))
  }
}

// Helper hook for track management
export const useDJTracks = () => {
  const {
    trackPool,
    playbackHistory,
    addTracksToPool,
    isLoading,
    error,
    clearError
  } = useDJStore()

  return {
    trackPool,
    playbackHistory,
    addTracksToPool,
    isLoading,
    error,
    clearError
  }
}