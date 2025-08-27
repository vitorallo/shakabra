// Alternative track analysis without audio-features endpoint
// Uses track metadata and estimated values

import { SpotifyTrack } from './spotify'

export interface EstimatedAudioFeatures {
  id: string
  tempo: number
  energy: number
  danceability: number
  valence: number
  acousticness: number
  instrumentalness: number
  liveness: number
  loudness: number
  speechiness: number
  key: number
  mode: number
  time_signature: number
  duration_ms: number
}

// Genre-based tempo and energy estimates
const GENRE_CHARACTERISTICS: Record<string, { tempo: [number, number], energy: number, danceability: number }> = {
  'rock': { tempo: [110, 140], energy: 0.7, danceability: 0.5 },
  'pop': { tempo: [100, 130], energy: 0.6, danceability: 0.7 },
  'hip hop': { tempo: [85, 115], energy: 0.65, danceability: 0.8 },
  'rap': { tempo: [85, 115], energy: 0.7, danceability: 0.75 },
  'electronic': { tempo: [120, 140], energy: 0.8, danceability: 0.85 },
  'dance': { tempo: [120, 135], energy: 0.85, danceability: 0.9 },
  'house': { tempo: [120, 130], energy: 0.8, danceability: 0.85 },
  'techno': { tempo: [125, 145], energy: 0.85, danceability: 0.8 },
  'edm': { tempo: [128, 140], energy: 0.9, danceability: 0.85 },
  'indie': { tempo: [95, 125], energy: 0.5, danceability: 0.55 },
  'alternative': { tempo: [100, 130], energy: 0.6, danceability: 0.5 },
  'r&b': { tempo: [70, 110], energy: 0.5, danceability: 0.7 },
  'soul': { tempo: [70, 110], energy: 0.5, danceability: 0.65 },
  'jazz': { tempo: [80, 140], energy: 0.4, danceability: 0.5 },
  'classical': { tempo: [60, 120], energy: 0.3, danceability: 0.2 },
  'ambient': { tempo: [60, 90], energy: 0.2, danceability: 0.3 },
  'metal': { tempo: [120, 180], energy: 0.95, danceability: 0.4 },
  'punk': { tempo: [140, 200], energy: 0.9, danceability: 0.5 },
  'reggae': { tempo: [70, 90], energy: 0.5, danceability: 0.7 },
  'latin': { tempo: [90, 120], energy: 0.7, danceability: 0.8 },
  'country': { tempo: [80, 120], energy: 0.5, danceability: 0.6 },
  'folk': { tempo: [80, 110], energy: 0.4, danceability: 0.4 },
  'blues': { tempo: [60, 100], energy: 0.5, danceability: 0.5 },
  'funk': { tempo: [90, 120], energy: 0.7, danceability: 0.8 },
  'disco': { tempo: [110, 130], energy: 0.75, danceability: 0.85 },
  'reggaeton': { tempo: [85, 95], energy: 0.75, danceability: 0.85 },
  'trap': { tempo: [65, 80], energy: 0.7, danceability: 0.7 },
  'dubstep': { tempo: [135, 145], energy: 0.8, danceability: 0.7 },
  'drum and bass': { tempo: [160, 180], energy: 0.9, danceability: 0.75 },
  'trance': { tempo: [125, 150], energy: 0.85, danceability: 0.8 },
  'hardstyle': { tempo: [140, 160], energy: 0.95, danceability: 0.75 },
  'lo-fi': { tempo: [70, 90], energy: 0.3, danceability: 0.4 },
  'chill': { tempo: [80, 110], energy: 0.3, danceability: 0.5 }
}

