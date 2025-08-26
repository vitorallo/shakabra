# AI DJ Party Player - Claude Code Instructions

## Project Initialization Commands

### 1. Name of the app: Shakabrà

### 2. Initialize Electron + React Project
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

## Claude Code Task Instructions

When using Claude Code, provide these specific instructions:

### Initial Project Setup
```
Create an AI DJ Party Player desktop application using Electron + React + TypeScript with the following requirements:

ARCHITECTURE:
- Electron main process for system integration
- React frontend with TypeScript
- Zustand for state management  
- Tailwind CSS for styling
- Axios for HTTP requests

PROJECT STRUCTURE:
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

CORE FEATURES TO IMPLEMENT:
1. Spotify OAuth authentication with PKCE flow
2. Playlist fetching and display
3. Audio features analysis integration
4. AI mixing algorithm for track selection
5. Spotify Connect playback controls
6. Real-time audio visualization
7. Party mode automation

START WITH: Basic Electron app setup, Spotify authentication, and playlist display
```

### Spotify Integration Task
```
Implement Spotify Web API integration with these specifications:

AUTHENTICATION:
- Use Authorization Code with PKCE flow
- Required scopes: user-read-playback-state, user-modify-playback-state, playlist-read-private, user-read-currently-playing, user-library-read
- Store tokens securely using electron-store
- Handle token refresh automatically

API ENDPOINTS TO INTEGRATE:
- GET /me/playlists (user playlists)
- GET /playlists/{id}/tracks (playlist tracks)
- GET /audio-features/{ids} (track audio analysis)
- PUT /me/player/play (start playback)
- POST /me/player/queue (add to queue)
- GET /me/player (current playback state)

ERROR HANDLING:
- Rate limiting (429 responses)
- Network connectivity issues
- Token expiration
- Device not found errors

CREATE:
- SpotifyService class for API calls
- Authentication flow components
- Token management utilities
- API response type definitions
```

### AI DJ Engine Task
```
Create the core AI DJ mixing engine with these requirements:

ALGORITHM SPECIFICATIONS:
- Analyze track compatibility using Spotify audio features
- Match tempos within ±5% BPM tolerance
- Transition between compatible energy levels (±0.2 difference)
- Maintain mood progression (valence scoring)
- Avoid key clashes using circle of fifths
- Calculate optimal transition timing

COMPATIBILITY SCORING:
Weight factors:
- Tempo compatibility: 30%
- Energy progression: 25%
- Key harmony: 20%
- Genre similarity: 15%
- Mood flow: 10%

MIXING LOGIC:
- Select next track 30 seconds before current track ends
- Calculate crossfade duration based on track characteristics
- Implement party progression (gradual energy increase)
- Prevent track repetition within 2-hour window
- Emergency skip functionality

CREATE:
- MixEngine class with track selection logic
- AudioAnalyzer for feature processing
- TransitionCalculator for timing
- PlaylistManager for queue management
```

### UI Components Task
```
Build the user interface with these components:

MAIN LAYOUT:
- Header with app branding and user info
- Sidebar for playlist selection and settings
- Main content area with now playing and controls
- Footer with playback controls and volume

KEY COMPONENTS:
1. PlaylistSelector - dropdown with user playlists
2. NowPlaying - current track info with album art
3. NextUpPreview - AI-selected next track
4. MixControls - crossfade, energy, manual override
5. AudioVisualizer - real-time waveform display
6. PartyModeToggle - enable/disable auto-DJ
7. TrackHistory - recently played tracks
8. SettingsPanel - user preferences

DESIGN REQUIREMENTS:
- Dark theme optimized for party environments
- Large touch targets for easy control
- Responsive layout for different screen sizes
- Smooth animations and transitions
- Accessibility compliance (WCAG 2.1)

STYLING:
Use Tailwind CSS with custom color palette:
- Primary: Deep purple (#8B5CF6)
- Secondary: Electric blue (#06B6D4)  
- Accent: Neon green (#10B981)
- Background: Dark gray (#1F2937)
```

### State Management Task
```
Implement application state management using Zustand:

STORE STRUCTURE:
- AuthStore: user authentication state
- PlaylistStore: playlist data and selection
- PlayerStore: current playback state
- MixStore: DJ engine state and queue
- SettingsStore: user preferences

STATE ACTIONS:
AuthStore:
- login(), logout(), refreshToken()
- setUser(), setTokens(), clearAuth()

PlaylistStore:
- loadPlaylists(), selectPlaylist()
- setTracks(), updateTrackFeatures()

PlayerStore:
- setCurrentTrack(), setPlaybackState()
- updateProgress(), setVolume()

MixStore:
- setNextTrack(), updateQueue()
- setMixMode(), calculateTransition()
- addToHistory(), skipTrack()

PERSISTENCE:
- Save authentication tokens securely
- Cache playlist data locally
- Store user preferences
- Maintain playback history
```

### Error Handling & Polish Task
```
Implement comprehensive error handling and app polish:

ERROR SCENARIOS:
- Spotify API rate limiting
- Network connectivity issues
- Device not available for playback
- Invalid or expired authentication
- Insufficient Spotify permissions
- Track unavailable in user's region

USER FEEDBACK:
- Toast notifications for actions
- Loading states for API calls
- Progress indicators for long operations
- Graceful degradation when offline
- Clear error messages with solutions

PERFORMANCE OPTIMIZATION:
- Lazy load playlist tracks
- Cache audio features data
- Debounce API calls
- Optimize React re-renders
- Implement virtual scrolling for large playlists

FINAL POLISH:
- App icon and branding
- Keyboard shortcuts
- Context menus
- Drag and drop support
- Window state persistence
```

## Environment Variables Required

Create a `.env` file with:
```
SPOTIFY_CLIENT_ID=your_spotify_app_client_id
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

## Spotify App Registration Steps

1. Go to https://developer.spotify.com/dashboard
2. Create new app with these settings:
   - App Name: "AI DJ Party Player"
   - App Description: "Intelligent DJ mixing application"
   - Website: your_website_or_github_repo
   - Redirect URI: http://localhost:3000/callback
   - API: Web API
3. Copy Client ID to environment variables
4. Add app to development mode users

## Development Workflow

1. Run Claude Code in project directory
2. Provide specific task instructions above
3. Test each feature incrementally
4. Run `npm run dev` to test in development
5. Use `npm run build` for production builds

## Testing Strategy

- Unit tests for mixing algorithms
- Integration tests for Spotify API
- E2E tests for user workflows
- Performance testing with large playlists
- User acceptance testing at actual parties

This setup provides Claude Code with everything needed to build your AI DJ Party Player application systematically.