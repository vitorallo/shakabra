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

    // Validate track IDs format (Spotify track IDs are 22 characters)
    const validTrackIds = trackIds.filter(id => {
      const cleanId = id.replace('spotify:track:', '').trim()
      return cleanId.length === 22 && /^[a-zA-Z0-9]+$/.test(cleanId)
    })

    if (validTrackIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid Spotify track IDs provided' },
        { status: 400 }
      )
    }

    console.log('Fetching audio features for track IDs:', validTrackIds)

    const spotify = createSpotifyAPI(session)
    
    if (validTrackIds.length === 1) {
      const audioFeatures = await spotify.getAudioFeatures(validTrackIds[0])
      return NextResponse.json({ audio_features: [audioFeatures] })
    } else {
      const audioFeatures = await spotify.getMultipleAudioFeatures(validTrackIds)
      return NextResponse.json(audioFeatures)
    }
  } catch (error) {
    console.error('Spotify audio features error:', error)
    
    // Handle specific Spotify API errors
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json(
        { error: 'Access denied to audio features. Some tracks may not be available or you may not have the required permissions.' },
        { status: 403 }
      )
    }
    
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'One or more tracks not found. Please check the track IDs.' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch audio features', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}