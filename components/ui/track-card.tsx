'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from './glass-card'
import { NeonButton } from './neon-button'
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal, 
  Music2,
  Clock,
  Zap,
  TrendingUp,
  Volume2,
  Radio
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export interface Track {
  id: string
  name: string
  artists: Array<{
    id: string
    name: string
  }>
  album?: {
    id: string
    name: string
    imageUrl?: string
  }
  duration: number // in seconds
  popularity?: number // 0-100
  previewUrl?: string
  isExplicit?: boolean
  isLiked?: boolean
  audioFeatures?: {
    energy: number // 0-1
    valence: number // 0-1
    danceability: number // 0-1
    tempo: number // BPM
    key: number // 0-11
    mode: number // 0 (minor) or 1 (major)
  }
  playCount?: number
  addedAt?: Date
}

export interface TrackCardProps {
  track: Track
  className?: string
  index?: number
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
  showImage?: boolean
  showAudioFeatures?: boolean
  showActions?: boolean
  showIndex?: boolean
  showDuration?: boolean
  onPlay?: (track: Track) => void
  onPause?: (track: Track) => void
  onLike?: (track: Track) => void
  onMore?: (track: Track) => void
  onAddToQueue?: (track: Track) => void
  isPlaying?: boolean
  isCurrentTrack?: boolean
  loading?: boolean
  variant?: 'default' | 'queue' | 'minimal' | 'detailed'
}

