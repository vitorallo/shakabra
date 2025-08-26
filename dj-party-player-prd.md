# AI DJ Party Player - Product Requirements Document

## Project Overview

### Vision
Create an intelligent DJ application that automatically mixes music from Spotify playlists using AI to analyze tempo, mood, and energy levels for seamless transitions at parties and events.

### Target Platform
- Primary: macOS desktop application
- Secondary: Cross-platform support (Windows, Linux)
- Technology: Electron + React for modern UI and portability

## Core Features

### 1. Spotify Integration
- **Authentication**: OAuth 2.0 with PKCE flow
- **Required Scopes**: 
  - `user-read-playback-state`
  - `user-modify-playback-state` 
  - `playlist-read-private`
  - `user-read-currently-playing`
  - `user-library-read`
- **Playlist Access**: Read user's playlists and track metadata
- **Playback Control**: Start, pause, skip, queue tracks via Spotify Connect

### 2. AI DJ Engine
- **Audio Analysis**: Utilize Spotify's Audio Features API
  - Tempo (BPM)
  - Energy level (0-1)
  - Danceability (0-1)
  - Valence (mood: 0-1)
  - Key and mode
  - Loudness
- **Smart Mixing Algorithm**:
  - Match compatible tempos (±5% BPM tolerance)
  - Transition between similar energy levels
  - Maintain mood flow throughout set
  - Avoid key clashes when possible
- **Transition Timing**: Calculate optimal mix-out points based on track structure

### 3. User Interface Components

#### Main Dashboard
- **Now Playing**: Current track info with waveform visualization
- **Next Up**: AI-selected next track with transition preview
- **Playlist Selector**: Dropdown to choose source playlist
- **Party Mode Toggle**: Enable/disable automatic DJ mixing

#### Control Panel
- **Manual Override**: Skip, pause, or manually select next track
- **Mix Settings**: 
  - Crossfade duration (1-12 seconds)
  - Energy progression (maintain/build/vary)
  - Genre mixing preferences
- **Volume Control**: Master volume slider

#### Analytics Dashboard
- **Set Statistics**: Total tracks played, mix accuracy, energy flow chart
- **Track History**: Recently played with transition ratings
- **Crowd Feedback**: Simple thumbs up/down for track selections

### 4. Smart Features
- **Party Progression**: Gradually increase energy over time
- **Duplicate Prevention**: Avoid replaying same tracks within 2 hours
- **Emergency Skip**: Quick skip for inappropriate tracks
- **Seamless Handoff**: Manual DJ takeover without interruption

## Technical Specifications

### Architecture
```
Frontend: React + TypeScript + Tailwind CSS
Desktop: Electron (main process + renderer)
State Management: Zustand
HTTP Client: Axios for Spotify API calls
Audio Visualization: Web Audio API + Canvas
Build Tool: Vite
```

### API Integration
- **Spotify Web API**: REST endpoints for playlists, tracks, playback
- **Rate Limiting**: Respect Spotify's rate limits (100 requests/hour per user)
- **Caching**: Cache audio features and track metadata locally
- **Offline Handling**: Graceful degradation when connectivity lost

### Data Models

#### Track Model
```typescript
interface Track {
  id: string;
  name: string;
  artists: Artist[];
  duration_ms: number;
  preview_url?: string;
  audio_features: AudioFeatures;
  mix_rating?: number; // AI-calculated mixability score
}
```

#### Audio Features Model
```typescript
interface AudioFeatures {
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  key: number;
  mode: number;
  loudness: number;
  time_signature: number;
}
```

#### Mix Transition Model
```typescript
interface MixTransition {
  from_track: string;
  to_track: string;
  transition_point_ms: number;
  crossfade_duration: number;
  compatibility_score: number;
  mix_technique: 'tempo_match' | 'energy_build' | 'key_harmony';
}
```

## Development Phases

### Phase 1: Foundation (Week 1-2)
- Set up Electron + React project structure
- Implement Spotify OAuth authentication
- Create basic UI layout and navigation
- Fetch and display user playlists

### Phase 2: Core DJ Engine (Week 3-4)
- Integrate Spotify Audio Features API
- Develop mixing algorithm and track compatibility scoring
- Implement automatic track selection logic
- Add basic playback control via Spotify Connect

### Phase 3: Advanced Features (Week 5-6)
- Build audio visualization components
- Add manual override controls
- Implement party progression algorithms
- Create settings and preferences panel

### Phase 4: Polish & Testing (Week 7-8)
- Performance optimization and caching
- Error handling and offline scenarios
- User testing and feedback integration
- Prepare for distribution (code signing, notarization)

## Success Metrics
- **User Engagement**: Average session duration >30 minutes
- **Mix Quality**: <5% manual skips during auto-DJ mode
- **Performance**: <2 second track transition delays
- **Reliability**: 99%+ uptime during party sessions

## Technical Constraints
- Spotify Premium required for full track playback
- Internet connection required for streaming
- Limited to Spotify's crossfade capabilities (max 12 seconds)
- Cannot modify audio stream directly (no pitch/tempo adjustment)
- Rate limited by Spotify API quotas

## Future Enhancements
- Multi-room sync for larger venues
- Integration with other streaming services
- Advanced audio effects (when possible)
- Social features (collaborative playlists, voting)
- Analytics and reporting for professional DJs

## Risk Mitigation
- **API Changes**: Monitor Spotify developer updates, maintain API wrapper abstraction
- **Rate Limiting**: Implement intelligent caching and request batching
- **User Authentication**: Handle token refresh and re-authentication flows
- **Performance**: Optimize for low-end hardware, implement efficient caching

## Development Environment Setup
See accompanying setup instructions for detailed development environment configuration and Claude Code integration.