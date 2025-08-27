import { z } from 'zod'

/**
 * Client-side Environment Variables Schema
 * Only includes NEXT_PUBLIC_ variables that are safe to expose to the browser
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SPOTIFY_CLIENT_ID: z.string().min(1, 'Public Spotify Client ID is required'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Shakabra'),
})

/**
 * Validate client-side environment variables
 */
function validateClientEnv() {
  if (typeof window === 'undefined') {
    throw new Error('Client environment validation should only run in the browser')
  }

  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      )
      
      console.error('❌ Client environment validation failed:')
      errorMessages.forEach((msg) => console.error(`  - ${msg}`))
      
      throw new Error('Client environment validation failed. Check browser console for details.')
    }
    throw error
  }
}

/**
 * Get validated client-side environment variables
 */
export const clientEnv = typeof window !== 'undefined' ? validateClientEnv() : null

/**
 * Client environment variable types
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>