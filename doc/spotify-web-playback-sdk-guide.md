# Spotify Web Playback SDK - Complete Implementation Guide

## Overview

The Web Playback SDK is a client-side only JavaScript library designed to create a local [Spotify Connect](https://developer.spotify.com/documentation/web-playback-sdk/concepts/spotify-connect) device in your browser, stream and control audio tracks from Spotify inside your website and get metadata about the current playback.

**Important:** The Web Playback SDK requires a [Spotify Premium subscription](https://www.spotify.com/premium/) (mobile only types of premium subscriptions are excluded)

## Browser Support

The Web Playback SDK is supported by most web browsers:
- Chrome ✅
- Firefox ✅  
- Safari ✅
- Microsoft Edge ✅

Available on:
- Desktop: macOS, Windows, Linux
- Mobile: Android and iOS

## Prerequisites

### Required Scopes

Your Spotify application must request the following OAuth scopes:

```javascript
const SPOTIFY_SCOPES = [
  'streaming',           // Required for Web Playback SDK
  'user-read-email',     // Required for Web Playback SDK
  'user-read-private',   // Required for Web Playback SDK
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'user-library-read'
].join(' ')
```

### Spotify App Configuration

1. Go to [Spotify for Developers](https://developer.spotify.com/dashboard)
2. Create or select your application
3. Add your callback URL to **Redirect URIs**:
   - Development: `http://127.0.0.1:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

## Implementation Guide

### Step 1: Dynamic SDK Loading (Recommended)

Load the Spotify Web Playback SDK dynamically in your React component:

```javascript
useEffect(() => {
  if (!accessToken) return

  // Create and load the SDK script dynamically
  const script = document.createElement("script")
  script.src = "https://sdk.scdn.co/spotify-player.js"
  script.async = true
  document.body.appendChild(script)

  // Define the SDK ready callback
  window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('✅ Spotify Web Playback SDK Ready')
    initializePlayer()
  }

  return () => {
    // Cleanup on unmount
    if (script.parentNode) {
      script.parentNode.removeChild(script)
    }
  }
}, [accessToken])
```

### Step 2: Player Initialization

Initialize the Spotify Player with proper configuration:

```javascript
const initializePlayer = () => {
  const player = new window.Spotify.Player({
    name: 'Your App Name',
    getOAuthToken: (cb) => { cb(accessToken) },
    volume: 0.5
  })

  // Ready event - player is connected and ready
  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id)
    setDeviceId(device_id)
    setIsReady(true)
  })

  // Not Ready event - device went offline
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id)
    setIsReady(false)
  })

  // Player state changed - track changes, play/pause, etc.
  player.addListener('player_state_changed', (state) => {
    if (!state) {
      setIsActive(false)
      return
    }

    setCurrentTrack(state.track_window.current_track)
    setIsPaused(state.paused)
    setPosition(state.position)
    setDuration(state.track_window.current_track?.duration_ms || 0)
    setIsActive(true)
  })

  // Error handling
  player.addListener('initialization_error', ({ message }) => {
    console.error('Failed to initialize', message)
  })

  player.addListener('authentication_error', ({ message }) => {
    console.error('Failed to authenticate', message)
  })

  player.addListener('account_error', ({ message }) => {
    console.error('Failed to validate Spotify account', message)
  })

  player.addListener('playback_error', ({ message }) => {
    console.error('Failed to perform playback', message)
  })

  // Connect to the player
  player.connect().then((success) => {
    if (success) {
      console.log('✅ Successfully connected to Spotify!')
    } else {
      console.error('❌ Failed to connect to Spotify')
    }
  })
}
```

### Step 3: Playback Control

Control playback using the player instance:

```javascript
// Play/pause toggle
const togglePlayback = () => {
  player.togglePlay()
}

// Next/previous track
const nextTrack = () => {
  player.nextTrack()
}

const previousTrack = () => {
  player.previousTrack()
}

// Seek to position (in milliseconds)
const seek = (position) => {
  player.seek(position)
}

