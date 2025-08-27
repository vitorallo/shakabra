# Core AI Mixing Component Documentation

## Overview

The Shakabra AI DJ mixing engine is a sophisticated system that automatically selects and mixes tracks from Spotify playlists using professional DJ techniques and music analysis algorithms. This document serves as a technical reference for the core AI mixing components implemented in Phase 6.

## Architecture

### Core Components

1. **Audio Analysis Engine** (`lib/ai-mixing/audio-analysis.ts`)
2. **DJ Engine** (`lib/ai-mixing/dj-engine.ts`) 
3. **State Management** (`stores/dj-store.ts`)
4. **UI Demo Component** (`components/ui/ai-dj-demo.tsx`)

## Audio Analysis Engine

### Location: `lib/ai-mixing/audio-analysis.ts`

The audio analysis engine forms the foundation of the AI mixing system, providing sophisticated algorithms for track compatibility assessment.

### Key Functions

#### Tempo Compatibility
```typescript
export function calculateTempoCompatibility(
  currentFeatures: AudioFeatures,
  nextFeatures: AudioFeatures
): number
```
- **Purpose**: Determines if two tracks can be mixed smoothly based on BPM
- **Algorithm**: Uses ±5% BPM tolerance for professional DJ standards
- **Returns**: Score 0-1 (1 = perfect match, 0 = incompatible)

#### Energy Progression Analysis
```typescript
export function calculateEnergyProgression(
  currentTrack: DJTrack,
  nextTrack: DJTrack,
  partyPhase: PartyPhase
): number
```
- **Purpose**: Ensures energy flow matches party progression (warmup → peak → cooldown)
- **Algorithm**: Adaptive energy curve based on session time and current phase
- **Party Phases**: WARMUP, BUILDUP, PEAK, SUSTAIN, COOLDOWN

#### Harmonic Mixing (Camelot Wheel)
```typescript
export function calculateKeyCompatibility(
  currentFeatures: AudioFeatures,
  nextFeatures: AudioFeatures
): number
```
- **Purpose**: Professional harmonic mixing using Camelot Wheel system
- **Algorithm**: Maps musical keys to Camelot notation, finds compatible transitions
- **Compatibility Rules**: Same key, adjacent keys, or relative major/minor

#### Genre Flow Analysis
```typescript
export function calculateGenreCompatibility(
  currentTrack: DJTrack,
  nextTrack: DJTrack
): number
```
- **Purpose**: Ensures smooth genre transitions without jarring changes
- **Algorithm**: Genre similarity scoring with transition penalties
- **Features**: Progressive genre evolution over session duration

### Audio Features Interface
```typescript
interface AudioFeatures {
  tempo: number          // BPM (beats per minute)
  energy: number         // 0.0-1.0 energy level
  danceability: number   // 0.0-1.0 danceability score
  valence: number        // 0.0-1.0 mood positivity
  key: number           // Pitch class (0-11)
  mode: number          // Major (1) or Minor (0)
  acousticness: number  // 0.0-1.0 acoustic vs electronic
  instrumentalness: number // 0.0-1.0 vocal vs instrumental
  liveness: number      // 0.0-1.0 live performance detection
  loudness: number      // dB, typically -60 to 0
}
```

## DJ Engine

### Location: `lib/ai-mixing/dj-engine.ts`

The DJ Engine is the "brain" of the AI system, managing sessions and making intelligent track selection decisions.

### Core Classes

#### AIDJEngine
```typescript
export class AIDJEngine {
  private session: DJSession | null = null
  private trackPool: DJTrack[] = []
  private playHistory: string[] = []
  private partyPhaseManager: PartyPhaseManager
}
```

**Key Methods:**
- `startSession(tracks: DJTrack[]): DJSession` - Initialize mixing session
- `getNextTrack(): DJTrack | null` - AI-powered next track selection
- `addTracks(tracks: DJTrack[]): void` - Expand available track pool
- `skipTrack(): void` - Skip current track and select new one

#### Advanced Track Selection Algorithm
```typescript
getNextTrack(): DJTrack | null {
  const currentTrack = this.getCurrentTrack()
  if (!currentTrack) return this.selectFirstTrack()

  // Get available tracks (exclude recently played)
  const candidates = this.getAvailableTracks()
  
  // Find best matches using multi-factor analysis
  const bestTracks = findBestNextTracks(
    currentTrack.audioFeatures,
    candidates,
    this.partyPhaseManager.getCurrentPhase()
  )
  
  // Apply AI selection with randomization
  return this.applyAISelection(bestTracks)
}
```

#### Party Phase Management
```typescript
class PartyPhaseManager {
  private sessionStartTime: Date
  private sessionDuration: number // Target duration in minutes
  
  getCurrentPhase(): PartyPhase {
    const elapsed = this.getElapsedMinutes()
    const progress = elapsed / this.sessionDuration
    
    if (progress < 0.15) return PartyPhase.WARMUP
    if (progress < 0.35) return PartyPhase.BUILDUP  
    if (progress < 0.65) return PartyPhase.PEAK
    if (progress < 0.85) return PartyPhase.SUSTAIN
    return PartyPhase.COOLDOWN
  }
}
```

### Compatibility Scoring System

The AI uses a weighted scoring system to evaluate track compatibility:

```typescript
interface CompatibilityWeights {
  tempo: 0.30      // 30% - Most important for seamless mixing
  energy: 0.25     // 25% - Maintains party energy flow  
  key: 0.20        // 20% - Harmonic compatibility
  genre: 0.15      // 15% - Genre flow consistency
  mood: 0.10       // 10% - Emotional progression
}
```

