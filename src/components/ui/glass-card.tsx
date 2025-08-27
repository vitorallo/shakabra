'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'dark' | 'subtle'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  glow?: 'blue' | 'purple' | 'green' | 'pink' | 'none'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    className,
    children,
    variant = 'default',
    size = 'md',
    hover = false,
    glow = 'none',
    blur = 'md',
    border = true,
    padding = 'md',
    ...props
  }, ref) => {
    const baseClasses = 'relative overflow-hidden transition-all duration-300 ease-out'

    const variantClasses = {
      default: 'glass',
      dark: 'glass-dark',
      subtle: 'bg-white/5 backdrop-blur-sm border border-white/10'
    }

    const sizeClasses = {
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl'
    }

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12'
    }

    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl'
    }

    const hoverClasses = hover
      ? 'hover:scale-[1.02] hover:brightness-110 transform cursor-pointer'
      : ''

    const glowClasses = {
      blue: 'hover:shadow-neon-blue',
      purple: 'hover:shadow-neon-purple',
      green: 'hover:shadow-neon-green',
      pink: 'hover:shadow-neon-pink',
      none: ''
    }

    const borderClasses = border ? '' : 'border-0'

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          paddingClasses[padding],
          blurClasses[blur],
          hoverClasses,
          glow !== 'none' && hover ? glowClasses[glow] : '',
          borderClasses,
          className
        )}
        {...props}
      >
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Optional glow effect overlay */}
        {glow !== 'none' && (
          <div className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-300",
            hover && "group-hover:opacity-20",
            glow === 'blue' && "bg-electric-blue",
            glow === 'purple' && "bg-neon-purple",
            glow === 'green' && "bg-acid-green",
            glow === 'pink' && "bg-hot-pink"
          )} />
        )}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export { GlassCard }