import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createSpotifyAPI } from '@/lib/spotify'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('device_id')

    const spotify = createSpotifyAPI(session)
    await spotify.next(deviceId || undefined)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Spotify next track error:', error)
    
    if (error.message?.includes('404')) {
      return NextResponse.json(
        { error: 'No active device found' },
        { status: 404 }
      )
    }
    
    if (error.message?.includes('403')) {
      return NextResponse.json(
        { error: 'Premium required for playback control' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to skip to next track' },
      { status: 500 }
    )
  }
}