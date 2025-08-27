/**
 * AI DJ Engine - Intelligent Music Mixing System
 * 
 * This is the core AI DJ brain that automatically selects tracks, manages transitions,
 * and maintains optimal energy flow throughout a DJ set.
 */

import {
  AudioFeatures,
  TrackCompatibilityScore,
  calculateTrackCompatibility,
  findBestNextTracks,
  MIXING_WEIGHTS
} from './audio-analysis'
import { SpotifyTrack } from '@/lib/spotify'

export interface DJTrack extends SpotifyTrack {
  audioFeatures: AudioFeatures
  playCount?: number
  lastPlayed?: Date
  userRating?: number // 1-5 stars
  skipCount?: number
}

export interface DJSession {
  id: string
  startTime: Date
  endTime?: Date
  tracks: DJTrack[]
  currentTrackIndex: number
  partyPhase: 'warmup' | 'peak' | 'cooldown'
  energyTarget: number // 0.0 to 1.0 - desired energy level
  playedTracks: Set<string> // Track IDs to avoid repetition
  settings: DJSettings
}

export interface DJSettings {
  // AI Mixing Preferences
  energyVariation: number      // 0.1-0.5 - how much energy can vary
  tempoTolerance: number       // 0.03-0.1 - BPM matching strictness 
  avoidRepeats: number         // 30-180 mins - min time between repeats
  crossfadeDuration: number    // 3-30 seconds
  
  // Musical Preferences  
  favoriteGenres: string[]     // Boost tracks matching these genres
  moodPreference: number       // -1 to 1 - sad to happy bias
  instrumentalBias: number     // 0-1 - preference for instrumental tracks
  
  // Party Management
  peakHour: number            // Hour (0-23) when peak energy should occur
  sessionDuration: number     // Expected session length in minutes
  
  // Advanced Options
  enableHarmonicMixing: boolean
  enableEnergyManagement: boolean
  enableCrowdFeedback: boolean // Future: crowd response integration
}

export const DEFAULT_DJ_SETTINGS: DJSettings = {
  energyVariation: 0.2,
  tempoTolerance: 0.05,
  avoidRepeats: 60,
  crossfadeDuration: 8,
  favoriteGenres: [],
  moodPreference: 0.1, // Slightly positive bias
  instrumentalBias: 0.3,
  peakHour: 22, // 10 PM
  sessionDuration: 180, // 3 hours
  enableHarmonicMixing: true,
  enableEnergyManagement: true,
  enableCrowdFeedback: false
}

/**
 * AI DJ Engine Class
 * Main controller for intelligent music mixing
 */
export class AIDJEngine {
  private session: DJSession | null = null
  private trackPool: DJTrack[] = []
  private settings: DJSettings

  constructor(settings: Partial<DJSettings> = {}) {
    this.settings = { ...DEFAULT_DJ_SETTINGS, ...settings }
  }

  /**
   * Initialize a new DJ session
   */
  startSession(initialTracks: DJTrack[], sessionId?: string): DJSession {
    this.session = {
      id: sessionId || `session_${Date.now()}`,
      startTime: new Date(),
      tracks: [],
      currentTrackIndex: 0,
      partyPhase: 'warmup',
      energyTarget: 0.4, // Start with moderate energy
      playedTracks: new Set(),
      settings: this.settings
    }

    this.trackPool = initialTracks
    
    // Select opening track (moderate energy, high danceability)
    const openingTrack = this.selectOpeningTrack()
    if (openingTrack) {
      this.session.tracks.push(openingTrack)
      this.session.playedTracks.add(openingTrack.id)
    }

    return this.session
  }

  /**
   * Get the next recommended track
   */
  getNextTrack(): DJTrack | null {
    if (!this.session || this.session.tracks.length === 0) {
      return null
    }

    const currentTrack = this.getCurrentTrack()
    if (!currentTrack) return null

    // Update party phase based on session progress
    this.updatePartyPhase()

    // Filter available tracks (remove recently played)
    const availableTracks = this.getAvailableTracks()
    
    if (availableTracks.length === 0) {
      return null // No tracks available
    }

    // Find best compatible tracks
    const candidates = availableTracks.map(track => ({
      trackId: track.id,
      features: track.audioFeatures
    }))

    const bestTracks = findBestNextTracks(
      currentTrack.audioFeatures,
      candidates,
      this.session.partyPhase,
      10 // Get top 10 candidates
    )

    if (bestTracks.length === 0) return null

    // Apply additional AI logic for final selection
    const selectedTrack = this.applyAISelection(bestTracks)
    
    if (selectedTrack) {
      // Add to session and mark as played
      this.session.tracks.push(selectedTrack)
      this.session.playedTracks.add(selectedTrack.id)
      this.session.currentTrackIndex++
    }

    return selectedTrack
  }

