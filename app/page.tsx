'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePlaylists } from '@/hooks/use-playlists'
import { useSpotifyPlayer } from '@/hooks/use-spotify-player'
import { NeonButton } from '@/components/ui/neon-button'
import { PlaylistCard } from '@/components/ui/playlist-card'
import { GlassCard } from '@/components/ui/glass-card'
import { AIDJDemo } from '@/components/ui/ai-dj-demo'
import { SpotifyPlayer } from '@/components/ui/spotify-player'
import { LogOut, User, Music, RefreshCw, Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()
  const { playlists, isLoading: playlistsLoading, error: playlistsError, hasPlaylists, refetchPlaylists } = usePlaylists()
  const playerState = useSpotifyPlayer()
  const { 
    play, 
    deviceId, 
    isReady: playerReady,
    isActive: playerActive,
    connect 
  } = playerState
  
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  
  // Handle playlist play
  const handlePlaylistPlay = async (playlist: any) => {
    console.log('🎵 Selected playlist:', playlist.name)
    setSelectedPlaylistId(playlist.id)
    
    // Scroll to player
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    
    // Only attempt to play if device is ready
    if (deviceId) {
      const playlistUri = `spotify:playlist:${playlist.id}`
      console.log('▶️ Starting playback for:', playlistUri)
      
      try {
        await play(playlistUri)
        console.log('✅ Playback started successfully')
      } catch (error) {
        console.error('❌ Failed to start playback:', error)
      }
    } else {
      console.log('⚠️ Player not ready. Please connect first using the player controls below.')
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-electric-blue text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-void-black via-dark-gray to-void-black" />

      {/* Navigation */}
      {isAuthenticated && (
        <nav className="relative z-10 flex justify-between items-center p-6">
          <div className="flex items-center space-x-2">
            <Music className="w-6 h-6 text-electric-blue" />
            <span className="font-orbitron font-bold text-neon-white">Shakabra</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-muted-gray">Welcome, {user?.name}</span>
            <NeonButton
              onClick={logout}
              variant="ghost"
              size="sm"
              icon={<LogOut className="w-4 h-4" />}
            >
              Logout
            </NeonButton>
          </div>
        </nav>
      )}

      {/* Hero section */}
      <div className={`relative flex min-h-screen items-center justify-center px-4 ${isAuthenticated ? '-mt-24' : ''}`}>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-7xl font-bold font-orbitron md:text-8xl">
            <span className="animate-pulse bg-gradient-to-r from-electric-blue via-neon-purple to-acid-green bg-clip-text text-transparent">
              Shakabra
            </span>
          </h1>

          <h2 className="mb-8 text-2xl font-light text-gray-300 md:text-3xl">AI DJ Party Player</h2>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
            The world's first AI-powered DJ that automatically mixes your Spotify playlists with
            professional-grade transitions, intelligent track selection, and perfect energy flow.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <>
                <NeonButton
                  asChild
                  variant="purple"
                  size="xl"
                  glow
                >
                  <Link href="/dashboard">
                    <Music className="w-5 h-5" />
                    Open DJ Dashboard
                  </Link>
                </NeonButton>
                
                <NeonButton
                  asChild
                  variant="outline"
                  size="xl"
                >
                  <Link href="/playlists">
                    View Playlists
                  </Link>
                </NeonButton>
              </>
            ) : (
              <>
                <NeonButton
                  onClick={login}
                  variant="purple"
                  size="xl"
                  glow
                >
                  Start Mixing Now
                </NeonButton>

                <NeonButton
                  asChild
                  variant="outline"
                  size="xl"
                >
                  <Link href="/demo">
                    Watch Demo
                  </Link>
                </NeonButton>
              </>
            )}
          </div>

          {/* Playlists Section - Only show when authenticated */}
          {isAuthenticated && (
            <div className="mt-16 w-full max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold font-orbitron text-neon-white">
                  Your Playlists
                </h2>
                <NeonButton
                  onClick={refetchPlaylists}
                  variant="outline"
                  size="sm"
                  loading={playlistsLoading}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh
                </NeonButton>
              </div>

              {/* Playlist Loading State */}
              {playlistsLoading && !hasPlaylists && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-electric-blue" />
                  <span className="ml-3 text-muted-gray">Loading your playlists...</span>
                </div>
              )}

              {/* Playlist Error State */}
              {playlistsError && (
                <GlassCard className="p-6 text-center">
                  <div className="text-hot-pink mb-2">Failed to load playlists</div>
                  <div className="text-muted-gray text-sm mb-4">{playlistsError}</div>
                  <NeonButton 
                    onClick={refetchPlaylists}
                    variant="pink"
                    size="sm"
                  >
                    Try Again
                  </NeonButton>
                </GlassCard>
              )}

              {/* Playlist Grid */}
              {hasPlaylists && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {playlists.slice(0, 12).map((spotifyPlaylist) => {
                    // Map SpotifyPlaylist to Playlist interface
                    const playlist = {
                      id: spotifyPlaylist.id,
                      name: spotifyPlaylist.name,
                      description: spotifyPlaylist.description || '',
                      imageUrl: spotifyPlaylist.images?.[0]?.url || '',
                      owner: {
                        id: spotifyPlaylist.owner.id,
                        displayName: spotifyPlaylist.owner.display_name
                      },
                      trackCount: spotifyPlaylist.tracks.total,
                      duration: 0, // We don't have this from the basic playlist API
                      isPublic: spotifyPlaylist.public,
                      isOwn: false, // We'll determine this later
                      followers: 0 // Not available in basic API
                    }
                    
                    return (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        onPlay={handlePlaylistPlay}
                      />
                    )
                  })}
                </div>
              )}

              {/* Show more playlists */}
              {playlists.length > 12 && (
                <div className="flex justify-center mt-8">
                  <NeonButton
                    asChild
                    variant="outline"
                    size="lg"
                  >
                    <Link href="/playlists">
                      View All {playlists.length} Playlists
                    </Link>
                  </NeonButton>
                </div>
              )}
            </div>
          )}

          {/* Spotify Player Section - Only show when authenticated */}
          {isAuthenticated && (
            <div ref={playerRef} className="mt-16 w-full max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold font-orbitron text-neon-white mb-6 text-center">
                {selectedPlaylistId ? (
                  <span className="text-glow-purple">
                    Now Playing: {playlists.find(p => p.id === selectedPlaylistId)?.name}
                  </span>
                ) : (
                  'Spotify Web Player'
                )}
              </h2>
              <SpotifyPlayer className="mb-8 mx-auto" playerState={playerState} />
              <div className="text-center text-muted-gray text-sm">
                {!selectedPlaylistId && (
                  <>
                    <p>Click the play button on any playlist above to start playing!</p>
                    <p className="mt-2">Make sure you have Spotify Premium for full functionality.</p>
                  </>
                )}
                {playerActive && selectedPlaylistId && (
                  <div className="mt-4 p-3 bg-acid-green/10 border border-acid-green/30 rounded-lg">
                    <p className="text-acid-green font-medium">🎵 Playlist is playing!</p>
                    <p className="text-xs mt-1 text-muted-gray">
                      Use the controls above or your Spotify app to manage playback
                    </p>
                  </div>
                )}
                {!playerActive && deviceId && (
                  <div className="mt-4 p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                    <p className="text-neon-purple font-medium">📱 Tips:</p>
                    <div className="text-xs mt-2 space-y-1 text-left">
                      <p>• Click a playlist's play button to start playing</p>
                      <p>• The player will automatically connect and start</p>
                      <p>• You can also control from your Spotify app</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI DJ Demo Section - Only show when authenticated */}
          {isAuthenticated && (
            <div className="mt-16 w-full max-w-6xl">
              <AIDJDemo 
                playlists={playlists.map(p => ({
                  id: p.id,
                  name: p.name,
                  artists: [{ id: 'unknown', name: p.owner.display_name }],
                  album: {
                    id: 'unknown',
                    name: p.name,
                    images: p.images,
                    release_date: '2024-01-01'
                  },
                  duration_ms: 180000, // Default 3 minutes
                  preview_url: null,
                  external_urls: { spotify: `https://open.spotify.com/playlist/${p.id}` },
                  popularity: 50
                }))} 
              />
            </div>
          )}

          {/* Features preview - Only show when NOT authenticated */}
          {!isAuthenticated && (
            <div className="mt-16 grid grid-cols-1 gap-8 text-center md:grid-cols-3">
              <div className="rounded-lg border border-gray-800 bg-dark-gray/50 p-6 backdrop-blur-sm">
                <div className="mb-2 text-3xl">🤖</div>
                <h3 className="mb-2 font-semibold text-electric-blue">AI Mixing</h3>
                <p className="text-sm text-gray-400">
                  Intelligent track selection with perfect tempo and key matching
                </p>
              </div>

              <div className="rounded-lg border border-gray-800 bg-dark-gray/50 p-6 backdrop-blur-sm">
                <div className="mb-2 text-3xl">🎵</div>
                <h3 className="mb-2 font-semibold text-neon-purple">Spotify Integration</h3>
                <p className="text-sm text-gray-400">
                  Direct access to your playlists with real-time playback control
                </p>
              </div>

              <div className="rounded-lg border border-gray-800 bg-dark-gray/50 p-6 backdrop-blur-sm">
                <div className="mb-2 text-3xl">⚡</div>
                <h3 className="mb-2 font-semibold text-acid-green">Live Mixing</h3>
                <p className="text-sm text-gray-400">
                  Professional crossfades and seamless transitions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
