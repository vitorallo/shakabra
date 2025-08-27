import { z } from 'zod'

/**
 * Spotify API Configuration Schema
 */
const spotifySchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1, 'Spotify Client ID is required'),
  SPOTIFY_CLIENT_SECRET: z.string().min(1, 'Spotify Client Secret is required'),
  NEXT_PUBLIC_SPOTIFY_CLIENT_ID: z.string().min(1, 'Public Spotify Client ID is required'),
})

/**
 * NextAuth Configuration Schema
 */
const authSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NextAuth URL must be a valid URL'),
})

/**
 * Database Configuration Schema
 */
const databaseSchema = z.object({
  DATABASE_URL: z.string().url('Database URL must be a valid connection string'),
  DIRECT_URL: z.string().url('Direct URL must be a valid connection string').optional(),
})

/**
 * Supabase Configuration Schema (Optional)
 */
const supabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

/**
 * Stripe Configuration Schema (Optional for development)
 */
const stripeSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
})

/**
 * Application Configuration Schema
 */
const appSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Shakabra'),
})

/**
 * AI DJ Engine Configuration Schema
 */
const aiSchema = z.object({
  AI_TEMPO_WEIGHT: z.coerce.number().min(0).max(1).default(0.3),
  AI_ENERGY_WEIGHT: z.coerce.number().min(0).max(1).default(0.25),
  AI_KEY_HARMONY_WEIGHT: z.coerce.number().min(0).max(1).default(0.2),
  AI_GENRE_WEIGHT: z.coerce.number().min(0).max(1).default(0.15),
  AI_MOOD_WEIGHT: z.coerce.number().min(0).max(1).default(0.1),
  TEMPO_TOLERANCE_PERCENT: z.coerce.number().min(1).max(20).default(5),
  ENERGY_TOLERANCE: z.coerce.number().min(0.1).max(1).default(0.2),
  MIN_COMPATIBILITY_SCORE: z.coerce.number().min(0).max(1).default(0.7),
})

/**
 * SaaS Feature Configuration Schema
 */
const saasSchema = z.object({
  FREE_TIER_MAX_PLAYLISTS: z.coerce.number().positive().default(3),
  FREE_TIER_MAX_TRACKS_PER_SESSION: z.coerce.number().positive().default(50),
  FREE_TIER_CROSSFADE_DURATION: z.coerce.number().positive().default(3),
  PRO_TIER_PRICE_USD: z.coerce.number().positive().default(9.99),
})

/**
 * Debug Configuration Schema
 */
const debugSchema = z.object({
  DEBUG_SPOTIFY_API: z.coerce.boolean().default(false),
  DEBUG_AI_ENGINE: z.coerce.boolean().default(false),
  DEBUG_AUDIO_FEATURES: z.coerce.boolean().default(false),
  DEBUG_NEXTAUTH: z.coerce.boolean().default(false),
  USE_MOCK_SPOTIFY_DATA: z.coerce.boolean().default(false),
})

/**
 * Combined Environment Schema
 */
const envSchema = z
  .object({})
  .merge(spotifySchema)
  .merge(authSchema)
  .merge(databaseSchema)
  .merge(supabaseSchema)
  .merge(stripeSchema)
  .merge(appSchema)
  .merge(aiSchema)
  .merge(saasSchema)
  .merge(debugSchema)

/**
 * Validate and parse environment variables
 * Throws an error if validation fails with detailed error messages
 */
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env)
    
    // Validate that AI weights sum to approximately 1.0
    const totalWeight = 
      env.AI_TEMPO_WEIGHT + 
      env.AI_ENERGY_WEIGHT + 
      env.AI_KEY_HARMONY_WEIGHT + 
      env.AI_GENRE_WEIGHT + 
      env.AI_MOOD_WEIGHT
      
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      console.warn(
        `⚠️ AI mixing weights sum to ${totalWeight.toFixed(2)} instead of 1.0. This may affect mixing quality.`
      )
    }
    
    return env
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      )
      
      console.error('❌ Environment validation failed:')
      errorMessages.forEach((msg) => console.error(`  - ${msg}`))
      
      throw new Error(
        `Environment validation failed. Please check your .env.local file:\n${errorMessages.join('\n')}`
      )
    }
    throw error
  }
}

/**
 * Get validated environment variables
 * Call this in your app to get type-safe environment variables
 */
export const env = validateEnv()

/**
 * Environment variable types (inferred from schema)
 */
export type Env = z.infer<typeof envSchema>

/**
 * Check if we're in development mode
 */
export const isDev = env.NODE_ENV === 'development'

/**
 * Check if we're in production mode
 */
export const isProd = env.NODE_ENV === 'production'

/**
 * Check if debug mode is enabled for a specific feature
 */
export function isDebugEnabled(feature: keyof typeof debugSchema.shape) {
  return env[feature] === true
}