  /**
   * Select optimal opening track for the session
   */
  private selectOpeningTrack(): DJTrack | null {
    // Opening track criteria:
    // - Moderate energy (0.3-0.6)
    // - High danceability (0.6+)
    // - Accessible key/tempo
    // - Not too aggressive or intense
    
    const candidates = this.trackPool.filter(track => {
      const features = track.audioFeatures
      return (
        features.energy >= 0.3 && features.energy <= 0.6 &&
        features.danceability >= 0.6 &&
        features.valence >= 0.4 && // Positive mood
        features.speechiness <= 0.5 // Not too vocal-heavy
      )
    })

    if (candidates.length === 0) {
      // Fallback to any track if no ideal candidates
      return this.trackPool[0] || null
    }

    // Sort by opening track suitability
    return candidates.sort((a, b) => {
      const scoreA = this.calculateOpeningScore(a.audioFeatures)
      const scoreB = this.calculateOpeningScore(b.audioFeatures)
      return scoreB - scoreA
    })[0]
  }

  /**
   * Calculate opening track suitability score
   */
  private calculateOpeningScore(features: AudioFeatures): number {
    let score = 0
    
    // Energy sweet spot (0.4-0.5 ideal)
    const energyIdeal = 0.45
    score += 0.3 * (1 - Math.abs(features.energy - energyIdeal) * 2)
    
    // High danceability preferred
    score += 0.25 * features.danceability
    
    // Positive valence
    score += 0.2 * features.valence
    
    // Moderate tempo (120-130 BPM ideal for opening)
    const tempoIdeal = 125
    score += 0.15 * (1 - Math.abs(features.tempo - tempoIdeal) / 40)
    
    // Low speechiness (more musical)
    score += 0.1 * (1 - features.speechiness)
    
    return Math.max(0, Math.min(1, score))
  }

  /**
   * Update party phase based on session progress and time
   */
  private updatePartyPhase(): void {
    if (!this.session) return

    const sessionMinutes = (Date.now() - this.session.startTime.getTime()) / (1000 * 60)
    const totalDuration = this.settings.sessionDuration
    const progress = sessionMinutes / totalDuration

    // Current time of day
    const currentHour = new Date().getHours()
    
    // Determine phase based on progress and time
    if (progress < 0.25 || currentHour < this.settings.peakHour - 1) {
      this.session.partyPhase = 'warmup'
      this.session.energyTarget = 0.4 + (progress * 0.3) // 0.4 → 0.7
    } else if (progress < 0.75 && currentHour >= this.settings.peakHour - 1 && currentHour <= this.settings.peakHour + 2) {
      this.session.partyPhase = 'peak'
      this.session.energyTarget = 0.7 + (Math.sin(progress * Math.PI) * 0.2) // 0.7-0.9 with variation
    } else {
      this.session.partyPhase = 'cooldown'
      this.session.energyTarget = Math.max(0.3, 0.7 - ((progress - 0.75) * 1.2)) // Gradual decline
    }
  }

  /**
   * Get tracks available for selection (not recently played)
   */
  private getAvailableTracks(): DJTrack[] {
    const now = Date.now()
    const avoidMinutes = this.settings.avoidRepeats
    
    return this.trackPool.filter(track => {
      // Skip if already played recently
      if (this.session?.playedTracks.has(track.id)) {
        return false
      }
      
      // Skip if played within avoid window
      if (track.lastPlayed) {
        const minutesSincePlay = (now - track.lastPlayed.getTime()) / (1000 * 60)
        if (minutesSincePlay < avoidMinutes) {
          return false
        }
      }
      
      return true
    })
  }

