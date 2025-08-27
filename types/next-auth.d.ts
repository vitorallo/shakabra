import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    spotify_id?: string
    error?: string
  }

  interface JWT {
    accessToken?: string
    refreshToken?: string
    tokenExpiresAt?: number
    spotify_id?: string
    error?: string
  }
}