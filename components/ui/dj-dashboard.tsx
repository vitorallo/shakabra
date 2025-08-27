'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from './glass-card'
import { AudioControl } from './audio-control'
import { NeonButton } from './neon-button'
import { 
  Settings, 
  Mic, 
  Headphones,
  Radio,
  Shuffle,
  Repeat,
  Layers,
  BarChart3,
  Activity,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react'

export interface DJDashboardProps {
  className?: string
  children?: React.ReactNode
  leftPanel?: React.ReactNode
  rightPanel?: React.ReactNode
  centerContent?: React.ReactNode
  bottomControls?: React.ReactNode
  isConnected?: boolean
  onlineUsers?: number
  showMetrics?: boolean
  showActivityFeed?: boolean
  layout?: 'standard' | 'compact' | 'mobile'
}

const DJDashboard: React.FC<DJDashboardProps> = ({
  className,
  children,
  leftPanel,
  rightPanel,
  centerContent,
  bottomControls,
  isConnected = false,
  onlineUsers = 0,
  showMetrics = true,
  showActivityFeed = false,
  layout = 'standard'
}) => {
  const StatusBar = () => (
    <div className="flex items-center justify-between p-3 bg-void-black/60 backdrop-blur-sm border-b border-white/10">
      {/* Left Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-acid-green" />
          ) : (
            <WifiOff className="h-4 w-4 text-hot-pink" />
          )}
          <span className="text-xs font-jetbrains text-muted-gray">
            {isConnected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        {onlineUsers > 0 && (
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-electric-blue" />
            <span className="text-xs font-jetbrains text-electric-blue">
              {onlineUsers} LISTENING
            </span>
          </div>
        )}
      </div>

      {/* Center Branding */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full flex items-center justify-center">
          <Activity className="h-3 w-3 text-neon-white" />
        </div>
        <span className="font-orbitron text-sm text-neon-white font-medium">
          SHAKABRA DJ
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-electric-blue/10 rounded-full">
          <Clock className="h-3 w-3 text-electric-blue" />
          <span className="text-xs font-jetbrains text-electric-blue">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <NeonButton
          variant="ghost"
          size="sm"
          icon={<Settings className="h-4 w-4" />}
        />
      </div>
    </div>
  )

  const MetricsPanel = () => (
    <GlassCard className="p-4" size="sm">
      <div className="space-y-4">
        <h3 className="text-sm font-orbitron text-neon-white uppercase tracking-wider">
          Session Metrics
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-jetbrains text-electric-blue">
              42
            </div>
            <div className="text-xs text-muted-gray uppercase">
              Tracks Mixed
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-jetbrains text-neon-purple">
              2:34
            </div>
            <div className="text-xs text-muted-gray uppercase">
              Session Time
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-jetbrains text-acid-green">
              98%
            </div>
            <div className="text-xs text-muted-gray uppercase">
              Mix Quality
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-jetbrains text-hot-pink">
              127
            </div>
            <div className="text-xs text-muted-gray uppercase">
              Avg BPM
            </div>
          </div>
        </div>

        {/* Mini Visualizer */}
        <div className="h-16 bg-dark-gray/20 rounded-lg flex items-end justify-center gap-1 p-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-t from-electric-blue/60 to-neon-purple/60 rounded-sm animate-pulse"
              style={{
                width: '3px',
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  )

  const QuickActions = () => (
    <GlassCard className="p-4" size="sm">
      <div className="space-y-4">
        <h3 className="text-sm font-orbitron text-neon-white uppercase tracking-wider">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          <NeonButton
            variant="purple"
            size="sm"
            icon={<Shuffle className="h-4 w-4" />}
          >
            Auto Mix
          </NeonButton>
          
          <NeonButton
            variant="blue"
            size="sm"
            icon={<Repeat className="h-4 w-4" />}
          >
            Loop
          </NeonButton>
          
          <NeonButton
            variant="green"
            size="sm"
            icon={<Mic className="h-4 w-4" />}
          >
            Mic
          </NeonButton>
          
          <NeonButton
            variant="pink"
            size="sm"
            icon={<Headphones className="h-4 w-4" />}
          >
            Cue
          </NeonButton>
        </div>

        <div className="pt-2 border-t border-white/10">
          <NeonButton
            variant="outline"
            size="sm"
            className="w-full"
            icon={<BarChart3 className="h-4 w-4" />}
          >
            View Analytics
          </NeonButton>
        </div>
      </div>
    </GlassCard>
  )

  if (layout === 'mobile') {
    return (
      <div className={cn("h-screen bg-void-black flex flex-col", className)}>
        <StatusBar />
        
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Mobile layout - stacked */}
          {centerContent && (
            <div className="space-y-4">
              {centerContent}
            </div>
          )}
          
          {children && (
            <div className="space-y-4">
              {children}
            </div>
          )}

          {showMetrics && <MetricsPanel />}
          <QuickActions />
        </div>

        {/* Bottom Controls - Always visible on mobile */}
        <div className="flex-shrink-0 p-4 bg-void-black/80 backdrop-blur-sm border-t border-white/10">
          {bottomControls || (
            <AudioControl 
              variant="compact" 
              showCrossfader={false}
              className="w-full"
            />
          )}
        </div>
      </div>
    )
  }

  if (layout === 'compact') {
    return (
      <div className={cn("h-screen bg-void-black flex flex-col", className)}>
        <StatusBar />
        
        <div className="flex-1 flex gap-4 p-4">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {centerContent && (
              <div className="flex-1">
                {centerContent}
              </div>
            )}
            
            {children}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 space-y-4">
            {rightPanel}
            {showMetrics && <MetricsPanel />}
            <QuickActions />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex-shrink-0 p-4 bg-void-black/80 backdrop-blur-sm border-t border-white/10">
          {bottomControls || (
            <AudioControl 
              variant="full" 
              className="max-w-4xl mx-auto"
            />
          )}
        </div>
      </div>
    )
  }

  // Standard layout
  return (
    <div className={cn("h-screen bg-void-black flex flex-col", className)}>
      <StatusBar />
      
      <div className="flex-1 flex gap-6 p-6">
        {/* Left Sidebar */}
        <div className="w-80 space-y-6">
          {leftPanel}
          {showMetrics && <MetricsPanel />}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Top Section */}
          {centerContent && (
            <div className="flex-1">
              {centerContent}
            </div>
          )}

          {/* Dynamic Content */}
          {children}

          {/* Activity Feed */}
          {showActivityFeed && (
            <GlassCard className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-orbitron text-neon-white uppercase tracking-wider">
                  Live Activity
                </h3>
                
                <div className="space-y-3">
                  {/* Mock activity items */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse" />
                    <span className="text-muted-gray">
                      <span className="text-electric-blue">DJ_Master</span> added 
                      <span className="text-neon-white"> "Midnight City"</span> to queue
                    </span>
                    <span className="text-xs text-dim-gray ml-auto">2m ago</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-neon-purple rounded-full" />
                    <span className="text-muted-gray">
                      <span className="text-neon-purple">VibeMaster</span> liked current track
                    </span>
                    <span className="text-xs text-dim-gray ml-auto">5m ago</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-acid-green rounded-full" />
                    <span className="text-muted-gray">
                      Perfect mix transition detected
                    </span>
                    <span className="text-xs text-dim-gray ml-auto">8m ago</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 space-y-6">
          {rightPanel}
          <QuickActions />
          
          {/* DJ Tips Panel */}
          <GlassCard className="p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-orbitron text-neon-white uppercase tracking-wider">
                AI DJ Tip
              </h3>
              
              <div className="p-3 bg-electric-blue/10 rounded-lg border border-electric-blue/20">
                <p className="text-sm text-electric-blue">
                  Try increasing the crossfade duration to 8 seconds for smoother 
                  transitions between tracks with different tempos.
                </p>
              </div>
              
              <div className="flex gap-2">
                <NeonButton variant="ghost" size="sm">Dismiss</NeonButton>
                <NeonButton variant="blue" size="sm">Apply</NeonButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 p-6 bg-void-black/80 backdrop-blur-sm border-t border-white/10">
        {bottomControls || (
          <AudioControl 
            variant="full" 
            className="max-w-6xl mx-auto"
          />
        )}
      </div>
    </div>
  )
}

export { DJDashboard }