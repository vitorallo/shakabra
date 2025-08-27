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

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')
    
    if (!ids) {
      return NextResponse.json(
        { error: 'Track IDs are required' },
        { status: 400 }
      )
    }

    const trackIds = ids.split(',').filter(id => id.trim())
    
    if (trackIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid track IDs provided' },
        { status: 400 }
      )
    }

    const spotify = createSpotifyAPI(session)
    
    if (trackIds.length === 1) {
      const audioFeatures = await spotify.getAudioFeatures(trackIds[0])
      return NextResponse.json({ audio_features: [audioFeatures] })
    } else {
      const audioFeatures = await spotify.getMultipleAudioFeatures(trackIds)
      return NextResponse.json(audioFeatures)
    }
  } catch (error) {
    console.error('Spotify audio features error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audio features' },
      { status: 500 }
    )
  }
}