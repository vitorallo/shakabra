'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { usePlaylists } from '@/hooks/use-playlists'
import { NeonButton } from '@/components/ui/neon-button'
import { PlaylistCard } from '@/components/ui/playlist-card'
import { GlassCard } from '@/components/ui/glass-card'
import { LogOut, User, Music, RefreshCw, Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()
  const { playlists, isLoading: playlistsLoading, error: playlistsError, hasPlaylists, refetchPlaylists } = usePlaylists()
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
            <div className="mt-16 w-full max-w-6xl">
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
                        onPlay={() => console.log('Selected playlist:', playlist.name)}
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
