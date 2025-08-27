/**
 * Audio Analysis Engine for AI DJ Mixing
 * 
 * This module provides comprehensive audio analysis using Spotify Audio Features API
 * and implements intelligent compatibility scoring for seamless track transitions.
 */

export interface AudioFeatures {
  // Spotify Audio Features API response
  acousticness: number      // 0.0 to 1.0 - acoustic vs electronic
  danceability: number      // 0.0 to 1.0 - how suitable for dancing
  energy: number           // 0.0 to 1.0 - perceptual measure of intensity
  instrumentalness: number // 0.0 to 1.0 - whether track contains vocals
  liveness: number         // 0.0 to 1.0 - presence of audience
  loudness: number         // -60 to 0 dB - overall loudness
  speechiness: number      // 0.0 to 1.0 - presence of spoken words
  valence: number          // 0.0 to 1.0 - musical positivity/happiness
  tempo: number            // BPM (beats per minute)
  key: number              // 0-11 (C=0, C#=1, D=2, etc.)
  mode: number             // 0 = minor, 1 = major
  time_signature: number   // estimated time signature
  duration_ms: number      // track length in milliseconds
}

export interface TrackCompatibilityScore {
  overall: number          // 0.0 to 1.0 - overall compatibility
  tempo: number           // tempo matching score
  energy: number          // energy progression score  
  harmonic: number        // key/harmonic compatibility
  genre: number           // genre similarity score
  mood: number            // mood/valence transition score
  details: {
    tempoAnalysis: {
      currentBPM: number
      nextBPM: number
      difference: number
      withinTolerance: boolean
    }
    energyAnalysis: {
      currentEnergy: number
      nextEnergy: number
      progression: 'building' | 'maintaining' | 'dropping'
      appropriate: boolean
    }
    harmonicAnalysis: {
      currentKey: string
      nextKey: string
      relationship: string
      camelotDistance: number
    }
  }
}

// Camelot Wheel mapping for harmonic mixing
const CAMELOT_WHEEL: Record<string, string> = {
  // Major keys (outer wheel)
  'C_major': '8B', 'G_major': '9B', 'D_major': '10B', 'A_major': '11B',
  'E_major': '12B', 'B_major': '1B', 'Gb_major': '2B', 'Db_major': '3B',
  'Ab_major': '4B', 'Eb_major': '5B', 'Bb_major': '6B', 'F_major': '7B',
  
  // Minor keys (inner wheel) 
  'A_minor': '8A', 'E_minor': '9A', 'B_minor': '10A', 'Fs_minor': '11A',
  'Cs_minor': '12A', 'Gs_minor': '1A', 'Ds_minor': '2A', 'As_minor': '3A',
  'F_minor': '4A', 'C_minor': '5A', 'G_minor': '6A', 'D_minor': '7A'
}

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MODE_NAMES = ['minor', 'major']

/**
 * AI Mixing Compatibility Weights
 * These weights determine the importance of each factor in track selection
 */
export const MIXING_WEIGHTS = {
  tempo: 0.30,        // 30% - Critical for seamless transitions
  energy: 0.25,       // 25% - Energy progression maintains dancefloor
  harmonic: 0.20,     // 20% - Key compatibility prevents dissonance  
  genre: 0.15,        // 15% - Style consistency
  mood: 0.10          // 10% - Valence/mood progression
} as const

/**
 * Calculate tempo compatibility between two tracks
 * Uses ±5% BPM tolerance as per professional DJ standards
 */
export function calculateTempoCompatibility(
  currentFeatures: AudioFeatures,
  nextFeatures: AudioFeatures
): number {
  const currentBPM = currentFeatures.tempo
  const nextBPM = nextFeatures.tempo
  const bpmDiff = Math.abs(currentBPM - nextBPM)
  const tolerance = Math.max(currentBPM, nextBPM) * 0.05 // 5% tolerance
  
  if (bpmDiff <= tolerance) {
    return 1.0 // Perfect match within tolerance
  }
  
  // Gradual decline in compatibility as BPM difference increases
  const maxAcceptableDiff = Math.max(currentBPM, nextBPM) * 0.15 // 15% max
  return Math.max(0, 1 - (bpmDiff - tolerance) / (maxAcceptableDiff - tolerance))
}

