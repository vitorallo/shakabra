import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createSpotifyAPI } from '@/lib/spotify'

interface RouteContext {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const spotify = createSpotifyAPI(session)
    const tracks = await spotify.getPlaylistTracks(params.id, limit, offset)

    return NextResponse.json(tracks)
  } catch (error) {
    console.error('Spotify playlist tracks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlist tracks' },
      { status: 500 }
    )
  }
}