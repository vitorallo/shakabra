'use client'

import React, { useState } from 'react'
import {
  GlassCard,
  NeonButton,
  AudioControl,
  PlaylistCard,
  TrackCard,
  DJDashboard,
  type Playlist,
  type Track
} from './index'
import { 
  Play, 
  Heart, 
  Share2, 
  Music,
  Sparkles
} from 'lucide-react'

// Mock data for demo
const mockPlaylist: Playlist = {
  id: '1',
  name: 'Night Vibes Playlist',
  description: 'Perfect electronic tracks for late night sessions with deep house and progressive beats',
  imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
  owner: {
    id: 'user1',
    displayName: 'DJ Shakabra'
  },
  trackCount: 42,
  duration: 10800, // 3 hours
  followers: 1250,
  isPublic: true,
  isOwn: true,
  isLiked: true,
  lastUpdated: new Date()
}

const mockTrack: Track = {
  id: '1',
  name: 'Midnight City (Extended Mix)',
  artists: [
    { id: '1', name: 'M83' },
    { id: '2', name: 'Shakabra Remix' }
  ],
  album: {
    id: '1',
    name: 'Hurry Up, We\'re Dreaming',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=64&h=64&fit=crop'
  },
  duration: 285,
  popularity: 95,
  isExplicit: false,
  isLiked: true,
  audioFeatures: {
    energy: 0.8,
    valence: 0.7,
    danceability: 0.9,
    tempo: 128,
    key: 7,
    mode: 1
  },
  playCount: 15420
}

const UIDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(75)
  const [crossfade, setCrossfade] = useState(50)

  return (
    <div className="min-h-screen bg-void-black p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-orbitron font-bold text-neon-white">
          <span className="text-glow-blue">Shakabra</span>{' '}
          <span className="text-glow-purple">UI Components</span>
        </h1>
        <p className="text-muted-gray max-w-2xl mx-auto">
          Glassmorphism UI components designed for the ultimate AI DJ Party Player experience. 
          Dark-first design with neon aesthetics optimized for party environments.
        </p>
      </div>

      {/* Glass Cards Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-orbitron text-neon-white">Glass Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="default" hover glow="blue">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-electric-blue/20 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-electric-blue" />
              </div>
              <h3 className="font-orbitron text-neon-white">Default Glass</h3>
              <p className="text-sm text-muted-gray">Standard glassmorphism with blue glow</p>
            </div>
          </GlassCard>

          <GlassCard variant="dark" hover glow="purple">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto">
                <Music className="h-6 w-6 text-neon-purple" />
              </div>
              <h3 className="font-orbitron text-neon-white">Dark Glass</h3>
              <p className="text-sm text-muted-gray">Darker variant with purple glow</p>
            </div>
          </GlassCard>

          <GlassCard variant="subtle" hover glow="green">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-acid-green/20 rounded-full flex items-center justify-center mx-auto">
                <Play className="h-6 w-6 text-acid-green" />
              </div>
              <h3 className="font-orbitron text-neon-white">Subtle Glass</h3>
              <p className="text-sm text-muted-gray">Minimal glass with green glow</p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Neon Buttons Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-orbitron text-neon-white">Neon Buttons</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <NeonButton variant="blue" size="sm">
              Small Blue
            </NeonButton>
            <NeonButton variant="purple" size="md">
              Medium Purple
            </NeonButton>
            <NeonButton variant="green" size="lg">
              Large Green
            </NeonButton>
            <NeonButton variant="pink" size="xl">
              XL Pink
            </NeonButton>
          </div>

          <div className="flex flex-wrap gap-4">
            <NeonButton variant="blue" icon={<Play className="h-4 w-4" />}>
              With Icon
            </NeonButton>
            <NeonButton variant="purple" loading>
              Loading
            </NeonButton>
            <NeonButton variant="green" pulse>
              Pulsing
            </NeonButton>
            <NeonButton variant="ghost">
              Ghost
            </NeonButton>
            <NeonButton variant="outline">
              Outline
            </NeonButton>
          </div>

          <div className="flex gap-4">
            <NeonButton variant="blue" size="icon" icon={<Heart className="h-4 w-4" />} />
            <NeonButton variant="purple" size="icon" icon={<Share2 className="h-4 w-4" />} />
            <NeonButton variant="green" size="icon" icon={<Play className="h-4 w-4" />} />
          </div>
        </div>
      </section>

      {/* Audio Controls Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-orbitron text-neon-white">Audio Controls</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-orbitron text-electric-blue mb-4">Full Control Panel</h3>
            <AudioControl
              variant="full"
              isPlaying={isPlaying}
              volume={volume}
              crossfadePosition={crossfade}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onVolumeChange={setVolume}
              onCrossfadeChange={setCrossfade}
              showCrossfader={true}
            />
          </div>

          <div>
            <h3 className="text-lg font-orbitron text-neon-purple mb-4">Compact Control</h3>
            <AudioControl
              variant="compact"
              isPlaying={isPlaying}
              volume={volume}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onVolumeChange={setVolume}
            />
          </div>

          <div>
            <h3 className="text-lg font-orbitron text-acid-green mb-4">Minimal Control</h3>
            <AudioControl
              variant="minimal"
              isPlaying={isPlaying}
              volume={volume}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onVolumeChange={setVolume}
            />
          </div>
        </div>
      </section>

      {/* Playlist Cards Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-orbitron text-neon-white">Playlist Cards</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-orbitron text-electric-blue mb-4">Vertical Layout</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PlaylistCard
                playlist={mockPlaylist}
                orientation="vertical"
                size="md"
                onPlay={(playlist) => console.log('Playing:', playlist.name)}
                onLike={(playlist) => console.log('Liked:', playlist.name)}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-orbitron text-neon-purple mb-4">Horizontal Layout</h3>
            <div className="space-y-4">
              <PlaylistCard
                playlist={mockPlaylist}
                orientation="horizontal"
                size="lg"
                onPlay={(playlist) => console.log('Playing:', playlist.name)}
                onLike={(playlist) => console.log('Liked:', playlist.name)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Track Cards Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-orbitron text-neon-white">Track Cards</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-orbitron text-electric-blue mb-4">Default Track Card</h3>
            <TrackCard
              track={mockTrack}
              variant="default"
              isCurrentTrack={isPlaying}
              isPlaying={isPlaying}
              showIndex={true}
              index={0}
              onPlay={(track) => {
                setIsPlaying(true)
                console.log('Playing:', track.name)
              }}
              onPause={() => setIsPlaying(false)}
            />
          </div>

          <div>
            <h3 className="text-lg font-orbitron text-neon-purple mb-4">Detailed Track Card</h3>
            <TrackCard
              track={mockTrack}
              variant="detailed"
              showAudioFeatures={true}
              onPlay={(track) => console.log('Playing:', track.name)}
            />
          </div>

          <div>
            <h3 className="text-lg font-orbitron text-acid-green mb-4">Queue Track Card</h3>
            <div className="space-y-2">
              <TrackCard
                track={mockTrack}
                variant="queue"
                showIndex={true}
                index={0}
                isCurrentTrack={true}
                isPlaying={isPlaying}
              />
              <TrackCard
                track={{...mockTrack, name: "Another Track", id: "2"}}
                variant="queue"
                showIndex={true}
                index={1}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-orbitron text-hot-pink mb-4">Minimal Track Card</h3>
            <div className="space-y-1">
              <TrackCard
                track={mockTrack}
                variant="minimal"
                showIndex={true}
                index={0}
                isCurrentTrack={true}
                isPlaying={isPlaying}
              />
              <TrackCard
                track={{...mockTrack, name: "Second Track", id: "2"}}
                variant="minimal"
                showIndex={true}
                index={1}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pt-12 border-t border-white/10">
        <p className="text-muted-gray">
          Built with Next.js 15, React, TypeScript, and Tailwind CSS
        </p>
        <p className="text-sm text-dim-gray mt-2">
          Glassmorphism UI Components for Shakabra AI DJ Party Player
        </p>
      </footer>
    </div>
  )
}

export { UIDemo }