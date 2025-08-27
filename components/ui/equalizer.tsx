'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface EqualizerProps {
  isPlaying?: boolean
  isPaused?: boolean
  className?: string
  barCount?: number
  colorScheme?: 'purple' | 'blue' | 'green' | 'rainbow'
  size?: 'sm' | 'md' | 'lg'
}

export function Equalizer({
  isPlaying = false,
  isPaused = false,
  className,
  barCount = 5,
  colorScheme = 'rainbow',
  size = 'md'
}: EqualizerProps) {
  const getBarHeight = () => {
    switch (size) {
      case 'sm': return 'h-8'
      case 'lg': return 'h-16'
      default: return 'h-12'
    }
  }

  const getBarWidth = () => {
    switch (size) {
      case 'sm': return 'w-1'
      case 'lg': return 'w-3'
      default: return 'w-2'
    }
  }

  const getBarColor = (index: number) => {
    if (colorScheme === 'rainbow') {
      const colors = [
        'bg-gradient-to-t from-hot-pink to-hot-pink/30',
        'bg-gradient-to-t from-neon-purple to-neon-purple/30',
        'bg-gradient-to-t from-electric-blue to-electric-blue/30',
        'bg-gradient-to-t from-acid-green to-acid-green/30',
        'bg-gradient-to-t from-neon-purple to-hot-pink/30'
      ]
      return colors[index % colors.length]
    }

    const schemeMap = {
      purple: 'bg-gradient-to-t from-neon-purple to-neon-purple/30',
      blue: 'bg-gradient-to-t from-electric-blue to-electric-blue/30',
      green: 'bg-gradient-to-t from-acid-green to-acid-green/30'
    }

    return schemeMap[colorScheme] || schemeMap.purple
  }

  const getAnimationDelay = (index: number) => {
    return `${index * 0.15}s`
  }

  const getAnimationDuration = (index: number) => {
    // Vary the duration slightly for more organic movement
    const baseDuration = 0.8
    const variation = (index % 3) * 0.1
    return `${baseDuration + variation}s`
  }

  return (
    <div className={cn(
      "flex items-end justify-center gap-1",
      getBarHeight(),
      className
    )}>
      {Array.from({ length: barCount }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "rounded-full transition-all duration-300 relative overflow-hidden",
            getBarWidth(),
            getBarColor(index),
            !isPlaying || isPaused ? "!h-2 opacity-30" : ""
          )}
          style={{
            animationDelay: isPlaying && !isPaused ? getAnimationDelay(index) : undefined,
            animationDuration: isPlaying && !isPaused ? getAnimationDuration(index) : undefined,
            animation: isPlaying && !isPaused 
              ? `equalizer ${getAnimationDuration(index)} ease-in-out ${getAnimationDelay(index)} infinite`
              : 'none',
            height: isPlaying && !isPaused ? '100%' : '20%'
          }}
        >
          {/* Glow effect */}
          {isPlaying && !isPaused && (
            <div className="absolute inset-0 animate-pulse">
              <div className={cn(
                "absolute inset-0 blur-sm",
                getBarColor(index)
              )} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Advanced Volume Meter Component
interface VolumeMeterProps {
  volume: number // 0 to 1
  isActive?: boolean
  className?: string
  showPeaks?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export function VolumeMeter({
  volume,
  isActive = false,
  className = '',
  showPeaks = true,
  orientation = 'horizontal'
}: VolumeMeterProps) {
  const [peak, setPeak] = React.useState(0)
  const [smoothVolume, setSmoothVolume] = React.useState(0)

  React.useEffect(() => {
    // Smooth volume transitions
    setSmoothVolume(prev => {
      const diff = volume - prev
      return prev + diff * 0.3
    })

    // Track peak levels
    if (volume > peak) {
      setPeak(volume)
      setTimeout(() => setPeak(0), 2000)
    }
  }, [volume, peak])

  const getVolumeColor = (level: number) => {
    if (level > 0.9) return 'from-hot-pink to-red-500'
    if (level > 0.7) return 'from-neon-purple to-hot-pink'
    if (level > 0.4) return 'from-electric-blue to-neon-purple'
    return 'from-acid-green to-electric-blue'
  }

  if (orientation === 'vertical') {
    return (
      <div className={cn(
        "relative w-4 h-32 bg-dark-gray/50 rounded-full overflow-hidden",
        className
      )}>
        {/* Volume fill */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-all duration-150",
            `bg-gradient-to-t ${getVolumeColor(smoothVolume)}`,
            isActive && "animate-pulse"
          )}
          style={{ height: `${smoothVolume * 100}%` }}
        />

        {/* Peak indicator */}
        {showPeaks && peak > 0 && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-hot-pink animate-pulse"
            style={{ bottom: `${peak * 100}%` }}
          />
        )}

        {/* Grid overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-px bg-white/10" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "relative w-full bg-dark-gray/50 rounded-full overflow-hidden",
      !className.includes('h-') && 'h-4',
      className
    )}>
      {/* Volume fill */}
      <div 
        className={cn(
          "absolute top-0 left-0 bottom-0 transition-all duration-150",
          `bg-gradient-to-r ${getVolumeColor(smoothVolume)}`,
          isActive && "animate-pulse"
        )}
        style={{ width: `${smoothVolume * 100}%` }}
      >
        {/* Animated glow */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>

      {/* Peak indicator */}
      {showPeaks && peak > 0 && (
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-hot-pink animate-pulse"
          style={{ left: `${peak * 100}%` }}
        />
      )}

      {/* Grid overlay - only show for larger heights */}
      {!className.includes('h-2') && (
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-px h-full bg-white/10" />
          ))}
        </div>
      )}
    </div>
  )
}

// Spectrum Analyzer Component
interface SpectrumAnalyzerProps {
  isActive?: boolean
  className?: string
  barCount?: number
}

export function SpectrumAnalyzer({
  isActive = false,
  className,
  barCount = 32
}: SpectrumAnalyzerProps) {
  const [spectrum, setSpectrum] = React.useState<number[]>([])

  React.useEffect(() => {
    if (!isActive) {
      setSpectrum(new Array(barCount).fill(0))
      return
    }

    const interval = setInterval(() => {
      // Simulate frequency spectrum data
      const newSpectrum = Array.from({ length: barCount }).map((_, i) => {
        // Create a realistic frequency response curve
        const position = i / barCount
        const baseLevel = Math.sin(position * Math.PI) * 0.5 + 0.3
        const random = Math.random() * 0.3
        return Math.min(1, baseLevel + random)
      })
      setSpectrum(newSpectrum)
    }, 100)

    return () => clearInterval(interval)
  }, [isActive, barCount])

  return (
    <div className={cn(
      "flex items-end justify-center gap-px h-20",
      className
    )}>
      {spectrum.map((level, index) => {
        const hue = (index / barCount) * 120 + 240 // Blue to purple gradient
        return (
          <div
            key={index}
            className="flex-1 min-w-[2px] max-w-[4px] transition-all duration-100 rounded-t-sm"
            style={{
              height: `${level * 100}%`,
              background: `linear-gradient(to top, 
                hsl(${hue}, 100%, 50%) 0%, 
                hsl(${hue}, 100%, 70%) 50%, 
                hsl(${hue}, 100%, 90%) 100%)`,
              boxShadow: isActive ? `0 0 10px hsl(${hue}, 100%, 50%)` : 'none',
              opacity: isActive ? 1 : 0.3
            }}
          />
        )
      })}
    </div>
  )
}