  /**
   * Apply advanced AI logic to select final track from candidates
   */
  private applyAISelection(
    candidates: Array<{ trackId: string; score: TrackCompatibilityScore; features: AudioFeatures }>
  ): DJTrack | null {
    
    if (candidates.length === 0) return null

    // Find tracks in our pool matching the candidates
    const candidateTracks = candidates
      .map(c => ({
        ...c,
        track: this.trackPool.find(t => t.id === c.trackId)
      }))
      .filter(c => c.track) as Array<{
        trackId: string
        score: TrackCompatibilityScore
        features: AudioFeatures
        track: DJTrack
      }>

    // Apply additional scoring factors
    const enhancedCandidates = candidateTracks.map(candidate => {
      let enhancedScore = candidate.score.overall
      const track = candidate.track
      
      // User preferences boost
      if (track.userRating) {
        enhancedScore += (track.userRating - 3) * 0.1 // ±0.2 adjustment
      }
      
      // Play count consideration (slight preference for less played)
      const playCountPenalty = Math.min(0.1, (track.playCount || 0) * 0.01)
      enhancedScore -= playCountPenalty
      
      // Skip count penalty
      const skipPenalty = Math.min(0.2, (track.skipCount || 0) * 0.05)
      enhancedScore -= skipPenalty
      
      // Genre preference boost
      if (this.settings.favoriteGenres.length > 0) {
        // This would need genre detection from audio features or metadata
        // For now, use placeholder logic based on audio features
        if (this.matchesPreferredGenre(candidate.features)) {
          enhancedScore += 0.1
        }
      }
      
      // Energy target alignment
      const energyAlignment = 1 - Math.abs(candidate.features.energy - (this.session?.energyTarget || 0.5))
      enhancedScore += energyAlignment * 0.1
      
      // Mood preference
      const moodAlignment = candidate.features.valence * this.settings.moodPreference * 0.05
      enhancedScore += moodAlignment
      
      return {
        ...candidate,
        enhancedScore: Math.max(0, Math.min(1, enhancedScore))
      }
    })

    // Sort by enhanced score and apply some randomization to top candidates
    const sortedCandidates = enhancedCandidates.sort((a, b) => b.enhancedScore - a.enhancedScore)
    
    // Select from top 3 candidates with weighted randomization
    const topCandidates = sortedCandidates.slice(0, 3)
    const weights = [0.5, 0.3, 0.2] // Bias toward highest scored
    
    const randomValue = Math.random()
    let cumulativeWeight = 0
    
    for (let i = 0; i < topCandidates.length; i++) {
      cumulativeWeight += weights[i] || 0
      if (randomValue <= cumulativeWeight) {
        return topCandidates[i].track
      }
    }
    
    // Fallback to top candidate
    return sortedCandidates[0]?.track || null
  }

  /**
   * Check if track matches preferred genres (simplified)
   */
  private matchesPreferredGenre(features: AudioFeatures): boolean {
    // Placeholder genre detection based on audio features
    // In a real implementation, this would use external genre classification
    
    if (this.settings.favoriteGenres.includes('electronic')) {
      return features.acousticness < 0.3 && features.energy > 0.6
    }
    
    if (this.settings.favoriteGenres.includes('pop')) {
      return features.danceability > 0.6 && features.valence > 0.5
    }
    
    if (this.settings.favoriteGenres.includes('rock')) {
      return features.energy > 0.7 && features.loudness > -8
    }
    
    return false
  }

  /**
   * Get current track being played
   */
  getCurrentTrack(): DJTrack | null {
    if (!this.session || this.session.tracks.length === 0) {
      return null
    }
    return this.session.tracks[this.session.currentTrackIndex] || null
  }

  /**
   * Get session statistics and insights
   */
  getSessionStats(): {
    tracksPlayed: number
    sessionDuration: number
    averageEnergy: number
    keyTransitions: number
    phaseBreakdown: Record<string, number>
  } | null {
    if (!this.session) return null

    const tracks = this.session.tracks
    const sessionMinutes = (Date.now() - this.session.startTime.getTime()) / (1000 * 60)
    
    const averageEnergy = tracks.reduce((sum, track) => sum + track.audioFeatures.energy, 0) / tracks.length
    
    // Count harmonic transitions
    let keyTransitions = 0
    for (let i = 1; i < tracks.length; i++) {
      const prev = tracks[i - 1].audioFeatures
      const curr = tracks[i].audioFeatures
      if (prev.key !== curr.key || prev.mode !== curr.mode) {
        keyTransitions++
      }
    }

    return {
      tracksPlayed: tracks.length,
      sessionDuration: Math.round(sessionMinutes),
      averageEnergy: Math.round(averageEnergy * 100) / 100,
      keyTransitions,
      phaseBreakdown: {
        warmup: 0, // Would need to track phase changes
        peak: 0,
        cooldown: 0
      }
    }
  }

  /**
   * Update settings during session
   */
  updateSettings(newSettings: Partial<DJSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    if (this.session) {
      this.session.settings = this.settings
    }
  }

  /**
   * Add tracks to the available pool
   */
  addTracksToPool(tracks: DJTrack[]): void {
    this.trackPool.push(...tracks)
  }

  /**
   * End the current session
   */
  endSession(): DJSession | null {
    if (this.session) {
      this.session.endTime = new Date()
    }
    
    const completedSession = this.session
    this.session = null
    
    return completedSession
  }
}