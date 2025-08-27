'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { NeonButton } from './neon-button'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  RotateCcw,
  RotateCw
} from 'lucide-react'

export interface AudioControlProps {
  className?: string
  isPlaying?: boolean
  volume?: number
  crossfadePosition?: number
  onPlay?: () => void
  onPause?: () => void
  onNext?: () => void
  onPrevious?: () => void
  onVolumeChange?: (volume: number) => void
  onCrossfadeChange?: (position: number) => void
  variant?: 'compact' | 'full' | 'minimal'
  showCrossfader?: boolean
  disabled?: boolean
}

const AudioControl: React.FC<AudioControlProps> = ({
  className,
  isPlaying = false,
  volume = 50,
  crossfadePosition = 50,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onCrossfadeChange,
  variant = 'full',
  showCrossfader = true,
  disabled = false
}) => {
  const [localVolume, setLocalVolume] = useState(volume)
  const [localCrossfade, setLocalCrossfade] = useState(crossfadePosition)
  const [isMuted, setIsMuted] = useState(false)

  const handlePlayPause = () => {
    if (disabled) return
    if (isPlaying) {
      onPause?.()
    } else {
      onPlay?.()
    }
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value)
    setLocalVolume(newVolume)
    onVolumeChange?.(newVolume)
    if (newVolume > 0) setIsMuted(false)
  }

  const handleCrossfadeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(event.target.value)
    setLocalCrossfade(newPosition)
    onCrossfadeChange?.(newPosition)
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      onVolumeChange?.(localVolume)
    } else {
      setIsMuted(true)
      onVolumeChange?.(0)
    }
  }

  const SliderComponent = ({ 
    value, 
    onChange, 
    label, 
    color = 'blue',
    vertical = false,
    min = 0,
    max = 100 
  }: {
    value: number
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    label: string
    color?: 'blue' | 'purple' | 'green'
    vertical?: boolean
    min?: number
    max?: number
  }) => {
    const colorClasses = {
      blue: 'accent-electric-blue',
      purple: 'accent-neon-purple',
      green: 'accent-acid-green'
    }

    return (
      <div className={cn(
        "flex items-center gap-3",
        vertical ? "flex-col h-32" : "flex-row w-full"
      )}>
        <label className="text-xs font-orbitron text-muted-gray uppercase tracking-wider">
          {label}
        </label>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "slider-modern",
            colorClasses[color],
            vertical ? "slider-vertical" : "flex-1",
            "bg-dark-gray/50 rounded-full h-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          style={{
            background: `linear-gradient(to right, 
              ${color === 'blue' ? '#00D9FF' : 
                color === 'purple' ? '#B347FF' : '#39FF14'} 0%, 
              ${color === 'blue' ? '#00D9FF' : 
                color === 'purple' ? '#B347FF' : '#39FF14'} ${value}%, 
              rgba(26, 26, 26, 0.5) ${value}%, 
              rgba(26, 26, 26, 0.5) 100%)`
          }}
        />
        <span className="text-xs font-jetbrains text-neon-white min-w-[2rem] text-right">
          {value}
        </span>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <NeonButton
          variant="blue"
          size="icon"
          onClick={handlePlayPause}
          disabled={disabled}
          icon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        />
        <div className="flex-1 max-w-24">
          <SliderComponent
            value={isMuted ? 0 : localVolume}
            onChange={handleVolumeChange}
            label=""
            color="blue"
          />
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-4 p-4 glass-dark rounded-xl",
        className
      )}>
        {/* Transport Controls */}
        <div className="flex items-center gap-2">
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={disabled}
            icon={<SkipBack className="h-4 w-4" />}
          />
          <NeonButton
            variant="blue"
            size="md"
            onClick={handlePlayPause}
            disabled={disabled}
            icon={isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          />
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={disabled}
            icon={<SkipForward className="h-4 w-4" />}
          />
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1">
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            disabled={disabled}
            icon={isMuted || localVolume === 0 ? 
              <VolumeX className="h-4 w-4" /> : 
              <Volume2 className="h-4 w-4" />
            }
          />
          <div className="flex-1 max-w-32">
            <SliderComponent
              value={isMuted ? 0 : localVolume}
              onChange={handleVolumeChange}
              label=""
              color="blue"
            />
          </div>
        </div>
      </div>
    )
  }

  // Full variant
  return (
    <div className={cn(
      "glass-dark rounded-2xl p-6 space-y-6",
      className
    )}>
      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-4">
        <NeonButton
          variant="outline"
          size="md"
          onClick={onPrevious}
          disabled={disabled}
          icon={<SkipBack className="h-5 w-5" />}
        />
        <NeonButton
          variant="blue"
          size="xl"
          onClick={handlePlayPause}
          disabled={disabled}
          glow
          pulse={isPlaying}
          icon={isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        />
        <NeonButton
          variant="outline"
          size="md"
          onClick={onNext}
          disabled={disabled}
          icon={<SkipForward className="h-5 w-5" />}
        />
      </div>

      {/* Volume Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-orbitron text-neon-white uppercase tracking-wider">
            Master Volume
          </h3>
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            disabled={disabled}
            icon={isMuted || localVolume === 0 ? 
              <VolumeX className="h-4 w-4" /> : 
              <Volume2 className="h-4 w-4" />
            }
          />
        </div>
        <SliderComponent
          value={isMuted ? 0 : localVolume}
          onChange={handleVolumeChange}
          label=""
          color="blue"
        />
      </div>

      {/* Crossfader */}
      {showCrossfader && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-orbitron text-neon-white uppercase tracking-wider">
              Crossfader
            </h3>
            <div className="flex gap-1">
              <span className="text-xs font-jetbrains text-acid-green">A</span>
              <span className="text-xs font-jetbrains text-muted-gray mx-2">•</span>
              <span className="text-xs font-jetbrains text-hot-pink">B</span>
            </div>
          </div>
          <SliderComponent
            value={localCrossfade}
            onChange={handleCrossfadeChange}
            label=""
            color="purple"
            min={0}
            max={100}
          />
          <div className="flex justify-between text-xs font-jetbrains text-muted-gray">
            <span className="text-acid-green">DECK A</span>
            <span className="text-hot-pink">DECK B</span>
          </div>
        </div>
      )}

      {/* Additional DJ Controls */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
        <NeonButton
          variant="green"
          size="sm"
          disabled={disabled}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          Sync
        </NeonButton>
        <NeonButton
          variant="purple"
          size="sm"
          disabled={disabled}
          icon={<RotateCw className="h-4 w-4" />}
        >
          Loop
        </NeonButton>
      </div>
    </div>
  )
}

export { AudioControl }