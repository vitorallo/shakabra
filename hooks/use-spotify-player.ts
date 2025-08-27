'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'

// Extend Session type to include accessToken
interface ExtendedSession extends Session {
  accessToken?: string
}

// Spotify Web Playback SDK Types
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (callback: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayer
    }
  }
}

interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, callback: (...args: any[]) => void): void
  removeListener(event: string, callback?: (...args: any[]) => void): void
  getCurrentState(): Promise<SpotifyPlayerState | null>
  setName(name: string): Promise<void>
  getVolume(): Promise<number>
  setVolume(volume: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  seek(position_ms: number): Promise<void>
  previousTrack(): Promise<void>
  nextTrack(): Promise<void>
}

interface SpotifyPlayerState {
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
    current_track: SpotifyTrack
    previous_tracks: SpotifyTrack[]
    next_tracks: SpotifyTrack[]
  }
}

interface SpotifyTrack {
  id: string
  uri: string
  name: string
  artists: Array<{ name: string; uri: string }>
  album: {
    name: string
    uri: string
    images: Array<{ url: string; height: number; width: number }>
  }
  duration_ms: number
}

interface UseSpotifyPlayerReturn {
  // Player state
  player: SpotifyPlayer | null
  isReady: boolean
  isActive: boolean
  isPaused: boolean
  currentTrack: SpotifyTrack | null
  position: number
  duration: number
  volume: number
  deviceId: string | null
  
  // Player controls
  play: (contextUri?: string, uris?: string[], offset?: number) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlayPause: () => Promise<void>
  nextTrack: () => Promise<void>
  previousTrack: () => Promise<void>
  seek: (position: number) => Promise<void>
  setVolume: (volume: number) => Promise<void>
  
  // Connection state
  connect: () => Promise<boolean>
  disconnect: () => void
  
  // Error state
  error: string | null
  clearError: () => void
}

// Global singleton state for the player
let globalPlayerState = {
  player: null as SpotifyPlayer | null,
  isReady: false,
  deviceId: null as string | null,
  isActive: false,
  listeners: new Set<() => void>()
}