// Volume control (0.0 to 1.0)
const setVolume = (volume) => {
  player.setVolume(volume)
}
```

### Step 4: Playing Specific Content

Use the Spotify Web API to start playback:

```javascript
const playPlaylist = async (playlistUri) => {
  if (!deviceId) return

  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context_uri: playlistUri, // e.g., 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M'
      }),
    })

    if (!response.ok) {
      throw new Error(`Playback failed: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to start playback:', error)
  }
}

const playTracks = async (trackUris) => {
  if (!deviceId) return

  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: trackUris, // e.g., ['spotify:track:4iV5W9uYEdYUVa79Axb7Rh']
      }),
    })
  } catch (error) {
    console.error('Failed to start playback:', error)
  }
}
```

## Complete React Hook Example

Here's a complete React hook implementation:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
  duration_ms: number
}

export function useSpotifyPlayer() {
  const { data: session } = useSession()
  const [player, setPlayer] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const playerRef = useRef<any>(null)
  
  useEffect(() => {
    if (!session?.accessToken) return
    
    // Create and load the SDK script
    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Your Web Player',
        getOAuthToken: (cb) => { cb(session.accessToken) },
        volume: 0.5
      })

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id)
        setDeviceId(device_id)
        setIsReady(true)
        setError(null)
      })

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id)
        setIsReady(false)
      })

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) {
          setIsActive(false)
          return
        }

        setCurrentTrack(state.track_window.current_track)
        setIsPaused(state.paused)
        setPosition(state.position)
        setDuration(state.track_window.current_track?.duration_ms || 0)
        setIsActive(true)
      })

      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        setError(`Initialization Error: ${message}`)
      })

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        setError(`Authentication Error: ${message}`)
      })

      spotifyPlayer.addListener('account_error', ({ message }) => {
        setError(`Account Error: ${message}`)
      })

      playerRef.current = spotifyPlayer
      setPlayer(spotifyPlayer)

      spotifyPlayer.connect()
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect()
      }
    }
  }, [session?.accessToken])

  const play = useCallback(async (contextUri?: string, uris?: string[]) => {
    if (!deviceId || !session?.accessToken) return

    const body: any = {}
    if (contextUri) body.context_uri = contextUri
    if (uris) body.uris = uris

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    } catch (error) {
      console.error('Playback failed:', error)
    }
  }, [deviceId, session?.accessToken])

  const togglePlayPause = useCallback(() => {
    if (player) {
      player.togglePlay()
    }
  }, [player])

  const nextTrack = useCallback(() => {
    if (player) {
      player.nextTrack()
    }
  }, [player])

  const previousTrack = useCallback(() => {
    if (player) {
      player.previousTrack()
    }
  }, [player])

  const seek = useCallback((position: number) => {
    if (player) {
      player.seek(position)
    }
  }, [player])

  const setVolume = useCallback((volume: number) => {
    if (player) {
      player.setVolume(volume)
    }
  }, [player])

  return {
    player,
    isReady,
    isActive,
    isPaused,
    currentTrack,
    position,
    duration,
    deviceId,
    error,
    play,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
  }
}
```

## Common Issues & Troubleshooting

### 1. EME/DRM Errors
```
EMEError: No supported keysystem was found
```

**Solution:**
- Ensure you're testing in a supported browser (Chrome, Safari, Edge)
- Test in a real browser, not a headless/test environment
- Check that DRM/Widevine is enabled in browser settings

### 2. Authentication Errors
```
Authentication Error: Invalid access token
```

**Solutions:**
- Verify your access token includes the `streaming` scope
- Check token expiration and refresh if needed
- Ensure Premium Spotify account

### 3. Account Errors
```
Account Error: Premium required
```

**Solution:**
- Web Playback SDK requires Spotify Premium subscription
- Mobile-only premium plans are not supported

### 4. Permissions Policy Violations
```
Permissions policy violation: unload is not allowed
```

**Solution:**
- Use dynamic script loading instead of static HTML script tags
- Avoid loading multiple SDK instances

### 5. iOS Limitations
- Playbook doesn't start automatically after transferring playback
- User must interact with the SDK events to play audio
- This is a known iOS limitation

## Best Practices

1. **Single Player Instance:** Only create one player instance per page
2. **Dynamic Loading:** Load the SDK script dynamically in React components
3. **Error Handling:** Always implement comprehensive error listeners
4. **Token Management:** Implement automatic token refresh
5. **Device Management:** Handle device connection/disconnection gracefully
6. **User Feedback:** Provide clear UI feedback for connection states

## Legal & Compliance

- This SDK must not be used in commercial projects without Spotify's prior written approval
- Review [Developer Terms of Use](https://developer.spotify.com/terms)
- Comply with [Developer Policy](https://developer.spotify.com/policy)

## Resources

- [Official Web Playback SDK Documentation](https://developer.spotify.com/documentation/web-playback-sdk)
- [Getting Started Tutorial](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started)
- [Complete Web App Example](https://developer.spotify.com/documentation/web-playback-sdk/howtos/web-app-player)
- [GitHub Example Repository](https://github.com/spotify/spotify-web-playback-sdk-example)
- [Developer Community](https://community.spotify.com/t5/Spotify-for-Developers/bd-p/Spotify_Developer)