**Total Compatibility Score:**
```
score = (tempo_score × 0.30) + (energy_score × 0.25) + 
        (key_score × 0.20) + (genre_score × 0.15) + (mood_score × 0.10)
```

## State Management

### Location: `stores/dj-store.ts`

Zustand-based reactive state management for the AI DJ system.

### Store Interface
```typescript
interface DJState {
  // Engine State
  djEngine: AIDJEngine | null
  currentSession: DJSession | null
  isSessionActive: boolean
  
  // Track Management  
  currentTrack: DJTrack | null
  nextTrack: DJTrack | null
  trackPool: DJTrack[]
  playHistory: DJTrack[]
  
  // Session Controls
  sessionSettings: SessionSettings
  partyPhase: PartyPhase
  
  // Actions
  startSession: (tracks: DJTrack[]) => Promise<void>
  stopSession: () => void
  skipToNext: () => Promise<void>
  updateSettings: (settings: Partial<SessionSettings>) => void
}
```

### Key Features
- **Persistence**: Session state persisted to localStorage
- **Reactive Updates**: Real-time UI updates when tracks change
- **Error Handling**: Robust error management with user feedback
- **Performance**: Optimized with Zustand's selective subscriptions

## Data Types

### Core Interfaces

#### DJTrack
```typescript
interface DJTrack {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; width?: number; height?: number }>
    release_date: string
  }
  duration_ms: number
  preview_url: string | null
  external_urls: { spotify: string }
  popularity: number
  audioFeatures: AudioFeatures
  genre?: string
  addedAt: Date
}
```

#### DJSession
```typescript
interface DJSession {
  id: string
  startTime: Date
  plannedDuration: number // minutes
  currentTrackIndex: number
  trackQueue: DJTrack[]
  playHistory: DJTrack[]
  settings: SessionSettings
  partyPhase: PartyPhase
  stats: SessionStats
}
```

#### SessionSettings
```typescript
interface SessionSettings {
  targetDuration: number      // minutes
  energyProgression: 'auto' | 'manual'
  genreMixing: 'strict' | 'flexible' | 'adventurous'
  keyMixing: boolean         // Enable harmonic mixing
  crossfadeDuration: number  // seconds
  avoidRecentTracks: number  // minutes
}
```

## AI Algorithm Details

### Track Selection Process

1. **Candidate Filtering**
   - Remove recently played tracks (default: 30 minutes)
   - Ensure minimum track pool size (fall back if needed)
   - Apply user preferences and filters

2. **Compatibility Analysis**
   - Calculate tempo compatibility (±5% tolerance)
   - Analyze energy progression for party phase
   - Check harmonic compatibility (Camelot Wheel)
   - Evaluate genre flow appropriateness
   - Score mood transition smoothness

3. **AI Selection**
   - Weight all compatibility scores
   - Apply randomization (20% random selection from top candidates)
   - Consider user feedback and skip patterns
   - Select optimal next track

### Professional DJ Standards

The AI follows established DJ mixing principles:

- **BPM Matching**: ±5% tempo tolerance for seamless transitions
- **Harmonic Mixing**: Camelot Wheel system for key compatibility
- **Energy Management**: Strategic energy flow throughout session
- **Genre Transitions**: Gradual evolution vs. jarring changes  
- **Track Spacing**: Avoid repetition within 2-hour windows
- **Crossfading**: Professional 8-12 second overlaps

### Performance Optimizations

- **Audio Features Caching**: Spotify API responses cached locally
- **Lazy Loading**: Track analysis performed on-demand
- **Web Workers**: Heavy computations moved off main thread
- **IndexedDB**: Offline storage for session persistence
- **Debounced Updates**: Reduced state update frequency

## Testing and Validation

### Unit Tests Coverage
- Audio analysis algorithm accuracy
- DJ engine track selection logic  
- State management consistency
- Error handling robustness

### Integration Tests
- Spotify API compatibility
- Real playlist analysis
- Session lifecycle management
- Cross-browser functionality

### Performance Benchmarks
- Track analysis speed: <100ms per track
- Selection algorithm: <50ms execution time
- Memory usage: <50MB for 1000-track sessions
- UI responsiveness: 60fps maintained

## Future Enhancements

### Planned Features
- **Machine Learning**: User preference learning over time
- **Social Integration**: Collaborative mixing with multiple users
- **Hardware Support**: DJ controller integration via Web MIDI
- **Advanced Analytics**: Detailed session performance metrics
- **Cloud Sync**: Cross-device session synchronization

### Algorithm Improvements
- **Dynamic Weighting**: Adaptive scoring based on user feedback
- **Mood Detection**: Advanced emotional analysis of tracks
- **Venue Adaptation**: Algorithm tuning for different environments
- **Crowd Response**: Integration with external feedback systems

## Usage Examples

### Basic Session Start
```typescript
const djStore = useDJStore()

// Start AI mixing session
await djStore.startSession(playlistTracks)

// Get current status
const isActive = djStore.isSessionActive
const currentTrack = djStore.currentTrack
const nextTrack = djStore.nextTrack
```

### Custom Settings
```typescript
djStore.updateSettings({
  targetDuration: 120,      // 2 hour party
  energyProgression: 'auto',
  genreMixing: 'flexible',  
  keyMixing: true,
  crossfadeDuration: 8
})
```

### Manual Control
```typescript
// Skip to next AI-selected track
await djStore.skipToNext()

// Stop session
djStore.stopSession()
```

This AI mixing system represents a professional-grade solution for automated DJ mixing, combining music theory, data science, and modern web technologies to create seamless party experiences.