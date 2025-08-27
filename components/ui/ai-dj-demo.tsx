'use client'

import React, { useState } from 'react'
import { NeonButton } from './neon-button'
import { GlassCard } from './glass-card'
import { useDJStore, useDJSession, useDJSettings } from '@/stores/dj-store'
import { usePlaylistAudioFeatures } from '@/hooks/use-audio-features'
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
}

export function AIDJDemo({ playlists, className }: AIDJDemoProps) {
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

  // Audio features hook
  const { getPlaylistFeatures, progress } = usePlaylistAudioFeatures()

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

      // Get audio features for all tracks
      const trackIds = playlists.map(track => track.id)
      const audioFeatures = await getPlaylistFeatures(trackIds)
      
      if (audioFeatures.length === 0) {
        throw new Error('Unable to analyze tracks. Spotify Premium may be required.')
      }

      // Add tracks to pool with audio features
      addTracksToPool(playlists, audioFeatures)

      // Create DJ tracks
      const djTracks: DJTrack[] = playlists.map((track, index) => ({
        ...track,
        audioFeatures: audioFeatures[index] || createMockFeatures(), // Fallback for missing features
        playCount: 0,
        skipCount: 0
      })).filter(track => track.audioFeatures) // Remove tracks without features

      // Start AI DJ session
      await startSession(djTracks.slice(0, 20)) // Start with first 20 tracks
      
    } catch (error) {
      console.error('Failed to start AI mixing:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleNextTrack = async () => {
    await getNextTrack()
  }

  const createMockFeatures = () => ({
    acousticness: Math.random(),
    danceability: Math.random(),
    energy: Math.random(),
    instrumentalness: Math.random(),
    liveness: Math.random(),
    loudness: -60 + (Math.random() * 60),
    speechiness: Math.random(),
    valence: Math.random(),
    tempo: 60 + (Math.random() * 140),
    key: Math.floor(Math.random() * 12),
    mode: Math.round(Math.random()),
    time_signature: 4,
    duration_ms: 180000 + (Math.random() * 120000)
  })

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
          Experience intelligent music mixing with harmonic matching, energy progression, and seamless transitions.
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
                  variant="blue"
                  size="md"
                  onClick={handleNextTrack}
                  disabled={isLoading}
                  loading={isLoading}
                  icon={<SkipForward className="w-5 h-5" />}
                >
                  Next Track
                </NeonButton>
                <NeonButton
                  variant="outline"
                  size="md"
                  onClick={endSession}
                  icon={<Pause className="w-5 h-5" />}
                >
                  Stop Session
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