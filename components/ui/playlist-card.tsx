'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from './glass-card'
import { NeonButton } from './neon-button'
import { 
  Play, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Music,
  Clock,
  Users
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export interface Playlist {
  id: string
  name: string
  description?: string
  imageUrl?: string
  owner: {
    id: string
    displayName: string
  }
  trackCount: number
  duration: number // in seconds
  followers?: number
  isPublic: boolean
  isOwn: boolean
  isLiked?: boolean
  lastUpdated?: Date
}

export interface PlaylistCardProps {
  playlist: Playlist
  className?: string
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
  showActions?: boolean
  showDescription?: boolean
  showStats?: boolean
  onPlay?: (playlist: Playlist) => void
  onLike?: (playlist: Playlist) => void
  onShare?: (playlist: Playlist) => void
  onMore?: (playlist: Playlist) => void
  isPlaying?: boolean
  loading?: boolean
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  className,
  size = 'md',
  orientation = 'vertical',
  showActions = true,
  showDescription = true,
  showStats = true,
  onPlay,
  onLike,
  onShare,
  onMore,
  isPlaying = false,
  loading = false
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getImageSize = () => {
    switch (size) {
      case 'sm': return orientation === 'horizontal' ? 'w-16 h-16' : 'w-full aspect-square'
      case 'lg': return orientation === 'horizontal' ? 'w-32 h-32' : 'w-full aspect-square'
      default: return orientation === 'horizontal' ? 'w-24 h-24' : 'w-full aspect-square'
    }
  }

  const getCardSize = () => {
    switch (size) {
      case 'sm': return orientation === 'horizontal' ? 'p-4' : 'p-3'
      case 'lg': return orientation === 'horizontal' ? 'p-8' : 'p-6'
      default: return orientation === 'horizontal' ? 'p-6' : 'p-4'
    }
  }

  const ImagePlaceholder = () => (
    <div className={cn(
      "bg-gradient-to-br from-neon-purple/30 to-electric-blue/30",
      "flex items-center justify-center rounded-lg",
      getImageSize()
    )}>
      <Music className={cn(
        "text-neon-white/60",
        size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'
      )} />
    </div>
  )

  const PlayButton = () => (
    <NeonButton
      variant="blue"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
      onClick={() => onPlay?.(playlist)}
      disabled={loading}
      loading={loading}
      glow
      pulse={isPlaying}
      icon={<Play className={cn(
        size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
      )} />}
    />
  )

  if (orientation === 'horizontal') {
    return (
      <GlassCard
        className={cn(
          "group hover:scale-[1.02] transition-all duration-300",
          getCardSize(),
          className
        )}
        hover
        glow="blue"
      >
        <div className="flex items-center gap-4">
          {/* Image */}
          <div className="relative flex-shrink-0">
            {playlist.imageUrl ? (
              <img
                src={playlist.imageUrl}
                alt={playlist.name}
                className={cn(
                  "object-cover rounded-lg",
                  getImageSize()
                )}
              />
            ) : (
              <ImagePlaceholder />
            )}
            
            {/* Play Button Overlay */}
            {showActions && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                <PlayButton />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title and Owner */}
            <div>
              <h3 className={cn(
                "font-orbitron font-medium text-neon-white truncate",
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
              )}>
                {playlist.name}
              </h3>
              <p className={cn(
                "text-muted-gray truncate",
                size === 'sm' ? 'text-xs' : 'text-sm'
              )}>
                By {playlist.owner.displayName}
              </p>
            </div>

            {/* Description */}
            {showDescription && playlist.description && (
              <p className={cn(
                "text-dim-gray line-clamp-2",
                size === 'sm' ? 'text-xs' : 'text-sm'
              )}>
                {playlist.description}
              </p>
            )}

            {/* Stats */}
            {showStats && (
              <div className="flex items-center gap-4 text-muted-gray">
                <div className="flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  <span className="text-xs">
                    {formatNumber(playlist.trackCount)} tracks
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    {formatDuration(playlist.duration)}
                  </span>
                </div>
                {playlist.followers && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">
                      {formatNumber(playlist.followers)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => onLike?.(playlist)}
                icon={<Heart className={cn(
                  "h-4 w-4",
                  playlist.isLiked && "fill-current text-hot-pink"
                )} />}
              />
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(playlist)}
                icon={<Share2 className="h-4 w-4" />}
              />
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => onMore?.(playlist)}
                icon={<MoreHorizontal className="h-4 w-4" />}
              />
            </div>
          )}
        </div>
      </GlassCard>
    )
  }

  // Vertical orientation
  return (
    <GlassCard
      className={cn(
        "group hover:scale-105 transition-all duration-300 max-w-sm",
        getCardSize(),
        className
      )}
      hover
      glow="purple"
    >
      <div className="space-y-4">
        {/* Image */}
        <div className="relative">
          {playlist.imageUrl ? (
            <img
              src={playlist.imageUrl}
              alt={playlist.name}
              className={cn(
                "object-cover rounded-lg",
                getImageSize()
              )}
            />
          ) : (
            <ImagePlaceholder />
          )}
          
          {/* Play Button Overlay */}
          {showActions && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
              <PlayButton />
            </div>
          )}

          {/* Status indicators */}
          <div className="absolute top-2 right-2 flex gap-1">
            {playlist.isOwn && (
              <div className="bg-acid-green/20 backdrop-blur-sm rounded-full px-2 py-1">
                <span className="text-xs font-jetbrains text-acid-green">YOURS</span>
              </div>
            )}
            {!playlist.isPublic && (
              <div className="bg-hot-pink/20 backdrop-blur-sm rounded-full px-2 py-1">
                <span className="text-xs font-jetbrains text-hot-pink">PRIVATE</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Title and Owner */}
          <div>
            <h3 className={cn(
              "font-orbitron font-medium text-neon-white line-clamp-2",
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
            )}>
              {playlist.name}
            </h3>
            <p className={cn(
              "text-muted-gray truncate",
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
              By {playlist.owner.displayName}
            </p>
          </div>

          {/* Description */}
          {showDescription && playlist.description && (
            <p className={cn(
              "text-dim-gray line-clamp-3",
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
              {playlist.description}
            </p>
          )}

          {/* Stats */}
          {showStats && (
            <div className="flex flex-wrap items-center gap-3 text-muted-gray">
              <div className="flex items-center gap-1">
                <Music className="h-3 w-3" />
                <span className="text-xs">
                  {formatNumber(playlist.trackCount)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  {formatDuration(playlist.duration)}
                </span>
              </div>
              {playlist.followers && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">
                    {formatNumber(playlist.followers)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-1">
                <NeonButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike?.(playlist)}
                  icon={<Heart className={cn(
                    "h-4 w-4",
                    playlist.isLiked && "fill-current text-hot-pink"
                  )} />}
                />
                <NeonButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare?.(playlist)}
                  icon={<Share2 className="h-4 w-4" />}
                />
              </div>
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => onMore?.(playlist)}
                icon={<MoreHorizontal className="h-4 w-4" />}
              />
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export { PlaylistCard }