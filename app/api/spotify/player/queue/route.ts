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
    const uri = searchParams.get('uri')
    const deviceId = searchParams.get('device_id')

    if (!uri) {
      return NextResponse.json(
        { error: 'Track URI is required' },
        { status: 400 }
      )
    }

    const spotify = createSpotifyAPI(session)
    await spotify.addToQueue(uri, deviceId || undefined)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Spotify queue error:', error)
    
    // Check for specific error types
    if (error.message?.includes('404')) {
      return NextResponse.json(
        { error: 'No active device found. Please start playback first.' },
        { status: 404 }
      )
    }
    
    if (error.message?.includes('403')) {
      return NextResponse.json(
        { error: 'Premium required for queue management' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to add to queue' },
      { status: 500 }
    )
  }
}