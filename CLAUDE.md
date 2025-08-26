# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the AI DJ Party Player project - an Electron desktop application that automatically mixes music from Spotify playlists using AI to analyze tempo, mood, and energy levels for seamless transitions.

## Project Status

Currently in planning phase. The project has not been initialized yet. Use the setup instructions below to begin development.

## Initial Project Setup

The project should be initialized using Electron + React + TypeScript:

```bash
# Initialize with Vite + React + TypeScript template
npm create electron-vite@latest . -- --template react-ts
npm install

# Install additional dependencies
npm install axios zustand lucide-react tailwindcss @tailwindcss/forms
npm install -D @types/spotify-web-api-node

# Install Electron specific packages
npm install electron-store electron-updater
```

## Architecture

**Tech Stack:**
- Frontend: React + TypeScript + Tailwind CSS
- Desktop: Electron (main process + renderer)
- State Management: Zustand
- HTTP Client: Axios for Spotify API calls
- Audio Visualization: Web Audio API + Canvas
- Build Tool: Vite

**Project Structure:**
```
src/
├── main/           # Electron main process
├── renderer/       # React frontend
│   ├── components/ # React components
│   ├── hooks/      # Custom React hooks
│   ├── services/   # API services
│   ├── stores/     # Zustand stores
│   ├── types/      # TypeScript interfaces
│   └── utils/      # Helper functions
├── shared/         # Shared types and utilities
└── preload/        # Electron preload scripts
```

## Development Commands

Once initialized:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter (if configured)
- `npm run test` - Run tests (if configured)

Debug and run the app using MCP Microsoft Playwrite

## Environment Configuration

Create a `.env` file with:
```
SPOTIFY_CLIENT_ID=your_spotify_app_client_id
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

## Spotify Integration Requirements

**Authentication:**
- Use Authorization Code with PKCE flow (latest recommended method)
- Required scopes: user-read-playback-state, user-modify-playback-state, playlist-read-private, user-read-currently-playing, user-library-read
- Store tokens securely using electron-store
- **IMPORTANT**: Player control APIs require Spotify Premium subscription

**Latest Spotify Web API Endpoints (2025):**
- **GET /me/player** - Get current playback state (supports market, additional_types params)
- **PUT /me/player/play** - Start/resume playback (supports context_uri, uris, offset in body)
- **PUT /me/player/pause** - Pause playback
- **POST /me/player/queue** - Add tracks to queue (CRITICAL for DJ mixing)
- **GET /me/player/queue** - Get current playback queue
- **POST /me/player/next** - Skip to next track
- **POST /me/player/previous** - Skip to previous track  
- **PUT /me/player/seek** - Seek to position (for crossfading)
- **PUT /me/player/volume** - Set volume (0-100)
- **PUT /me/player/shuffle** - Toggle shuffle mode
- **PUT /me/player/repeat** - Set repeat mode (track/context/off)
- **GET /me/player/devices** - Get available devices
- **GET /me/player/recently-played** - Recently played tracks
- **GET /me/playlists** - User playlists
- **GET /playlists/{id}/tracks** - Playlist tracks
- **GET /audio-features/{ids}** - Track audio analysis (tempo, energy, key, etc.)

**Web Playback SDK Integration:**
```javascript
window.onSpotifyWebPlaybackSDKReady = () => {
  const token = '[OAuth_token]';
  const player = new Spotify.Player({
    name: 'AI DJ Party Player',
    getOAuthToken: cb => { cb(token); },
    volume: 0.5,
    enableMediaSession: true // Enable media controls
  });
}
```

**Rate Limiting & Error Handling:**
- Handle 429 responses (rate limiting) with exponential backoff
- Handle 401 (token expiration) with automatic refresh
- Handle 403 (Premium required) with user notification

## Core Features to Implement

1. **Spotify OAuth authentication** with secure token storage
2. **Playlist management** - fetch and display user playlists
3. **AI mixing engine** - analyze track compatibility using Spotify audio features
4. **Automatic DJ mode** - seamless track transitions based on tempo, energy, key harmony
5. **Manual controls** - override AI selections, crossfade controls
6. **Audio visualization** - real-time waveform display
7. **Party progression** - gradually increase energy over time

## AI Mixing Algorithm Specifications

**Compatibility Scoring Weights:**
- Tempo compatibility: 30%
- Energy progression: 25%
- Key harmony: 20%
- Genre similarity: 15%
- Mood flow: 10%

**Mixing Logic:**
- Match tempos within ±5% BPM tolerance
- Transition between compatible energy levels (±0.2 difference)
- Use circle of fifths for key harmony
- Select next track 30 seconds before current track ends
- Prevent track repetition within 2-hour window

## State Management (Zustand)

**Store Structure:**
- AuthStore: user authentication state
- PlaylistStore: playlist data and selection
- PlayerStore: current playback state
- MixStore: DJ engine state and queue
- SettingsStore: user preferences

## Error Handling Priorities

- Spotify API rate limiting (429 responses)
- Network connectivity issues
- Token expiration and refresh
- Device not found errors
- Track unavailable in user's region

## Design Guidelines

- Dark theme optimized for party environments
- Large touch targets for easy control
- Custom color palette: Deep purple (#8B5CF6), Electric blue (#06B6D4), Neon green (#10B981)
- Accessibility compliance (WCAG 2.1)