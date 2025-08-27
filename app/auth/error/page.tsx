'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { NeonButton } from '@/components/ui/neon-button'
import { GlassCard } from '@/components/ui/glass-card'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please contact support.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in. Please make sure you have a Spotify account.',
  },
  Verification: {
    title: 'Verification Error',
    description: 'The verification link was invalid or has expired. Please try signing in again.',
  },
  OAuthSignin: {
    title: 'OAuth Sign In Error',
    description: 'Error in retrieving information from Spotify. Please try again.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'Error in handling the response from Spotify. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create account. Please try again.',
  },
  EmailCreateAccount: {
    title: 'Email Account Creation Error',
    description: 'Could not create account with email. Please try again.',
  },
  Callback: {
    title: 'Callback Error',
    description: 'Error in the callback from Spotify. Please try again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description: 'Your account is not linked to Spotify. Please sign in with Spotify.',
  },
  EmailSignin: {
    title: 'Email Sign In Error',
    description: 'Could not send sign in email. Please try again.',
  },
  CredentialsSignin: {
    title: 'Credentials Sign In Error', 
    description: 'Sign in failed. Check your credentials and try again.',
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.',
  },
}

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  
  const { title, description } = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Error Icon and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-hot-pink/20 border border-hot-pink flex items-center justify-center shadow-neon-pink">
              <AlertTriangle className="w-8 h-8 text-hot-pink" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-orbitron text-neon-white mb-2">
            {title}
          </h1>
          <p className="text-muted-gray text-lg">
            {description}
          </p>
        </div>

        {/* Error Card */}
        <GlassCard className="p-8">
          <div className="space-y-6">
            {/* Error Details */}
            <div className="bg-hot-pink/10 border border-hot-pink/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-hot-pink mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-hot-pink font-medium mb-1">
                    What happened?
                  </h3>
                  <p className="text-muted-gray text-sm">
                    Error code: <code className="font-mono text-neon-white">{error}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Troubleshooting Tips */}
            <div className="space-y-3">
              <h3 className="text-neon-white font-medium">Try these steps:</h3>
              <ul className="space-y-2 text-sm text-muted-gray">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue mt-2 flex-shrink-0"></span>
                  <span>Make sure you have a Spotify Premium account</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue mt-2 flex-shrink-0"></span>
                  <span>Check your internet connection</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue mt-2 flex-shrink-0"></span>
                  <span>Clear your browser cache and cookies</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue mt-2 flex-shrink-0"></span>
                  <span>Try signing in with a different browser</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <NeonButton
                asChild
                variant="green"
                size="lg"
                className="w-full"
                glow
              >
                <Link href="/auth/signin">
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Link>
              </NeonButton>
              
              <NeonButton
                asChild
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </NeonButton>
            </div>
          </div>
        </GlassCard>

        {/* Support Link */}
        <div className="text-center">
          <p className="text-sm text-muted-gray">
            Still having issues?{' '}
            <a href="mailto:support@shakabra.com" className="text-electric-blue hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}