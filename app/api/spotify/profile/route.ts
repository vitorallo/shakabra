import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createSpotifyAPI } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      )
    }

    const spotify = createSpotifyAPI(session)
    const profile = await spotify.getProfile()

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Spotify profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}