const TrackCard: React.FC<TrackCardProps> = ({
  track,
  className,
  index,
  size = 'md',
  orientation = 'horizontal',
  showImage = true,
  showAudioFeatures = false,
  showActions = true,
  showIndex = false,
  showDuration = true,
  onPlay,
  onPause,
  onLike,
  onMore,
  onAddToQueue,
  isPlaying = false,
  isCurrentTrack = false,
  loading = false,
  variant = 'default'
}) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getImageSize = () => {
    switch (size) {
      case 'sm': return 'w-10 h-10'
      case 'lg': return 'w-16 h-16'
      default: return 'w-12 h-12'
    }
  }

  const getEnergyColor = (energy: number) => {
    if (energy > 0.7) return 'text-hot-pink'
    if (energy > 0.4) return 'text-electric-blue'
    return 'text-acid-green'
  }

  const getTempoColor = (tempo: number) => {
    if (tempo > 140) return 'text-hot-pink'
    if (tempo > 100) return 'text-electric-blue'
    return 'text-acid-green'
  }

  const ImagePlaceholder = () => (
    <div className={cn(
      "bg-gradient-to-br from-neon-purple/20 to-electric-blue/20",
      "flex items-center justify-center rounded-md",
      getImageSize()
    )}>
      <Music2 className={cn(
        "text-neon-white/40",
        size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
      )} />
    </div>
  )

  const PlayButton = () => (
    <NeonButton
      variant="blue"
      size={size === 'sm' ? 'sm' : 'md'}
      onClick={() => isPlaying ? onPause?.(track) : onPlay?.(track)}
      disabled={loading}
      loading={loading}
      glow={isCurrentTrack}
      pulse={isPlaying && isCurrentTrack}
      icon={isPlaying && isCurrentTrack ? 
        <Pause className="h-4 w-4" /> : 
        <Play className="h-4 w-4" />
      }
    />
  )

  const AudioFeaturesBar = () => {
    if (!showAudioFeatures || !track.audioFeatures) return null

    return (
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span className={getEnergyColor(track.audioFeatures.energy)}>
            {Math.round(track.audioFeatures.energy * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          <span className={getTempoColor(track.audioFeatures.tempo)}>
            {Math.round(track.audioFeatures.tempo)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Volume2 className="h-3 w-3" />
          <span className="text-muted-gray">
            {Math.round(track.audioFeatures.danceability * 100)}%
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn(
        "flex items-center gap-2 py-1 px-2 rounded-lg",
        "hover:bg-white/5 transition-colors duration-200",
        isCurrentTrack && "bg-electric-blue/10 border border-electric-blue/30",
        className
      )}>
        {showIndex && (
          <span className="text-xs font-jetbrains text-muted-gray w-6 text-center">
            {isPlaying && isCurrentTrack ? (
              <Radio className="h-3 w-3 text-electric-blue animate-pulse" />
            ) : (
              index ? index + 1 : '—'
            )}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neon-white truncate">
            {track.name}
          </p>
          <p className="text-xs text-muted-gray truncate">
            {track.artists.map(artist => artist.name).join(', ')}
          </p>
        </div>
        {showDuration && (
          <span className="text-xs font-jetbrains text-dim-gray">
            {formatDuration(track.duration)}
          </span>
        )}
        <PlayButton />
      </div>
    )
  }

  if (variant === 'queue') {
    return (
      <GlassCard
        className={cn(
          "group transition-all duration-300",
          isCurrentTrack && "ring-2 ring-electric-blue/50",
          className
        )}
        size="sm"
        padding="sm"
        hover
        glow={isCurrentTrack ? "blue" : "none"}
      >
        <div className="flex items-center gap-3">
          {showIndex && (
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              {isPlaying && isCurrentTrack ? (
                <div className="flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-electric-blue animate-pulse"></div>
                    <div className="w-1 h-4 bg-electric-blue animate-pulse delay-75"></div>
                    <div className="w-1 h-4 bg-electric-blue animate-pulse delay-150"></div>
                  </div>
                </div>
              ) : (
                <span className="text-sm font-jetbrains text-muted-gray">
                  {index ? index + 1 : '—'}
                </span>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-medium text-neon-white truncate text-sm">
              {track.name}
            </p>
            <p className="text-xs text-muted-gray truncate">
              {track.artists.map(artist => artist.name).join(', ')}
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            {showDuration && (
              <span className="text-xs font-jetbrains text-dim-gray">
                {formatDuration(track.duration)}
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <PlayButton />
            </div>
          </div>
        </div>
      </GlassCard>
    )
  }

  // Default and detailed variants
  return (
    <GlassCard
      className={cn(
        "group hover:scale-[1.01] transition-all duration-300",
        isCurrentTrack && "ring-2 ring-electric-blue/50 shadow-neon-blue",
        className
      )}
      size={size}
      padding="md"
      hover
      glow={isCurrentTrack ? "blue" : "purple"}
    >
      <div className="flex items-center gap-4">
        {/* Index */}
        {showIndex && (
          <div className="flex-shrink-0 w-8 text-center">
            {isPlaying && isCurrentTrack ? (
              <Radio className="h-4 w-4 text-electric-blue animate-pulse mx-auto" />
            ) : (
              <span className="text-sm font-jetbrains text-muted-gray">
                {index ? index + 1 : '—'}
              </span>
            )}
          </div>
        )}

        {/* Image */}
        {showImage && (
          <div className="relative flex-shrink-0">
            {track.album?.imageUrl ? (
              <img
                src={track.album.imageUrl}
                alt={track.album.name}
                className={cn(
                  "object-cover rounded-md",
                  getImageSize()
                )}
              />
            ) : (
              <ImagePlaceholder />
            )}
            
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md flex items-center justify-center">
              <PlayButton />
            </div>
          </div>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className={cn(
              "font-medium text-neon-white truncate",
              isCurrentTrack && "text-electric-blue text-glow-blue",
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
            )}>
              {track.name}
              {track.isExplicit && (
                <span className="ml-2 text-xs px-1 py-0.5 bg-muted-gray/20 rounded text-muted-gray">
                  E
                </span>
              )}
            </h3>
            <p className={cn(
              "text-muted-gray truncate",
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
              {track.artists.map(artist => artist.name).join(', ')}
            </p>
            {track.album && (
              <p className={cn(
                "text-dim-gray truncate",
                size === 'sm' ? 'text-xs' : 'text-sm'
              )}>
                {track.album.name}
              </p>
            )}
          </div>

          {/* Audio Features */}
          {variant === 'detailed' && <AudioFeaturesBar />}

          {/* Stats */}
          {variant === 'detailed' && (track.popularity || track.playCount) && (
            <div className="flex items-center gap-4 text-xs text-muted-gray">
              {track.popularity && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{track.popularity}% popular</span>
                </div>
              )}
              {track.playCount && (
                <div className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  <span>{formatNumber(track.playCount)} plays</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Duration & Actions */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {showDuration && (
            <span className="text-sm font-jetbrains text-dim-gray">
              {formatDuration(track.duration)}
            </span>
          )}

          {showActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => onLike?.(track)}
                icon={<Heart className={cn(
                  "h-4 w-4",
                  track.isLiked && "fill-current text-hot-pink"
                )} />}
              />
              {onAddToQueue && (
                <NeonButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddToQueue(track)}
                  icon={<Radio className="h-4 w-4" />}
                />
              )}
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => onMore?.(track)}
                icon={<MoreHorizontal className="h-4 w-4" />}
              />
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export { TrackCard }