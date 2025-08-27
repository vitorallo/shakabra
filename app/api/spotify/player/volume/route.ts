import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createSpotifyAPI } from '@/lib/spotify'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const volume = searchParams.get('volume')
    const deviceId = searchParams.get('device_id')

    if (!volume) {
      return NextResponse.json(
        { error: 'Volume parameter is required' },
        { status: 400 }
      )
    }

    const volumePercent = parseInt(volume)
    if (isNaN(volumePercent) || volumePercent < 0 || volumePercent > 100) {
      return NextResponse.json(
        { error: 'Volume must be between 0 and 100' },
        { status: 400 }
      )
    }

    const spotify = createSpotifyAPI(session)
    await spotify.setVolume(volumePercent, deviceId || undefined)

    return NextResponse.json({ success: true, volume: volumePercent })
  } catch (error: any) {
    console.error('Spotify volume error:', error)
    
    if (error.message?.includes('404')) {
      return NextResponse.json(
        { error: 'No active device found' },
        { status: 404 }
      )
    }
    
    if (error.message?.includes('403')) {
      return NextResponse.json(
        { error: 'Premium required for volume control' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to set volume' },
      { status: 500 }
    )
  }
}