/**
 * Calculate energy progression compatibility
 * Maintains appropriate energy flow for party atmosphere
 */
export function calculateEnergyCompatibility(
  currentFeatures: AudioFeatures,
  nextFeatures: AudioFeatures,
  partyPhase: 'warmup' | 'peak' | 'cooldown' = 'peak'
): number {
  const currentEnergy = currentFeatures.energy
  const nextEnergy = nextFeatures.energy
  const energyDiff = nextEnergy - currentEnergy
  
  switch (partyPhase) {
    case 'warmup':
      // During warmup, prefer gradual energy increases
      return energyDiff >= 0 ? 1.0 : Math.max(0.3, 1 + energyDiff * 2)
      
    case 'peak':
      // During peak time, maintain high energy (0.6+)
      if (nextEnergy >= 0.6) {
        return Math.max(0.7, 1 - Math.abs(energyDiff) * 0.5)
      }
      return 0.2 // Heavily penalize low energy during peak
      
    case 'cooldown':
      // During cooldown, prefer gradual energy decreases
      return energyDiff <= 0 ? 1.0 : Math.max(0.3, 1 - energyDiff * 2)
      
    default:
      return Math.max(0.5, 1 - Math.abs(energyDiff) * 0.5)
  }
}

/**
 * Convert Spotify key/mode to Camelot notation
 */
export function getCamelotKey(key: number, mode: number): string {
  const keyName = KEY_NAMES[key]
  const modeName = MODE_NAMES[mode]
  const keyString = `${keyName}_${modeName}`
  return CAMELOT_WHEEL[keyString] || 'Unknown'
}

/**
 * Calculate harmonic compatibility using Camelot Wheel
 * Perfect matches: same key, adjacent keys, or relative major/minor
 */
export function calculateHarmonicCompatibility(
  currentFeatures: AudioFeatures,
  nextFeatures: AudioFeatures
): number {
  const currentCamelot = getCamelotKey(currentFeatures.key, currentFeatures.mode)
  const nextCamelot = getCamelotKey(nextFeatures.key, nextFeatures.mode)
  
  if (currentCamelot === 'Unknown' || nextCamelot === 'Unknown') {
    return 0.5 // Neutral if key detection failed
  }
  
  if (currentCamelot === nextCamelot) {
    return 1.0 // Perfect match - same key
  }
  
  // Parse Camelot notation (e.g., "8B" -> number: 8, letter: "B")
  const currentNum = parseInt(currentCamelot)
  const currentLetter = currentCamelot.slice(-1)
  const nextNum = parseInt(nextCamelot)
  const nextLetter = nextCamelot.slice(-1)
  
  // Relative major/minor (8B ↔ 8A)
  if (currentNum === nextNum && currentLetter !== nextLetter) {
    return 0.9
  }
  
  // Adjacent keys on wheel (±1 semitone)
  const wheelDistance = Math.min(
    Math.abs(currentNum - nextNum),
    12 - Math.abs(currentNum - nextNum)
  )
  
  if (wheelDistance === 1 && currentLetter === nextLetter) {
    return 0.8 // Adjacent keys in same mode
  }
  
  if (wheelDistance === 2 && currentLetter === nextLetter) {
    return 0.6 // Two steps away, acceptable
  }
  
  if (wheelDistance <= 3) {
    return 0.4 // Moderately compatible
  }
  
  return 0.1 // Poor harmonic compatibility
}

/**
 * Calculate genre/style similarity based on audio features
 * Uses feature vector similarity
 */
export function calculateGenreCompatibility(
  currentFeatures: AudioFeatures,
  nextFeatures: AudioFeatures
): number {
  // Feature weights for genre similarity
  const weights = {
    acousticness: 0.2,
    danceability: 0.25,
    energy: 0.15,
    instrumentalness: 0.15,
    loudness: 0.1,
    speechiness: 0.15
  }
  
  let similarity = 0
  let totalWeight = 0
  
  for (const [feature, weight] of Object.entries(weights)) {
    const current = currentFeatures[feature as keyof AudioFeatures] as number
    const next = nextFeatures[feature as keyof AudioFeatures] as number
    
    // Handle loudness differently (it's in dB, negative values)
    if (feature === 'loudness') {
      const loudnessDiff = Math.abs(current - next)
      similarity += weight * Math.max(0, 1 - loudnessDiff / 20) // 20dB max difference
    } else {
      similarity += weight * (1 - Math.abs(current - next))
    }
    totalWeight += weight
  }
  
  return similarity / totalWeight
}

