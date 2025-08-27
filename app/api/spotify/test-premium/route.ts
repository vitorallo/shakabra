import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createSpotifyAPI } from '@/lib/spotify'

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
        { error: 'No access token in session' },
        { status: 401 }
      )
    }

    console.log('Testing Spotify API access...')
    console.log('Session exists:', !!session)
    console.log('Access token exists:', !!session.accessToken)
    console.log('Access token length:', session.accessToken?.length)
    console.log('Token prefix:', session.accessToken?.substring(0, 20) + '...')
    
    // Check if token might be expired
    if (session.error) {
      console.log('Session has error:', session.error)
    }
    
    try {
      const spotify = createSpotifyAPI(session)
      
      // Test 1: Get user profile
      const profile = await spotify.getProfile()
      console.log('User profile:', profile.email, 'Product:', profile.product)
      console.log('User country/market:', profile.country)
      
      // Test 2: Try to find a track that's available in user's market
      let testTrackId = '3z8h0TU7ReDPLIbEnYhWZb' // Bohemian Rhapsody fallback
      let foundValidTrack = false
      
      try {
        const playlists = await spotify.getPlaylists(5, 0)
        
        // Try multiple playlists to find a valid track
        for (const playlist of playlists.items) {
          if (foundValidTrack) break
          
          const playlistTracks = await spotify.getPlaylistTracks(playlist.id, 10, 0)
          
          for (const item of playlistTracks.items) {
            if (!item.track) continue
            
            try {
              // First, try to get audio features for this track
              // If it succeeds, the track is valid for our purposes
              const audioFeatures = await spotify.getAudioFeatures(item.track.id)
              
              if (audioFeatures && audioFeatures.id) {
                testTrackId = item.track.id
                console.log(`Found analyzable track from playlist "${playlist.name}": ${item.track.name}`)
                foundValidTrack = true
                break
              }
            } catch (trackError) {
              // Track can't be analyzed, skip it
              console.log(`Track "${item.track.name}" cannot be analyzed, skipping...`)
              continue
            }
          }
        }
        
        if (!foundValidTrack) {
          console.log('No valid tracks found in user playlists, using default')
        }
      } catch (playlistError) {
        console.log('Could not get user playlist tracks, using default')
      }
      
      console.log('Testing track availability and audio features for:', testTrackId)
      
      try {
        const track = await spotify.getTrack(testTrackId, profile.country)
        console.log('Track available:', track.name)
        console.log('User market:', profile.country)
        console.log('Track available in markets:', track.available_markets?.includes(profile.country) ? 'YES' : 'NO')
      } catch (trackError) {
        console.error('Track fetch error:', trackError)
      }
      
      try {
        const audioFeatures = await spotify.getAudioFeatures(testTrackId)
        console.log('Audio features retrieved successfully:', audioFeatures)
        
        return NextResponse.json({
          success: true,
          user: {
            email: profile.email,
            product: profile.product,
            isPremium: profile.product === 'premium',
            market: profile.country
          },
          audioFeaturesWork: true,
          testTrack: {
            id: testTrackId,
            features: audioFeatures
          }
        })
      } catch (audioError) {
        console.error('Audio features error:', audioError)
        
        return NextResponse.json({
          success: false,
          user: {
            email: profile.email,
            product: profile.product,
            isPremium: profile.product === 'premium',
            market: profile.country
          },
          audioFeaturesWork: false,
          testTrackId: testTrackId,
          error: audioError instanceof Error ? audioError.message : 'Unknown error'
        })
      }
    } catch (spotifyError) {
      console.error('Spotify API error:', spotifyError)
      throw spotifyError
    }
  } catch (error) {
    console.error('Test endpoint error:', error)
    
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}