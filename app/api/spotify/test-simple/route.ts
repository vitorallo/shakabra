import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      )
    }
    
    // Try different known tracks that should be globally available
    const testTracks = [
      { id: '11dFghVXANMlKmJXsNCbNl', name: 'Cut To The Feeling' }, // Carly Rae Jepsen
      { id: '3n3Ppam7vgaVa1iaRUc9Lp', name: 'Mr. Brightside' },    // The Killers  
      { id: '7qiZfU4dY1lWllzX7mPBI3', name: 'Shape of You' },       // Ed Sheeran
      { id: '2Fxmhks0bxGSBdJ92vM42m', name: 'bad guy' },            // Billie Eilish
      { id: '4cOdK2wGLETKBW3PvgPWqT', name: 'Heat Waves' }          // Glass Animals
    ]
    
    const results = []
    
    for (const track of testTracks) {
      try {
        // Try direct API call with minimal processing
        const response = await fetch(
          `https://api.spotify.com/v1/audio-features/${track.id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`
            }
          }
        )
        
        const status = response.status
        const text = await response.text()
        
        results.push({
          track: track.name,
          trackId: track.id,
          status,
          response: text ? (text.length > 100 ? text.substring(0, 100) + '...' : text) : 'empty'
        })
      } catch (error) {
        results.push({
          track: track.name,
          trackId: track.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      accessTokenLength: session.accessToken.length,
      tokenPrefix: session.accessToken.substring(0, 20) + '...',
      results
    })
    
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