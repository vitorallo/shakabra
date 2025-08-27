import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createSpotifyAPI } from '@/lib/spotify'
import { getSpotifyAppToken } from '@/lib/spotify-app-token'
import { estimateAudioFeatures, createCompatibleFeatures } from '@/lib/spotify-track-analyzer'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      )
    }
    
    if (!session.accessToken) {
      return NextResponse.json(
        { error: 'No access token in session. Please re-authenticate.' },
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
    console.log('Track IDs count:', validTrackIds.length)
    
    // First, try with app token (Client Credentials flow)
    // Audio features endpoint might work better with app-only auth
    try {
      console.log('Attempting to fetch audio features with app token...')
      const appToken = await getSpotifyAppToken()
      
      const idsParam = validTrackIds.join(',')
      const response = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${idsParam}`,
        {
          headers: {
            'Authorization': `Bearer ${appToken}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('Successfully fetched audio features with app token')
        
        // Filter out null values (tracks without features)
        const validFeatures = (data.audio_features || []).filter((f: any) => f !== null)
        
        return NextResponse.json({ 
          audio_features: validFeatures,
          method: 'app_token'
        })
      } else {
        console.log(`App token failed with status ${response.status}, trying user token...`)
      }
    } catch (appTokenError) {
      console.error('App token error:', appTokenError)
    }
    
    // Fallback: Try with user token if we have a session
    if (session?.accessToken) {
      console.log('Attempting with user token...')
      try {
        const spotify = createSpotifyAPI(session)
        
        if (validTrackIds.length === 1) {
          try {
            const audioFeatures = await spotify.getAudioFeatures(validTrackIds[0])
            return NextResponse.json({ 
              audio_features: [audioFeatures],
              method: 'user_token'
            })
          } catch (error) {
            console.log(`Track ${validTrackIds[0]} cannot be analyzed`)
            return NextResponse.json({ audio_features: [], method: 'user_token' })
          }
        } else {
          // Process tracks individually to filter out unanalyzable ones
          const allFeatures = []
          const failedTracks = []
          
          for (const trackId of validTrackIds) {
            try {
              const audioFeatures = await spotify.getAudioFeatures(trackId)
              if (audioFeatures) {
                allFeatures.push(audioFeatures)
              }
            } catch (error) {
              console.log(`Track ${trackId} skipped - cannot be analyzed`)
              failedTracks.push(trackId)
            }
          }
          
          console.log(`Successfully analyzed ${allFeatures.length} tracks, skipped ${failedTracks.length} unanalyzable tracks`)
          
          // If no features were retrieved, don't return empty - fall through to estimation
          if (allFeatures.length > 0) {
            return NextResponse.json({ 
              audio_features: allFeatures,
              skipped_count: failedTracks.length,
              method: 'user_token'
            })
          }
        }
      } catch (userTokenError) {
        console.error('User token error:', userTokenError)
      }
    }
    
    // Both API methods failed - use estimation as fallback
    console.log('Audio features API unavailable, using intelligent estimation...')
    
    try {
      // Get track details to improve estimation
      const spotify = createSpotifyAPI(session!)
      const estimatedFeatures = []
      
      for (const trackId of validTrackIds) {
        try {
          // Get track info for better estimation
          const track = await spotify.getTrack(trackId)
          const estimated = estimateAudioFeatures(track)
          const compatible = createCompatibleFeatures(estimated)
          estimatedFeatures.push(compatible)
        } catch (error) {
          console.log(`Could not estimate features for track ${trackId}`)
        }
      }
      
      if (estimatedFeatures.length > 0) {
        console.log(`Successfully estimated features for ${estimatedFeatures.length} tracks`)
        return NextResponse.json({ 
          audio_features: estimatedFeatures,
          method: 'estimation',
          notice: 'Using intelligent estimation due to Spotify API limitations'
        })
      }
    } catch (estimationError) {
      console.error('Estimation error:', estimationError)
    }
    
    // Complete failure
    return NextResponse.json({ 
      audio_features: [],
      error: 'Unable to fetch or estimate audio features',
      method: 'none'
    })
  } catch (error) {
    console.error('Spotify audio features error:', error)
    
    // Handle specific Spotify API errors
    if (error instanceof Error) {
      if (error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Spotify Premium is required for audio features analysis. Please ensure you have an active Premium subscription.' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'One or more tracks not found. Please check the track IDs.' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Authentication expired. Please log in again.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch audio features', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}