// Export a test function to play a sample track
export async function testSpotifyPlayback(accessToken: string, deviceId: string) {
  try {
    // Play a popular track as a test
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: ['spotify:track:3n3Ppam7vgaVa1iaRUc9Lp'] // Mr. Brightside - The Killers (popular test track)
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Playback failed: ${response.status} ${response.statusText}`)
    }
    
    console.log('✅ Test playback started successfully')
    return true
  } catch (error) {
    console.error('❌ Test playback failed:', error)
    return false
  }
}

export function useSpotifyPlayer(): UseSpotifyPlayerReturn {
  const { data: session } = useSession() as { data: ExtendedSession | null }
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.5)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const playerRef = useRef<SpotifyPlayer | null>(null)
  const positionInterval = useRef<NodeJS.Timeout | null>(null)
  const isInitializing = useRef(false)
  const initAttempts = useRef(0)
  const maxRetries = 3
  const readyTimeout = useRef<NodeJS.Timeout | null>(null)
  const isPlayerReady = useRef(false) // Track ready state in a ref to avoid closure issues

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initialize Spotify Player
  useEffect(() => {
    if (!session?.accessToken) {
      console.log('No access token, skipping player initialization')
      return
    }
    if (isInitializing.current || playerRef.current) {
      console.log('Player already initializing or initialized, skipping...')
      return
    }

    // Check if we've exceeded max retries
    if (initAttempts.current >= maxRetries) {
      console.error(`❌ Max initialization attempts (${maxRetries}) exceeded. Stopping retries.`)
      setError(`Failed to initialize Spotify Player after ${maxRetries} attempts. Your browser may not support the required DRM features for Spotify playback.`)
      return
    }

    let isMounted = true
    isInitializing.current = true

    const initializePlayer = () => {
      console.log(`🔄 Loading Spotify Web Playback SDK (attempt ${initAttempts.current + 1}/${maxRetries})`)
      
      // Remove any existing scripts first to prevent duplicates
      const existingScripts = document.querySelectorAll('script[src*="spotify-player.js"]')
      existingScripts.forEach(script => script.remove())
      
      // Create and load the SDK script dynamically with proper event handling
      const script = document.createElement("script")
      script.src = "https://sdk.scdn.co/spotify-player.js"
      script.async = true
      script.crossOrigin = "anonymous"
      
      // Handle script loading errors
      script.onerror = () => {
        if (isMounted) {
          console.error('❌ Failed to load Spotify Web Playback SDK script')
          setError('Failed to load Spotify Web Playback SDK. Check your internet connection.')
          isInitializing.current = false
        }
      }
      
      document.head.appendChild(script) // Use head instead of body

      // Define the SDK ready callback (official approach)
      window.onSpotifyWebPlaybackSDKReady = () => {
        if (!isMounted) return

        console.log('✅ Spotify Web Playback SDK Ready - Creating Player Instance')
        
        try {
          const spotifyPlayer = new window.Spotify.Player({
            name: 'Shakabra - AI DJ Party Player',
            getOAuthToken: (cb) => { cb(session?.accessToken || '') },
            volume: 0.5
          })

          playerRef.current = spotifyPlayer

          // Ready event - this MUST be added before connect()
          spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('🎉 Spotify Player Ready Event Fired! Device ID:', device_id)
            console.log('Is Mounted:', isMounted)
            
            // Mark as ready in ref immediately
            isPlayerReady.current = true
            
            setDeviceId(device_id)
            setIsReady(true)
            // Don't set isActive here - let player_state_changed handle it
            setError(null) // Clear any error since player is actually ready
            isInitializing.current = false
            
            // Clear the ready timeout since player is actually ready
            if (readyTimeout.current) {
              clearTimeout(readyTimeout.current)
              readyTimeout.current = null
            }
            
            console.log('Player state updated - isReady should now be true')
          })

          // Not Ready event
          spotifyPlayer.addListener('not_ready', ({ device_id }) => {
            if (isMounted) {
              console.log('❌ Spotify Player Not Ready with Device ID', device_id)
              setIsReady(false)
              setIsActive(false)
            }
          })

          // Player state changed
          spotifyPlayer.addListener('player_state_changed', (state) => {
            if (!isMounted) return

            if (!state) {
              console.log('Player state: No active session')
              setIsActive(false)
              return
            }

            console.log('Player state changed:', {
              paused: state.paused,
              track: state.track_window.current_track?.name,
              position: state.position
            })

            // Only update track if we have a valid track or if we're explicitly stopping
            // This prevents flickering during track transitions
            if (state.track_window.current_track) {
              setCurrentTrack(state.track_window.current_track)
              setDuration(state.track_window.current_track.duration_ms || 0)
            } else if (state.paused && state.position === 0) {
              // Only clear track if playback is truly stopped
              setCurrentTrack(null)
              setDuration(0)
            }
            // Otherwise keep the previous track to prevent flickering
            
            setIsPaused(state.paused)
            setPosition(state.position)
            
            // Player is active when we have playback state
            setIsActive(true)
            
            // Update current state for external components
            if (spotifyPlayer && typeof spotifyPlayer.getCurrentState === 'function') {
              spotifyPlayer.getCurrentState().then(currentState => {
                if (!currentState) {
                  setIsActive(false)
                }
              }).catch(err => {
                console.warn('Failed to get current state:', err)
              })
            }
          })

          // Error handling
          spotifyPlayer.addListener('initialization_error', ({ message }) => {
            if (isMounted) {
              console.error('❌ Player Initialization Error:', message)
              
              // Check for DRM-related errors
              if (message.includes('Failed to initialize player') || message.includes('EME')) {
                setError('Browser DRM/EME not supported. The Spotify Web Player requires a browser with digital rights management capabilities. Try Chrome or Safari, or use Spotify Connect instead.')
                setIsReady(false)
                setIsActive(false)
              } else {
                setError(`Initialization Error: ${message}`)
              }
              
              isInitializing.current = false
            }
          })

          spotifyPlayer.addListener('authentication_error', ({ message }) => {
            if (isMounted) {
              console.error('❌ Player Authentication Error:', message)
              setError(`Authentication Error: ${message}`)
              isInitializing.current = false
            }
          })

          spotifyPlayer.addListener('account_error', ({ message }) => {
            if (isMounted) {
              console.error('❌ Player Account Error:', message)
              setError(`Account Error: ${message}. Spotify Premium is required.`)
              isInitializing.current = false
            }
          })

          spotifyPlayer.addListener('playback_error', ({ message }) => {
            if (isMounted) {
              console.error('❌ Player Playback Error:', message)
              setError(`Playback Error: ${message}`)
            }
          })

          // Store player instance
          setPlayer(spotifyPlayer)

          // Connect the player
          spotifyPlayer.connect().then((success) => {
            if (success) {
              console.log('✅ Spotify Player Connected Successfully')
              
              // Set a timeout to detect if player never becomes ready (DRM issue)
              readyTimeout.current = setTimeout(() => {
                // Check the ref to see if player became ready
                if (isMounted && !isPlayerReady.current) {
                  console.warn('⚠️ Player connected but never became ready - likely DRM/EME issue')
                  setError('Spotify Web Player connected but cannot initialize. This is typically a DRM/browser issue. Try: 1) Chrome with hardware acceleration enabled, 2) Safari on macOS, 3) Using HTTPS (not localhost), or 4) Click "Test Play" to activate.')
                  isInitializing.current = false
                  setIsActive(false)
                } else if (isPlayerReady.current) {
                  console.log('✅ Player became ready before timeout')
                }
              }, 10000) // 10 second timeout
              
            } else {
              console.error('❌ Failed to connect Spotify Player')
              setError('Failed to connect to Spotify Player. This may be due to browser DRM limitations. Try using Chrome or Safari.')
              isInitializing.current = false
            }
          }).catch((connectError) => {
            console.error('❌ Player connection failed:', connectError)
            setError('Spotify Player connection failed. Your browser may not support protected content playback.')
            isInitializing.current = false
          })

        } catch (error) {
          if (isMounted) {
            console.error('❌ Failed to create Spotify Player:', error)
            setError(`Failed to create player: ${error instanceof Error ? error.message : 'Unknown error'}`)
            isInitializing.current = false
          }
        }
      }
    }

    // Add delay to prevent multiple SDK loads and check browser compatibility
    const initTimeout = setTimeout(async () => {
      // Check for basic browser DRM support
      if (typeof window !== 'undefined' && window.navigator) {
        // Check for EME support
        if (!navigator.requestMediaKeySystemAccess) {
          console.warn('❌ Browser does not support EME/DRM - Web Playback SDK will not work')
          setError('Your browser does not support protected content playback. Please use Chrome, Safari, or Edge for Spotify Web Playback.')
          isInitializing.current = false
          return
        }
        
        // Test DRM capability before initializing player
        try {
          const keySystemsToTest = [
            'com.widevine.alpha',
            'com.microsoft.playready',
            'com.apple.fps'
          ]
          
          let drmSupported = false
          for (const keySystem of keySystemsToTest) {
            try {
              await navigator.requestMediaKeySystemAccess(keySystem, [
                {
                  initDataTypes: ['cenc'],
                  audioCapabilities: [{contentType: 'audio/mp4;codecs="mp4a.40.2"'}],
                  videoCapabilities: [{contentType: 'video/mp4;codecs="avc1.42E01E"'}],
                }
              ])
              console.log(`✅ DRM support detected: ${keySystem}`)
              drmSupported = true
              break
            } catch (e) {
              console.log(`❌ No support for ${keySystem}`)
            }
          }
          
          if (!drmSupported) {
            console.warn('❌ No compatible DRM system found')
            setError('Your browser does not have compatible DRM support for Spotify Web Playback. Try updating your browser or use the Spotify app directly.')
            isInitializing.current = false
            return
          }
        } catch (error) {
          console.warn('⚠️ Could not test DRM capabilities:', error)
        }
        
        // Check if we're on localhost (can cause DRM issues)
        if (window.location.hostname === 'localhost') {
          console.warn('⚠️ Running on localhost - DRM may not work properly. Consider using 127.0.0.1 or HTTPS for production.')
        }
      }
      
      initializePlayer()
    }, 1000) // 1 second delay to avoid race conditions

    return () => {
      isMounted = false
      clearTimeout(initTimeout)
      if (readyTimeout.current) {
        clearTimeout(readyTimeout.current)
        readyTimeout.current = null
      }
      if (playerRef.current) {
        console.log('🔌 Cleaning up Spotify Player')
        // Remove all listeners before clearing reference
        try {
          playerRef.current.removeListener('ready')
          playerRef.current.removeListener('not_ready')
          playerRef.current.removeListener('player_state_changed')
          playerRef.current.removeListener('initialization_error')
          playerRef.current.removeListener('authentication_error')
          playerRef.current.removeListener('account_error')
          playerRef.current.removeListener('playback_error')
        } catch (err) {
          console.warn('Error removing listeners:', err)
        }
        playerRef.current = null
      }
      if (positionInterval.current) {
        clearInterval(positionInterval.current)
      }
      isInitializing.current = false
      isPlayerReady.current = false
      // Clear the SDK ready callback to prevent conflicts
      if (typeof window !== 'undefined') {
        window.onSpotifyWebPlaybackSDKReady = undefined
      }
    }
  }, [session?.accessToken])

  // Position tracking
  useEffect(() => {
    if (isActive && !isPaused && player) {
      positionInterval.current = setInterval(async () => {
        if (player && typeof player.getCurrentState === 'function') {
          try {
            const state = await player.getCurrentState()
            if (state) {
              setPosition(state.position)
            }
          } catch (err) {
            console.warn('Position tracking error:', err)
          }
        }
      }, 1000)
    } else {
      if (positionInterval.current) {
        clearInterval(positionInterval.current)
        positionInterval.current = null
      }
    }

    return () => {
      if (positionInterval.current) {
        clearInterval(positionInterval.current)
      }
    }
  }, [isActive, isPaused, player])

  // Player control functions
  const connect = useCallback(async (): Promise<boolean> => {
    if (!player) {
      setError('Player not initialized')
      return false
    }

    try {
      const success = await player.connect()
      if (success) {
        setError(null)
      }
      return success
    } catch (error) {
      setError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }, [player])

  const disconnect = useCallback(() => {
    if (player) {
      // Use pause instead of disconnect to avoid permissions issues
      player.pause().catch(console.warn)
      setIsReady(false)
      setIsActive(false)
    }
  }, [player])

  const play = useCallback(async (contextUri?: string, uris?: string[], offset?: number) => {
    if (!session?.accessToken) {
      setError('Not authenticated')
      return
    }
    
    if (!deviceId) {
      setError('Player not ready. Please wait for it to initialize or click "Test Play" to activate.')
      return
    }

    try {
      const body: any = {}
      if (contextUri) {
        body.context_uri = contextUri
      }
      if (uris) {
        body.uris = uris
      }
      if (typeof offset === 'number') {
        body.offset = { position: offset }
      }

      console.log(`🎵 Starting playback on device ${deviceId}:`, body)
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Playback API error:', response.status, errorText)
        
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.')
        } else if (response.status === 404) {
          throw new Error('Device not found. Try clicking "Test Play" to activate the player.')
        } else if (response.status === 403) {
          throw new Error('Spotify Premium is required for playback.')
        }
        
        throw new Error(`Playback failed: ${response.status}`)
      }

      setError(null)
      console.log('✅ Playback started successfully')
    } catch (error) {
      setError(`${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [deviceId, session?.accessToken])

  const pause = useCallback(async () => {
    if (player) {
      try {
        await player.pause()
        setError(null)
      } catch (error) {
        setError(`Pause failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [player])

  const resume = useCallback(async () => {
    if (player) {
      try {
        await player.resume()
        setError(null)
      } catch (error) {
        setError(`Resume failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [player])

  const togglePlayPause = useCallback(async () => {
    if (player) {
      try {
        await player.togglePlay()
        setError(null)
      } catch (error) {
        setError(`Toggle play failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [player])

  const nextTrack = useCallback(async () => {
    // Try using Web API first for better playlist support
    if (session?.accessToken && deviceId) {
      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        setError(null)
        return
      } catch (apiError) {
        console.warn('Web API next failed, falling back to SDK:', apiError)
      }
    }
    
    // Fallback to SDK method
    if (player) {
      try {
        await player.nextTrack()
        setError(null)
      } catch (error) {
        setError(`Next track failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [player, session?.accessToken, deviceId])

  const previousTrack = useCallback(async () => {
    // Try using Web API first for better playlist support
    if (session?.accessToken && deviceId) {
      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        setError(null)
        return
      } catch (apiError) {
        console.warn('Web API previous failed, falling back to SDK:', apiError)
      }
    }
    
    // Fallback to SDK method
    if (player) {
      try {
        await player.previousTrack()
        setError(null)
      } catch (error) {
        setError(`Previous track failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [player, session?.accessToken, deviceId])

  const seek = useCallback(async (position: number) => {
    // Try using Web API first for better playlist support
    if (session?.accessToken && deviceId) {
      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${Math.floor(position)}&device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        setPosition(position)
        setError(null)
        return
      } catch (apiError) {
        console.warn('Web API seek failed, falling back to SDK:', apiError)
      }
    }
    
    // Fallback to SDK method
    if (player) {
      try {
        await player.seek(position)
        setPosition(position)
        setError(null)
      } catch (error) {
        setError(`Seek failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [player, session?.accessToken, deviceId])

  const setVolume = useCallback(async (newVolume: number) => {
    // Try using Web API first
    if (session?.accessToken && deviceId) {
      try {
        const volumePercent = Math.floor(newVolume * 100)
        const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}&device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        setVolumeState(newVolume)
        setError(null)
        return
      } catch (apiError) {
        console.warn('Web API volume failed, falling back to SDK:', apiError)
      }
    }
    
    // Fallback to SDK method
    if (player) {
      try {
        await player.setVolume(newVolume)
        setVolumeState(newVolume)
        setError(null)
      } catch (error) {
        setError(`Volume change failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [player, session?.accessToken, deviceId])

  // Debug logging on state changes
  useEffect(() => {
    console.log('Player Hook State:', { isReady, deviceId, isActive, error })
  }, [isReady, deviceId, isActive, error])

  return {
    // Player state
    player,
    isReady,
    isActive,
    isPaused,
    currentTrack,
    position,
    duration,
    volume,
    deviceId,
    
    // Player controls
    play,
    pause,
    resume,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    
    // Connection
    connect,
    disconnect,
    
    // Error handling
    error,
    clearError
  }
}