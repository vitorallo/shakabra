'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'blue' | 'purple' | 'green' | 'pink' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  glow?: boolean
  pulse?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  asChild?: boolean
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  (props, ref) => {
    const {
      className,
      children,
      variant = 'blue',
      size = 'md',
      glow = true,
      pulse = false,
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      asChild = false,
      ...restProps
    } = props
    
    // Explicitly remove any remaining non-DOM props from restProps
    const domProps = restProps
    const baseClasses = [
      'relative inline-flex items-center justify-center',
      'rounded-xl font-medium font-inter',
      'transition-all duration-300 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
      'active:scale-95 transform'
    ].join(' ')

    const variantClasses = {
      blue: [
        'bg-electric-blue/20 border border-electric-blue text-electric-blue',
        'hover:bg-electric-blue hover:text-void-black hover:scale-105',
        'focus-visible:ring-electric-blue',
        glow && 'shadow-neon-blue-sm hover:shadow-neon-blue'
      ].join(' '),
      purple: [
        'bg-neon-purple/20 border border-neon-purple text-neon-purple',
        'hover:bg-neon-purple hover:text-void-black hover:scale-105',
        'focus-visible:ring-neon-purple',
        glow && 'shadow-neon-purple-sm hover:shadow-neon-purple'
      ].join(' '),
      green: [
        'bg-acid-green/20 border border-acid-green text-acid-green',
        'hover:bg-acid-green hover:text-void-black hover:scale-105',
        'focus-visible:ring-acid-green',
        glow && 'shadow-neon-green-sm hover:shadow-neon-green'
      ].join(' '),
      pink: [
        'bg-hot-pink/20 border border-hot-pink text-hot-pink',
        'hover:bg-hot-pink hover:text-void-black hover:scale-105',
        'focus-visible:ring-hot-pink',
        glow && 'shadow-neon-pink-sm hover:shadow-neon-pink'
      ].join(' '),
      ghost: [
        'bg-transparent border-0 text-muted-gray',
        'hover:bg-white/10 hover:text-neon-white hover:scale-105'
      ].join(' '),
      outline: [
        'bg-transparent border border-white/20 text-neon-white',
        'hover:bg-white/10 hover:border-white/40 hover:scale-105'
      ].join(' ')
    }

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      xl: 'h-14 px-8 text-lg gap-3',
      icon: 'h-10 w-10 p-0'
    }

    const pulseClasses = pulse ? 'animate-pulse-neon' : ''

    const isDisabled = disabled || loading

    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement
      return React.cloneElement(child, {
        ...child.props,
        className: cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          pulseClasses,
          className,
          child.props.className
        ),
        disabled: isDisabled,
        ...domProps,
      })
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          pulseClasses,
          className
        )}
        disabled={isDisabled}
        {...domProps}
      >
        {/* Background glow effect */}
        {glow && variant !== 'ghost' && variant !== 'outline' && (
          <div className={cn(
            "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
            "group-hover:opacity-30 blur-sm",
            variant === 'blue' && "bg-electric-blue",
            variant === 'purple' && "bg-neon-purple",
            variant === 'green' && "bg-acid-green",
            variant === 'pink' && "bg-hot-pink"
          )} />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center gap-inherit">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <span className="inline-flex items-center justify-center">
                  {icon}
                </span>
              )}
              
              {size !== 'icon' && (
                <span className="font-medium tracking-wide">
                  {children}
                </span>
              )}
              
              {icon && iconPosition === 'right' && (
                <span className="inline-flex items-center justify-center">
                  {icon}
                </span>
              )}
              
              {size === 'icon' && icon && (
                <span className="inline-flex items-center justify-center">
                  {icon}
                </span>
              )}
            </>
          )}
        </div>

        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-xl opacity-0 bg-white/20 animate-ping pointer-events-none" />
      </button>
    )
  }
)

NeonButton.displayName = 'NeonButton'

export { NeonButton }