// Estimate audio features based on track metadata
export function estimateAudioFeatures(
  track: SpotifyTrack, 
  genre?: string,
  artistGenres?: string[]
): EstimatedAudioFeatures {
  // Try to determine genre from various sources
  const detectedGenre = detectGenre(track, genre, artistGenres)
  const characteristics = GENRE_CHARACTERISTICS[detectedGenre] || GENRE_CHARACTERISTICS['pop']
  
  // Estimate tempo with some randomization for variety
  const [minTempo, maxTempo] = characteristics.tempo
  const tempo = minTempo + Math.random() * (maxTempo - minTempo)
  
  // Add slight variations to make each track unique
  const variation = () => (Math.random() - 0.5) * 0.2 // ±0.1 variation
  
  // Estimate energy based on popularity and genre
  const popularityFactor = (track.popularity || 50) / 100
  const energy = Math.max(0, Math.min(1, 
    characteristics.energy + variation() + (popularityFactor - 0.5) * 0.2
  ))
  
  // Estimate danceability
  const danceability = Math.max(0, Math.min(1, 
    characteristics.danceability + variation()
  ))
  
  // Estimate valence (musical positivity) based on energy and mode
  const valence = Math.max(0, Math.min(1, 
    0.5 + (energy - 0.5) * 0.5 + variation()
  ))
  
  // Other estimates
  const acousticness = detectedGenre.includes('acoustic') || detectedGenre === 'folk' ? 0.8 : 
                       detectedGenre === 'electronic' || detectedGenre === 'edm' ? 0.1 : 
                       0.3 + variation()
  
  const instrumentalness = detectedGenre === 'classical' || detectedGenre === 'ambient' ? 0.9 :
                           detectedGenre === 'rap' || detectedGenre === 'hip hop' ? 0.0 :
                           0.1 + Math.max(0, variation())
  
  const liveness = 0.15 + Math.max(0, variation() * 0.5) // Most studio tracks have low liveness
  
  const loudness = -60 + (energy * 55) // Convert energy to dB scale (-60 to -5)
  
  const speechiness = detectedGenre === 'rap' || detectedGenre === 'hip hop' ? 0.4 :
                      detectedGenre === 'podcast' ? 0.9 :
                      0.05 + Math.max(0, variation() * 0.3)
  
  // Random key and mode for variety
  const key = Math.floor(Math.random() * 12) // 0-11 (C to B)
  const mode = Math.random() > 0.4 ? 1 : 0 // 60% major, 40% minor
  
  return {
    id: track.id,
    tempo: Math.round(tempo),
    energy,
    danceability,
    valence,
    acousticness,
    instrumentalness,
    liveness,
    loudness,
    speechiness,
    key,
    mode,
    time_signature: 4, // Most common time signature
    duration_ms: track.duration_ms
  }
}

// Detect genre from track and artist information
function detectGenre(track: SpotifyTrack, explicitGenre?: string, artistGenres?: string[]): string {
  // Priority 1: Explicit genre provided
  if (explicitGenre) {
    const normalized = explicitGenre.toLowerCase()
    for (const [key] of Object.entries(GENRE_CHARACTERISTICS)) {
      if (normalized.includes(key)) return key
    }
  }
  
  // Priority 2: Artist genres
  if (artistGenres && artistGenres.length > 0) {
    for (const genre of artistGenres) {
      const normalized = genre.toLowerCase()
      for (const [key] of Object.entries(GENRE_CHARACTERISTICS)) {
        if (normalized.includes(key)) return key
      }
    }
  }
  
  // Priority 3: Guess from track/artist name patterns
  const trackName = track.name.toLowerCase()
  const artistName = track.artists.map(a => a.name).join(' ').toLowerCase()
  const combined = `${trackName} ${artistName}`
  
  // Check for genre hints in names
  if (combined.includes('remix') || combined.includes('mix')) return 'electronic'
  if (combined.includes('acoustic')) return 'indie'
  if (combined.includes('symphony') || combined.includes('orchestra')) return 'classical'
  if (combined.includes('rap') || combined.includes('feat.')) return 'hip hop'
  if (combined.includes('jazz')) return 'jazz'
  if (combined.includes('metal')) return 'metal'
  if (combined.includes('punk')) return 'punk'
  if (combined.includes('reggae')) return 'reggae'
  if (combined.includes('techno')) return 'techno'
  if (combined.includes('house')) return 'house'
  
  // Default to pop for unknown tracks
  return 'pop'
}

// Create features that are compatible with the AI mixing engine
export function createCompatibleFeatures(estimated: EstimatedAudioFeatures): any {
  return {
    id: estimated.id,
    acousticness: estimated.acousticness,
    danceability: estimated.danceability,
    energy: estimated.energy,
    instrumentalness: estimated.instrumentalness,
    key: estimated.key,
    liveness: estimated.liveness,
    loudness: estimated.loudness,
    mode: estimated.mode,
    speechiness: estimated.speechiness,
    tempo: estimated.tempo,
    time_signature: estimated.time_signature,
    valence: estimated.valence,
    duration_ms: estimated.duration_ms
  }
}