'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useCallback } from 'react'
import type { Session } from 'next-auth'

interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  spotify_id?: string
}

interface UseAuthReturn {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  hasSpotifyToken: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  error?: string
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session
  const hasSpotifyToken = !!session?.accessToken
  
  const login = useCallback(async () => {
    await signIn('spotify', { 
      callbackUrl: '/',
      redirect: true 
    })
  }, [])

  const logout = useCallback(async () => {
    await signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true 
    })
  }, [])

  const user: AuthUser | null = session?.user ? {
    id: session.user.id || session.spotify_id || '',
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    spotify_id: session.spotify_id,
  } : null

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    hasSpotifyToken,
    login,
    logout,
    error: session?.error,
  }
}