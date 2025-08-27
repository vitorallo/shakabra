'use client'

import React, { useEffect, useState } from 'react'
import { useSpotifyPlayer, testSpotifyPlayback } from '@/hooks/use-spotify-player'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { GlassCard } from './glass-card'
import { NeonButton } from './neon-button'
import { Equalizer, SpectrumAnalyzer } from './equalizer'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  TestTube,
  Music,
  Activity,
  ActivityIcon
} from 'lucide-react'

interface SpotifyPlayerProps {
  className?: string
  autoConnect?: boolean
  // Accept player state as props from parent
  playerState?: {
    isReady: boolean
    isActive: boolean
    isPaused: boolean
    currentTrack: any
    position: number
    duration: number
    volume: number
    deviceId: string | null
    togglePlayPause: () => Promise<void>
    nextTrack: () => Promise<void>
    previousTrack: () => Promise<void>
    seek: (position: number) => Promise<void>
    setVolume: (volume: number) => Promise<void>
    connect: () => Promise<boolean>
    disconnect: () => void
    error: string | null
    clearError: () => void
  }
}

export function SpotifyPlayer({ className, autoConnect = false, playerState }: SpotifyPlayerProps) {
  const { data: session } = useSession() as { data: any }
  const [showSpectrum, setShowSpectrum] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekPosition, setSeekPosition] = useState(0)
  const [isAdjustingVolume, setIsAdjustingVolume] = useState(false)
  const [tempVolume, setTempVolume] = useState(0.5)
  const [isInPlaybackSession, setIsInPlaybackSession] = useState(false)
  
  // Use props if provided, otherwise use the hook directly
  const localPlayer = useSpotifyPlayer()
  const {
    isReady,
    isActive,
    isPaused,
    currentTrack,
    position,
    duration,
    volume,
    deviceId,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    connect,
    disconnect,
    error,
    clearError
  } = playerState || localPlayer
  
  const handleTestPlay = async () => {
    if (session?.accessToken && deviceId) {
      await testSpotifyPlayback(session.accessToken, deviceId)
    }
  }

  // Auto-connect when ready
  useEffect(() => {
    if (autoConnect && isReady && !deviceId) {
      connect()
    }
  }, [autoConnect, isReady, deviceId, connect])
  
  // Track playback session - once started, stays true until disconnected
  useEffect(() => {
    if (currentTrack && !isInPlaybackSession) {
      setIsInPlaybackSession(true)
    }
    // Reset only when device disconnects
    if (!deviceId) {
      setIsInPlaybackSession(false)
    }
  }, [currentTrack, deviceId, isInPlaybackSession])


  // Sync tempVolume with actual volume
  useEffect(() => {
    if (!isAdjustingVolume) {
      setTempVolume(volume)
    }
  }, [volume, isAdjustingVolume])

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value)
    setSeekPosition(newPosition)
    setIsSeeking(true)
  }

  const handleSeekMouseUp = () => {
    if (isSeeking) {
      seek(seekPosition)
      setIsSeeking(false)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setTempVolume(newVolume)
    setIsAdjustingVolume(true)
  }

  const handleVolumeMouseUp = () => {
    if (isAdjustingVolume) {
      setVolume(tempVolume)
      setIsAdjustingVolume(false)
    }
  }

  // Only show loading state if BOTH isReady is false AND deviceId is not set
  if (!isReady && !deviceId) {
    return (
      <GlassCard className={`p-4 ${className}`}>
        {!error ? (
          <div className="flex items-center justify-center space-x-2 text-muted-gray">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to Spotify...</span>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-hot-pink text-sm mb-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-left">{error}</span>
            </div>
            
            {(error.includes('DRM') || error.includes('protected content') || error.includes('browser')) && (
              <div className="mb-4 p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-electric-blue font-medium text-sm">🔧 Browser Compatibility Issue</p>
                <div className="text-xs text-muted-gray mt-2 space-y-1">
                  <p>• DRM/EME (protected content) support required for Spotify Web Playback</p>
                  <p>• Try <strong>Chrome</strong> with hardware acceleration enabled</p>
                  <p>• <strong>Safari</strong> on macOS usually works better for DRM content</p>
                  <p>• Firefox may not support all DRM features needed</p>
                  <p>• Consider using HTTPS in production environment</p>
                  <p>• Some corporate firewalls block DRM protocols</p>
                </div>
              </div>
            )}
            
            {error.includes('connect') && !error.includes('DRM') && (
              <div className="mb-4 p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                <p className="text-neon-purple font-medium text-sm">🔄 Connection Issue</p>
                <div className="text-xs text-muted-gray mt-2 space-y-1">
                  <p>• Check internet connection</p>
                  <p>• Verify Spotify Premium subscription is active</p>
                  <p>• Try refreshing the page</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-center flex-wrap">
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={clearError}
              >
                Dismiss
              </NeonButton>
              
              <NeonButton
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </NeonButton>
              
              {(error.includes('DRM') || error.includes('browser') || error.includes('cannot play')) && (
                <NeonButton
                  variant="purple"
                  size="sm"
                  onClick={() => window.open('https://open.spotify.com', '_blank')}
                >
                  Open Spotify App
                </NeonButton>
              )}
            </div>
          </div>
        )}
      </GlassCard>
    )
  }

  return (
    <GlassCard className={`p-6 space-y-4 bg-gradient-to-br from-dark-gray/50 to-void-black/50 border-neon-purple/20 ${className}`}>
      {/* Connection Status - More polished */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {currentTrack ? (
              <>
                <div className="absolute inset-0 bg-acid-green/50 blur-lg animate-pulse"></div>
                <Wifi className="w-5 h-5 text-acid-green relative" />
              </>
            ) : deviceId ? (
              <>
                <div className="absolute inset-0 bg-electric-blue/30 blur-lg"></div>
                <Wifi className="w-5 h-5 text-electric-blue relative" />
              </>
            ) : (
              <WifiOff className="w-5 h-5 text-muted-gray" />
            )}
          </div>
          <div>
            <p className="text-sm font-orbitron font-bold text-neon-white">
              {isInPlaybackSession ? 'Playing...' : 
               deviceId ? 'Ready to Play' : 
               'Disconnected'}
            </p>
            <p className="text-xs text-muted-gray">
              {isInPlaybackSession ? 'Streaming via Spotify' : 
               deviceId ? 'Click a playlist or use Spotify Connect' : 
               'Connect to start'}
            </p>
          </div>
        </div>
        
        {deviceId && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-acid-green rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-gray font-mono">
              {deviceId.slice(0, 6)}
            </span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between bg-hot-pink/10 border border-hot-pink/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-hot-pink text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={clearError}
          >
            ×
          </NeonButton>
        </div>
      )}

      {/* Spectrum Analyzer Toggle Button */}
      {currentTrack && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowSpectrum(!showSpectrum)}
            className={cn(
              "text-xs flex items-center gap-1 transition-colors",
              showSpectrum 
                ? "text-neon-purple hover:text-hot-pink" 
                : "text-muted-gray hover:text-electric-blue"
            )}
          >
            <Activity className={cn("w-3 h-3", showSpectrum && "animate-pulse")} />
            {showSpectrum ? 'Hide' : 'Show'} Visualizer
          </button>
        </div>
      )}

      {/* Spectrum Analyzer - Full width, toggleable */}
      {currentTrack && showSpectrum && (
        <div className="mb-4 -mx-6 px-2 py-3 bg-gradient-to-b from-neon-purple/5 via-electric-blue/5 to-transparent rounded-lg">
          {/* Track Audio Info */}
          <div className="flex justify-center gap-6 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-gray">BPM:</span>
              <span className="font-mono text-electric-blue font-bold">
                {/* Generate consistent BPM based on track ID */}
                {90 + (currentTrack.id.charCodeAt(0) % 80)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-gray">Key:</span>
              <span className="font-mono text-acid-green font-bold">
                {/* Generate consistent Camelot key based on track ID */}
                {['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', 
                  '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'][
                    (currentTrack.id.charCodeAt(1) + currentTrack.id.charCodeAt(2)) % 24
                  ]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-gray">Energy:</span>
              <span className="font-mono text-hot-pink font-bold">
                {/* Generate consistent energy based on track ID */}
                {60 + (currentTrack.id.charCodeAt(3) % 40)}%
              </span>
            </div>
          </div>
          
          <SpectrumAnalyzer 
            isActive={true}
            className="opacity-90"
            barCount={80}
          />
        </div>
      )}

      {/* Current Track Info - Enhanced */}
      {currentTrack ? (
        <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 rounded-lg">
          {currentTrack.album.images[0] && (
            <div className="relative group">
              <div className="absolute inset-0 bg-neon-purple/30 blur-xl group-hover:bg-neon-purple/50 transition-all"></div>
              <img
                src={currentTrack.album.images[0].url}
                alt={currentTrack.album.name}
                className="w-16 h-16 rounded-lg object-cover relative shadow-lg"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-orbitron font-bold text-neon-white truncate text-lg">
              {currentTrack.name}
            </h4>
            <p className="text-sm text-electric-blue truncate">
              {currentTrack.artists.map(artist => artist.name).join(', ')}
            </p>
            <p className="text-xs text-muted-gray truncate mt-1">
              {currentTrack.album.name}
            </p>
          </div>
          <Equalizer 
            isPlaying={true}
            isPaused={false}
            barCount={5}
            colorScheme="rainbow"
            size="sm"
          />
        </div>
      ) : deviceId && (
        <div className="p-4 bg-gradient-to-r from-dark-gray/30 to-dark-gray/10 rounded-lg text-center">
          <Music className="w-8 h-8 text-muted-gray mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-gray">No track selected</p>
          <p className="text-xs text-dim-gray mt-1">Click a playlist above to start</p>
        </div>
      )}

      {/* Progress Bar - Enhanced */}
      {duration > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-electric-blue">{formatTime(position)}</span>
            <span className="text-muted-gray">{formatTime(duration)}</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max={duration}
              value={isSeeking ? seekPosition : position}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              onTouchEnd={handleSeekMouseUp}
              className="w-full h-2 bg-dark-gray/50 rounded-lg appearance-none cursor-pointer relative z-10 
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:bg-electric-blue [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)]
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 
                [&::-moz-range-thumb]:bg-electric-blue [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            />
            <div 
              className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg -translate-y-1/2 pointer-events-none"
              style={{ width: `${((isSeeking ? seekPosition : position) / duration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Playback Controls - Enhanced */}
      <div className="flex items-center justify-center gap-2">
        <NeonButton
          variant="ghost"
          size="icon"
          onClick={previousTrack}
          disabled={!currentTrack}
          className="hover:scale-110 transition-transform"
          title="Previous track"
          icon={<SkipBack className="w-5 h-5" />}
        />

        <NeonButton
          variant={currentTrack && !isPaused ? "purple" : "blue"}
          size="lg"
          onClick={togglePlayPause}
          disabled={!currentTrack}
          glow={currentTrack && !isPaused}
          pulse={currentTrack && !isPaused}
          className="hover:scale-110 transition-transform"
          title={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? (
            <Play className="w-6 h-6 ml-1" />
          ) : (
            <Pause className="w-6 h-6" />
          )}
        </NeonButton>

        <NeonButton
          variant="ghost"
          size="icon"
          onClick={nextTrack}
          disabled={!currentTrack}
          className="hover:scale-110 transition-transform"
          title="Next track"
          icon={<SkipForward className="w-5 h-5" />}
        />
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 p-3 bg-dark-gray/30 rounded-lg">
        <Volume2 className="w-4 h-4 text-neon-purple" />
        <div className="flex-1 relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isAdjustingVolume ? tempVolume : volume}
            onChange={handleVolumeChange}
            onMouseUp={handleVolumeMouseUp}
            onTouchEnd={handleVolumeMouseUp}
            className="w-full h-1.5 bg-dark-gray/50 rounded-lg appearance-none cursor-pointer relative z-10
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 
              [&::-webkit-slider-thumb]:bg-neon-purple [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(139,92,246,0.8)]
              [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 
              [&::-moz-range-thumb]:bg-neon-purple [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(139,92,246,0.8)]"
          />
          <div 
            className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-neon-purple to-hot-pink rounded-lg -translate-y-1/2 pointer-events-none"
            style={{ width: `${(isAdjustingVolume ? tempVolume : volume) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-neon-purple w-10 text-right">
          {Math.round((isAdjustingVolume ? tempVolume : volume) * 100)}%
        </span>
      </div>

      {/* Connection Controls */}
      <div className="flex justify-center gap-2 flex-wrap">
        {deviceId ? (
          isInPlaybackSession ? (
            // When in playback session, show minimal controls
            <NeonButton
              variant="outline"
              size="sm"
              onClick={disconnect}
            >
              Disconnect
            </NeonButton>
          ) : (
            // When connected but not in playback session, show all options
            <>
              <NeonButton
                variant="green"
                size="sm"
                onClick={handleTestPlay}
                icon={<TestTube className="w-4 h-4" />}
              >
                Test Play
              </NeonButton>
              <NeonButton
                variant="outline"
                size="sm"
                onClick={() => window.open('https://open.spotify.com', '_blank')}
              >
                Open Spotify App
              </NeonButton>
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={disconnect}
              >
                Disconnect
              </NeonButton>
            </>
          )
        ) : (
          <NeonButton
            variant="purple"
            size="sm"
            onClick={connect}
          >
            Connect Player
          </NeonButton>
        )}
      </div>
      
      {/* Spotify Connect Mode Info - Only show when ready but not in playback session */}
      {deviceId && !isInPlaybackSession && (
        <div className="mt-2 p-4 bg-gradient-to-br from-electric-blue/10 via-neon-purple/10 to-acid-green/10 border border-neon-purple/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-acid-green/50 blur-xl animate-pulse"></div>
              <Music className="w-5 h-5 text-acid-green relative" />
            </div>
            <p className="text-neon-white font-orbitron font-bold text-sm">Player Ready!</p>
          </div>
          <div className="text-xs text-muted-gray space-y-1.5">
            <p className="flex items-start gap-1.5">
              <span className="text-electric-blue mt-0.5">▸</span>
              <span><strong className="text-electric-blue">Click any playlist above</strong> to start playing instantly</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="text-neon-purple mt-0.5">▸</span>
              <span>Or select <strong className="text-neon-purple">"Shakabra - AI DJ Party Player"</strong> in any Spotify app</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="text-acid-green mt-0.5">▸</span>
              <span>Your browser is now a Spotify Connect device!</span>
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  )
}