/**
 * Calculate mood/valence compatibility
 * Ensures smooth emotional transitions
 */
export function calculateMoodCompatibility(
  currentFeatures: AudioFeatures,
  nextFeatures: AudioFeatures
): number {
  const valenceDiff = Math.abs(currentFeatures.valence - nextFeatures.valence)
  
  // Smooth transitions preferred (within 0.3 valence units)
  if (valenceDiff <= 0.3) {
    return 1.0
  }
  
  // Gradual decline for larger mood jumps
  return Math.max(0.2, 1 - (valenceDiff - 0.3) * 1.4)
}

/**
 * Master function: Calculate overall track compatibility
 * Combines all compatibility factors using weighted scoring
 */
export function calculateTrackCompatibility(
  currentFeatures: AudioFeatures,
  nextFeatures: AudioFeatures,
  partyPhase: 'warmup' | 'peak' | 'cooldown' = 'peak'
): TrackCompatibilityScore {
  const tempoScore = calculateTempoCompatibility(currentFeatures, nextFeatures)
  const energyScore = calculateEnergyCompatibility(currentFeatures, nextFeatures, partyPhase)
  const harmonicScore = calculateHarmonicCompatibility(currentFeatures, nextFeatures)
  const genreScore = calculateGenreCompatibility(currentFeatures, nextFeatures)
  const moodScore = calculateMoodCompatibility(currentFeatures, nextFeatures)
  
  // Calculate weighted overall score
  const overall = (
    tempoScore * MIXING_WEIGHTS.tempo +
    energyScore * MIXING_WEIGHTS.energy +
    harmonicScore * MIXING_WEIGHTS.harmonic +
    genreScore * MIXING_WEIGHTS.genre +
    moodScore * MIXING_WEIGHTS.mood
  )
  
  return {
    overall,
    tempo: tempoScore,
    energy: energyScore,
    harmonic: harmonicScore,
    genre: genreScore,
    mood: moodScore,
    details: {
      tempoAnalysis: {
        currentBPM: currentFeatures.tempo,
        nextBPM: nextFeatures.tempo,
        difference: Math.abs(currentFeatures.tempo - nextFeatures.tempo),
        withinTolerance: tempoScore >= 0.8
      },
      energyAnalysis: {
        currentEnergy: currentFeatures.energy,
        nextEnergy: nextFeatures.energy,
        progression: nextFeatures.energy > currentFeatures.energy ? 'building' :
                    nextFeatures.energy < currentFeatures.energy ? 'dropping' : 'maintaining',
        appropriate: energyScore >= 0.7
      },
      harmonicAnalysis: {
        currentKey: `${KEY_NAMES[currentFeatures.key]} ${MODE_NAMES[currentFeatures.mode]}`,
        nextKey: `${KEY_NAMES[nextFeatures.key]} ${MODE_NAMES[nextFeatures.mode]}`,
        relationship: getCamelotKey(currentFeatures.key, currentFeatures.mode) + 
                     ' → ' + getCamelotKey(nextFeatures.key, nextFeatures.mode),
        camelotDistance: harmonicScore
      }
    }
  }
}

/**
 * Find the best next track from a pool of candidates
 * Returns sorted array of tracks with compatibility scores
 */
export function findBestNextTracks(
  currentFeatures: AudioFeatures,
  candidateFeatures: Array<{ trackId: string; features: AudioFeatures }>,
  partyPhase: 'warmup' | 'peak' | 'cooldown' = 'peak',
  limit: number = 5
): Array<{ trackId: string; score: TrackCompatibilityScore; features: AudioFeatures }> {
  
  const scoredTracks = candidateFeatures.map(candidate => ({
    trackId: candidate.trackId,
    score: calculateTrackCompatibility(currentFeatures, candidate.features, partyPhase),
    features: candidate.features
  }))
  
  // Sort by overall compatibility score (highest first)
  return scoredTracks
    .sort((a, b) => b.score.overall - a.score.overall)
    .slice(0, limit)
}