'use client'

import React, { useState } from 'react'
import { NeonButton } from './neon-button'
import { GlassCard } from './glass-card'
import { useDJStore, useDJSession, useDJSettings } from '@/stores/dj-store'
import { usePlaylistAnalysis } from '@/hooks/use-track-analysis'
import { SpotifyTrack } from '@/lib/spotify'
import { DJTrack } from '@/lib/ai-mixing/dj-engine'
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  Zap,
  TrendingUp,
  Music,
  Brain,
  Loader2,
  Settings,
  Info,
  BarChart3
} from 'lucide-react'

interface AIDJDemoProps {
  playlists: SpotifyTrack[]
  className?: string
  playerState?: any // Spotify player state from useSpotifyPlayer hook
}

export function AIDJDemo({ playlists, className, playerState }: AIDJDemoProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showCompatibilityDetails, setShowCompatibilityDetails] = useState(false)
  
  // DJ Store hooks
  const { 
    initializeEngine, 
    addTracksToPool, 
    isLoading, 
    error, 
    clearError 
  } = useDJStore()
  
  const { 
    isSessionActive, 
    currentTrack, 
    nextTrack, 
    sessionStats, 
    startSession, 
    endSession, 
    getNextTrack 
  } = useDJSession()
  
  const { 
    djSettings, 
    updateDJSettings, 
    showAdvancedSettings,
    toggleAdvancedSettings 
  } = useDJSettings()

  // Modern track analysis hook
  const { analyzePlaylist, progress } = usePlaylistAnalysis()

  const handleStartAIMixing = async () => {
    if (playlists.length === 0) {
      return
    }

    try {
      setIsAnalyzing(true)
      clearError()
      
      // Initialize engine if not already done
      if (!useDJStore.getState().djEngine) {
        initializeEngine(djSettings)
      }

      // Analyze tracks using modern methods (no deprecated APIs)
      const trackIds = playlists.map(track => track.id)
      const audioFeatures = await analyzePlaylist(trackIds)
      
      if (audioFeatures.length === 0) {
        throw new Error('Unable to analyze tracks. Please try a different playlist.')
      }

      // Log analysis results
      console.log(`Successfully analyzed ${audioFeatures.length} of ${playlists.length} tracks using intelligent estimation`)

      // Create a map of track ID to audio features for proper matching
      const featuresMap = new Map<string, any>()
      audioFeatures.forEach(feature => {
        if (feature && feature.id) {
          featuresMap.set(feature.id, feature)
        }
      })

      // Create DJ tracks only for tracks with valid audio features
      const djTracks: DJTrack[] = playlists
        .filter(track => featuresMap.has(track.id))
        .map(track => ({
          ...track,
          audioFeatures: featuresMap.get(track.id)!,
          playCount: 0,
          skipCount: 0
        }))

      if (djTracks.length === 0) {
        throw new Error('No analyzable tracks found in the playlist. Try a different playlist with standard Spotify tracks.')
      }

      // Add tracks to pool with audio features
      addTracksToPool(
        djTracks.map(t => ({ ...t } as SpotifyTrack)),
        djTracks.map(t => t.audioFeatures)
      )

      // Start AI DJ session with all available tracks
      await startSession(djTracks)
      
      // Auto-play the first track if Spotify player is available
      const firstTrack = useDJStore.getState().currentTrack
      if (firstTrack && playerState?.play) {
        // Play the selected track via Spotify
        // Pass undefined for contextUri, then array of track URIs
        const trackUri = `spotify:track:${firstTrack.id}`
        try {
          await playerState.play(undefined, [trackUri])
        } catch (error) {
          console.log('Could not auto-play track:', error)
        }
      }
      
    } catch (error) {
      console.error('Failed to start AI mixing:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start AI mixing'
      
      // Check if it's a Premium-related error
      if (errorMessage.includes('Premium') || errorMessage.includes('403')) {
        useDJStore.getState().setError('Spotify Premium is required for AI mixing. The AI engine needs track analysis data to create seamless transitions.')
      } else {
        useDJStore.getState().setError(errorMessage)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleMixNext = async () => {
    try {
      setIsAnalyzing(true)
      
      // Get next track from AI engine
      const nextTrack = await getNextTrack()
      
      if (nextTrack && playerState) {
        const trackUri = `spotify:track:${nextTrack.id}`
        
        // Debug: Log what's available in playerState
        console.log('🔍 PlayerState contents:', {
          hasSetVolume: !!playerState.setVolume,
          hasNextTrack: !!playerState.nextTrack,
          hasPlay: !!playerState.play,
          volume: playerState.volume,
          deviceId: playerState.deviceId,
          availableMethods: Object.keys(playerState).filter(key => typeof playerState[key] === 'function')
        })
        
        // Get current playback state for crossfading
        const currentProgress = playerState.progress || 0
        const currentDuration = playerState.duration || 0
        const timeRemaining = currentDuration - currentProgress
        
        console.log('Starting mix to next track:', nextTrack.name)
        console.log(`Current track: ${timeRemaining}ms remaining`)
        
        // Implement crossfade mixing
        const crossfadeDuration = (djSettings?.crossfadeDuration || 3) * 1000 // Convert to ms, default 3 seconds
        const fadeSteps = 20 // More steps for smoother fade
        const fadeInterval = crossfadeDuration / fadeSteps
        
        // Store original volume - convert from player scale (0-1) to API scale (0-100)
        const playerVolume = playerState.volume || 0.5
        const originalVolume = playerVolume <= 1 ? playerVolume * 100 : playerVolume // Handle both scales
        console.log(`Original volume: player=${playerVolume}, API scale=${originalVolume}`)
        
        // Add to queue first
        try {
          const response = await fetch(`/api/spotify/player/queue?uri=${encodeURIComponent(trackUri)}`, {
            method: 'POST',
          })
          
          if (response.ok) {
            console.log('✅ Track successfully queued, starting crossfade')
            console.log(`Crossfade settings: duration=${crossfadeDuration}ms, steps=${fadeSteps}`)
            
            // For Mix Next button, start crossfading immediately
            // (Auto-mix would wait for the right moment)
            
            useDJStore.getState().setError(`🎵 Transitioning to: ${nextTrack.name} (${crossfadeDuration/1000}s fade)`)
            
            // Start volume fade out
            let currentVolume = originalVolume
            const volumeStep = originalVolume / fadeSteps
            let stepCount = 0
            
            console.log(`Starting fade: originalVolume=${originalVolume}, volumeStep=${volumeStep}`)
            console.log('⚠️ Note: Spotify does not support true crossfading (playing 2 tracks simultaneously)')
            console.log('Creating smooth transition with fade-out → switch → fade-in')
            
            // Smoother transition approach
            const fadeOutInterval = setInterval(async () => {
              stepCount++
              currentVolume = originalVolume * (1 - (stepCount / fadeSteps))
              
              console.log(`Fade out step ${stepCount}/${fadeSteps}: volume=${Math.round(currentVolume)}%`)
              
              // Update volume
              try {
                if (playerState.setVolume) {
                  // Player expects 0-1 scale
                  const playerVolume = currentVolume / 100
                  await playerState.setVolume(playerVolume)
                } else {
                  // Fallback to API call (expects 0-100)
                  const volumeResponse = await fetch(
                    `/api/spotify/player/volume?volume=${Math.round(currentVolume)}${playerState.deviceId ? `&device_id=${playerState.deviceId}` : ''}`,
                    { method: 'PUT' }
                  )
                  if (!volumeResponse.ok) {
                    console.warn('Failed to set volume via API')
                  }
                }
              } catch (error) {
                console.error('Volume control error:', error)
              }
              
              // When volume is very low (near the end of fade), switch tracks
              if (stepCount >= fadeSteps - 1) {
                clearInterval(fadeOutInterval)
                console.log('🔄 Volume at minimum, switching to next track now')
                
                // Switch to next track at very low volume
                try {
                  if (playerState.nextTrack) {
                    await playerState.nextTrack()
                  } else {
                    // Fallback to API call
                    const nextResponse = await fetch(
                      `/api/spotify/player/next${playerState.deviceId ? `?device_id=${playerState.deviceId}` : ''}`,
                      { method: 'POST' }
                    )
                    if (!nextResponse.ok) {
                      console.warn('Failed to skip to next track via API')
                    }
                  }
                } catch (error) {
                  console.error('Next track error:', error)
                }
                
                // Wait a moment for track change to register
                setTimeout(() => {
                  console.log('✨ Starting fade in for new track')
                  // Fade back in
                  let fadeInStep = 0
                  const fadeInInterval = setInterval(async () => {
                    fadeInStep++
                    const newVolume = originalVolume * (fadeInStep / fadeSteps)
                    console.log(`Fade in step ${fadeInStep}/${fadeSteps}: volume=${Math.round(newVolume)}%`)
                    
                    try {
                      if (playerState.setVolume) {
                        // Player expects 0-1 scale
                        const playerVolume = Math.min(originalVolume, newVolume) / 100
                        await playerState.setVolume(playerVolume)
                      } else {
                        // Fallback to API call (expects 0-100)
                        const apiVolume = Math.min(originalVolume, Math.round(newVolume))
                        const volumeResponse = await fetch(
                          `/api/spotify/player/volume?volume=${apiVolume}${playerState.deviceId ? `&device_id=${playerState.deviceId}` : ''}`,
                          { method: 'PUT' }
                        )
                        if (!volumeResponse.ok) {
                          console.warn('Failed to set volume via API during fade-in')
                        }
                      }
                    } catch (error) {
                      console.error('Fade-in volume error:', error)
                    }
                    
                    if (fadeInStep >= fadeSteps) {
                      clearInterval(fadeInInterval)
                      console.log('✅ Transition complete!')
                      useDJStore.getState().clearError()
                    }
                  }, fadeInterval)
                }, 500) // Small delay to ensure track switch is processed
              }
            }, fadeInterval)
            
          } else {
            // Fallback: direct transition without crossfade
            console.log('Queue failed, using direct transition')
            await playerState.play?.(undefined, [trackUri])
          }
        } catch (error) {
          console.error('Failed to queue track for mixing:', error)
          // Fallback to direct play
          await playerState.play?.(undefined, [trackUri])
        }
      } else if (!nextTrack) {
        // No suitable track found
        useDJStore.getState().setError('No suitable track found for mixing. Try adding more tracks to the pool.')
      }
    } catch (error) {
      console.error('Failed to mix to next track:', error)
      useDJStore.getState().setError('Failed to select next track')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getEnergyColor = (energy: number) => {
    if (energy >= 0.8) return 'text-hot-pink'
    if (energy >= 0.6) return 'text-electric-blue' 
    if (energy >= 0.4) return 'text-acid-green'
    return 'text-muted-gray'
  }

  const getTempoColor = (tempo: number) => {
    if (tempo >= 140) return 'text-hot-pink'
    if (tempo >= 120) return 'text-electric-blue'
    if (tempo >= 100) return 'text-acid-green'
    return 'text-muted-gray'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold font-orbitron bg-gradient-to-r from-electric-blue via-neon-purple to-acid-green bg-clip-text text-transparent mb-2">
          AI DJ Engine Demo
        </h2>
        <p className="text-muted-gray max-w-2xl mx-auto">
          Experience intelligent music mixing with advanced track analysis, energy progression, and seamless transitions.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <GlassCard className="border-hot-pink/30 bg-hot-pink/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-hot-pink" />
              <span className="text-hot-pink text-sm">{error}</span>
            </div>
            <NeonButton
              variant="ghost"
              size="sm"
              onClick={clearError}
            >
              Dismiss
            </NeonButton>
          </div>
        </GlassCard>
      )}

      {/* Main Control Panel */}
      <GlassCard className="p-6">
        <div className="space-y-6">
          {/* AI Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className={`w-6 h-6 ${isSessionActive ? 'text-electric-blue' : 'text-muted-gray'}`} />
              <div>
                <h3 className="font-semibold text-neon-white">AI DJ Status</h3>
                <p className="text-sm text-muted-gray">
                  {isSessionActive ? 'Active - Analyzing and mixing tracks' : 'Inactive - Ready to start'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <NeonButton
                variant="ghost" 
                size="sm"
                onClick={toggleAdvancedSettings}
                icon={<Settings className="w-4 h-4" />}
              >
                Settings
              </NeonButton>
            </div>
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-electric-blue" />
                <span className="text-sm text-muted-gray">
                  Analyzing audio features... {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-dark-gray/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-electric-blue to-neon-purple h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Test API Button - for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 text-center">
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/spotify/test-premium')
                    const data = await response.json()
                    console.log('Premium test result:', data)
                    if (data.success) {
                      alert(`Premium status: ${data.user.isPremium ? 'YES' : 'NO'}\nAudio features work: ${data.audioFeaturesWork ? 'YES' : 'NO'}`)
                    } else {
                      alert(`Test failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Test failed:', error)
                  }
                }}
              >
                Test Spotify Premium API
              </NeonButton>
              
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/spotify/test-simple')
                    const data = await response.json()
                    console.log('Simple test result:', data)
                    alert(`Simple API Test:\n${JSON.stringify(data, null, 2)}`)
                  } catch (error) {
                    console.error('Test failed:', error)
                  }
                }}
                className="ml-2"
              >
                Simple API Test
              </NeonButton>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!isSessionActive ? (
              <NeonButton
                variant="purple"
                size="lg"
                glow
                onClick={handleStartAIMixing}
                disabled={playlists.length === 0 || isAnalyzing}
                loading={isAnalyzing}
                icon={<Zap className="w-5 h-5" />}
              >
                Start AI Mixing
              </NeonButton>
            ) : (
              <>
                <NeonButton
                  variant="green"
                  size="md"
                  onClick={handleMixNext}
                  disabled={isLoading || isAnalyzing}
                  loading={isAnalyzing}
                  icon={<Zap className="w-5 h-5" />}
                  glow
                >
                  Mix Next
                </NeonButton>
                <NeonButton
                  variant="blue"
                  size="md"
                  onClick={handleMixNext}
                  disabled={isLoading || isAnalyzing}
                  loading={isLoading}
                  icon={<SkipForward className="w-5 h-5" />}
                >
                  Skip Track
                </NeonButton>
                <NeonButton
                  variant="outline"
                  size="md"
                  onClick={endSession}
                  icon={<Pause className="w-5 h-5" />}
                >
                  Stop Mixing
                </NeonButton>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Currently Playing */}
      {currentTrack && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-neon-white flex items-center space-x-2">
              <Music className="w-5 h-5 text-electric-blue" />
              <span>Now Playing</span>
            </h3>
            
            <div className="flex items-center space-x-4">
              {currentTrack.album.images[0] && (
                <img 
                  src={currentTrack.album.images[0].url}
                  alt={`${currentTrack.album.name} cover`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-neon-white">{currentTrack.name}</h4>
                <p className="text-sm text-muted-gray">
                  {currentTrack.artists.map(artist => artist.name).join(', ')}
                </p>
                <p className="text-xs text-muted-gray">{currentTrack.album.name}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-acid-green" />
                  <span className={`text-sm ${getEnergyColor(currentTrack.audioFeatures.energy)}`}>
                    {Math.round(currentTrack.audioFeatures.energy * 100)}% Energy
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-neon-purple" />
                  <span className={`text-sm ${getTempoColor(currentTrack.audioFeatures.tempo)}`}>
                    {Math.round(currentTrack.audioFeatures.tempo)} BPM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Up Next */}
      {nextTrack && (
        <GlassCard className="p-6 border-electric-blue/20 bg-electric-blue/5">
          <div className="space-y-4">
            <h3 className="font-semibold text-neon-white flex items-center space-x-2">
              <SkipForward className="w-5 h-5 text-electric-blue" />
              <span>Up Next - AI Selected</span>
            </h3>
            
            <div className="flex items-center space-x-4">
              {nextTrack.album.images[0] && (
                <img 
                  src={nextTrack.album.images[0].url}
                  alt={`${nextTrack.album.name} cover`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-neon-white">{nextTrack.name}</h4>
                <p className="text-sm text-muted-gray">
                  {nextTrack.artists.map(artist => artist.name).join(', ')}
                </p>
              </div>
              <div className="text-right space-y-1">
                <div className={`text-sm ${getEnergyColor(nextTrack.audioFeatures.energy)}`}>
                  {Math.round(nextTrack.audioFeatures.energy * 100)}% Energy
                </div>
                <div className={`text-sm ${getTempoColor(nextTrack.audioFeatures.tempo)}`}>
                  {Math.round(nextTrack.audioFeatures.tempo)} BPM
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Session Stats */}
      {sessionStats && (
        <GlassCard className="p-6">
          <h3 className="font-semibold text-neon-white flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-acid-green" />
            <span>Session Statistics</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-electric-blue">{sessionStats.tracksPlayed}</div>
              <div className="text-xs text-muted-gray">Tracks Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-purple">{sessionStats.sessionDuration}m</div>
              <div className="text-xs text-muted-gray">Session Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-acid-green">
                {Math.round(sessionStats.averageEnergy * 100)}%
              </div>
              <div className="text-xs text-muted-gray">Avg Energy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-hot-pink">{sessionStats.keyTransitions}</div>
              <div className="text-xs text-muted-gray">Key Changes</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* AI Settings Panel */}
      {showAdvancedSettings && (
        <GlassCard className="p-6 border-neon-purple/20 bg-neon-purple/5">
          <h3 className="font-semibold text-neon-white mb-4">AI Mixing Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neon-white mb-2">
                Energy Variation
              </label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.1"
                value={djSettings.energyVariation}
                onChange={(e) => updateDJSettings({ energyVariation: parseFloat(e.target.value) })}
                className="w-full accent-electric-blue"
              />
              <div className="text-xs text-muted-gray mt-1">
                Current: {Math.round(djSettings.energyVariation * 100)}%
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neon-white mb-2">
                Crossfade Duration
              </label>
              <input
                type="range"
                min="3"
                max="30"
                step="1"
                value={djSettings.crossfadeDuration}
                onChange={(e) => updateDJSettings({ crossfadeDuration: parseInt(e.target.value) })}
                className="w-full accent-neon-purple"
              />
              <div className="text-xs text-muted-gray mt-1">
                Current: {djSettings.crossfadeDuration}s
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neon-white mb-2">
                Avoid Repeats
              </label>
              <input
                type="range"
                min="30"
                max="180"
                step="30"
                value={djSettings.avoidRepeats}
                onChange={(e) => updateDJSettings({ avoidRepeats: parseInt(e.target.value) })}
                className="w-full accent-acid-green"
              />
              <div className="text-xs text-muted-gray mt-1">
                Current: {djSettings.avoidRepeats}m
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neon-white mb-2">
                Peak Hour
              </label>
              <input
                type="range"
                min="18"
                max="23"
                step="1"
                value={djSettings.peakHour}
                onChange={(e) => updateDJSettings({ peakHour: parseInt(e.target.value) })}
                className="w-full accent-hot-pink"
              />
              <div className="text-xs text-muted-gray mt-1">
                Current: {djSettings.peakHour}:00
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Help Text */}
      {playlists.length === 0 && (
        <GlassCard className="p-6 border-muted-gray/20">
          <div className="text-center space-y-2">
            <Info className="w-8 h-8 text-muted-gray mx-auto" />
            <p className="text-muted-gray">
              Log in and select playlists to experience AI-powered DJ mixing
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}