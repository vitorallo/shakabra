# Spotify Web Player DRM Troubleshooting Guide

## The Issue

The Spotify Web Playback SDK requires DRM (Digital Rights Management) support through EME (Encrypted Media Extensions) to play protected content. When the player gets stuck in "Connected but never ready" state, it's typically a DRM/EME browser compatibility issue.

## What's Happening

1. **SDK Loads Successfully** ✅ - The Spotify Web Playback SDK JavaScript loads
2. **Player Connects** ✅ - Connection to Spotify servers established
3. **Device Registers** ✅ - Your browser appears as "Shakabra - AI DJ Party Player" in Spotify Connect
4. **DRM Fails** ❌ - Browser cannot initialize protected content playback
5. **Player Never Ready** ❌ - The "ready" event never fires, player stays inactive

## Solutions

### 1. Use a DRM-Compatible Browser

**Best Options:**
- **Google Chrome** (recommended) - Best DRM support
  - Enable Hardware Acceleration: Settings → Advanced → System → Use hardware acceleration
  - Clear cache and cookies for Spotify domains
  
- **Safari on macOS** - Native DRM support on Apple devices
  - Works well with FairPlay DRM
  
- **Microsoft Edge** - Built on Chromium with good DRM support

**Limited Support:**
- **Firefox** - May work but less reliable for Spotify Web SDK
- **Brave** - Often blocks DRM by default (needs to be enabled)

### 2. Enable DRM in Your Browser

**Chrome:**
1. Go to `chrome://settings/content/protectedContent`
2. Enable "Allow sites to play protected content"

**Firefox:**
1. Go to `about:preferences#general`
2. Under "Digital Rights Management (DRM) Content"
3. Check "Play DRM-controlled content"

**Brave:**
1. Go to `brave://settings/content/protectedContent`
2. Enable Widevine support

### 3. Use HTTPS in Production

DRM often requires secure contexts:
- Development: Use `127.0.0.1:3000` instead of `localhost:3000`
- Production: Deploy with HTTPS enabled

### 4. Check Corporate/Network Restrictions

Some networks block DRM protocols:
- Corporate firewalls may block Widevine CDM downloads
- VPNs can interfere with DRM verification
- Try on a personal network or mobile hotspot

## Alternative: Spotify Connect Mode

When Web Playback SDK doesn't work due to DRM issues, the app now supports **Spotify Connect Mode**:

1. **Player Connects** - Device registers with Spotify
2. **Use Any Spotify App** - Open Spotify on phone/desktop
3. **Select Output Device** - Choose "Shakabra - AI DJ Party Player"
4. **Control Playback** - Use the Spotify app to play music
5. **Web App as Remote** - The web app becomes a remote control

## Testing Your Setup

Use the **"Test Play"** button when the player shows as connected:
- If music plays: DRM is working! 
- If nothing happens: DRM is blocked, use Spotify Connect mode

## Implementation Details

The updated implementation includes:

```typescript
// Automatic DRM detection
if (!navigator.requestMediaKeySystemAccess) {
  // Browser doesn't support EME/DRM
}

// Timeout detection for DRM failures
setTimeout(() => {
  if (connected && !ready) {
    // DRM likely failed, enable Spotify Connect mode
  }
}, 10000)

// Test playback function
testSpotifyPlayback(accessToken, deviceId)
```

## Browser Console Debugging

Check browser console for these indicators:

**Success:**
```
✅ Spotify Web Playback SDK Ready
✅ Spotify Player Connected Successfully
✅ Spotify Player Ready with Device ID xxx
```

**DRM Failure:**
```
✅ Spotify Player Connected Successfully
⚠️ Player connected but never became ready - likely DRM/EME issue
```

## Common Error Messages

- `EMEError: No supported keysystem was found` - DRM not available
- `Failed to initialize player` - Often DRM related
- `Account Error: Premium required` - Need Spotify Premium
- `Authentication Error` - Token expired or invalid scopes

## Fallback Options

1. **Open Spotify App** - Button to launch native Spotify
2. **Spotify Connect** - Use as remote control
3. **Web API Only** - Control playback via API calls to existing devices

## Development vs Production

**Development Issues:**
- `localhost` may have DRM restrictions
- Self-signed certificates block DRM
- Browser developer mode can interfere

**Production Solutions:**
- Valid HTTPS certificate required
- Proper domain (not IP address)
- Content Security Policy must allow media

## Resources

- [Spotify Web Playback SDK Docs](https://developer.spotify.com/documentation/web-playback-sdk)
- [EME/DRM Browser Support](https://caniuse.com/eme)
- [Chrome DRM Troubleshooting](https://support.google.com/chrome/answer/6138475)