'use client'

import { signIn, getProviders, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { NeonButton } from '@/components/ui/neon-button'
import { GlassCard } from '@/components/ui/glass-card'
import { Music } from 'lucide-react'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleSignIn = async () => {
    setIsLoading(true)
    await signIn('spotify', { 
      callbackUrl: '/',
      redirect: true
    })
  }

  if (!providers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-electric-blue">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-electric-blue/20 border border-electric-blue flex items-center justify-center shadow-neon-blue">
              <Music className="w-8 h-8 text-electric-blue" />
            </div>
          </div>
          <h1 className="text-4xl font-bold font-orbitron text-neon-white mb-2">
            Shakabra
          </h1>
          <p className="text-muted-gray text-lg">
            AI DJ Party Player
          </p>
        </div>

        {/* Sign In Card */}
        <GlassCard className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-neon-white mb-2">
                Welcome Back
              </h2>
              <p className="text-muted-gray">
                Sign in with your Spotify account to start mixing
              </p>
            </div>

            <div className="space-y-4">
              {Object.values(providers).map((provider) => (
                <div key={provider.name}>
                  <NeonButton
                    onClick={handleSignIn}
                    loading={isLoading}
                    variant="green"
                    size="lg"
                    className="w-full text-base font-medium"
                    glow
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.859-.179-.982-.599-.122-.421.18-.861.599-.982 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02l.024.142zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.32 11.28-1.08 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3l-.06-.12z"/>
                    </svg>
                    Continue with {provider.name}
                  </NeonButton>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-gray">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-electric-blue hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-electric-blue hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Features List */}
        <div className="text-center space-y-2">
          <p className="text-muted-gray text-sm">🎵 AI-Powered Mixing</p>
          <p className="text-muted-gray text-sm">🎧 Professional Crossfades</p>
          <p className="text-muted-gray text-sm">📱 Cross-Device Control</p>
        </div>
      </div>
    </div>
  )
}