# Supabase Integration Guide for Next.js 15

## Overview
This documentation covers Supabase integration patterns for Next.js 15, including authentication, database operations, real-time subscriptions, and best practices for the Shakabra AI DJ Party Player.

## Installation

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Supabase Client Setup

### Environment Variables
Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Client-Side Client (Browser Components)

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Server-Side Client (Server Components/Actions)

```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      }
    }
  )
}
```

### API Route Client

```typescript
// utils/supabase/api.ts
import { createServerClient, serializeCookieHeader } from '@supabase/ssr'
import { type NextApiRequest, type NextApiResponse } from 'next'

export function createClient(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({ 
            name, 
            value: req.cookies[name] || '' 
          }))
        },
        setAll(cookiesToSet) {
          res.setHeader(
            'Set-Cookie',
            cookiesToSet.map(({ name, value, options }) =>
              serializeCookieHeader(name, value, options)
            )
          )
        }
      }
    }
  )

  return supabase
}
```

## Middleware for Session Management

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Authentication

### Client-Side Authentication Component

```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error('Sign up error:', error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Sign in error:', error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <div className="space-x-2">
        <button 
          onClick={handleSignUp}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Sign Up
        </button>
        <button 
          onClick={handleSignIn}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Sign In
        </button>
        <button 
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
```

### Auth Callback Route Handler

```typescript
// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const redirectTo = request.url.split('?')[0].replace('/auth/callback', next)

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
    
    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  // Return to error page with instructions
  return NextResponse.redirect(
    request.url.split('?')[0].replace('/auth/callback', '/error')
  )
}
```

### Protected Server Component

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
    </div>
  )
}
```

## Database Operations

### Database Schema (Example for DJ App)

```sql
-- Users table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  subscription_tier text default 'free',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Playlists table
create table public.playlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  spotify_id text unique,
  tracks jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- DJ Sessions table
create table public.dj_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  playlist_ids uuid[] default '{}',
  settings jsonb,
  is_active boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.playlists enable row level security;
alter table public.dj_sessions enable row level security;

-- Policies
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can read own playlists" on public.playlists
  for select using (auth.uid() = user_id);

create policy "Users can manage own playlists" on public.playlists
  for all using (auth.uid() = user_id);

create policy "Users can read own sessions" on public.dj_sessions
  for select using (auth.uid() = user_id);

create policy "Users can manage own sessions" on public.dj_sessions
  for all using (auth.uid() = user_id);
```

### Server-Side Database Queries

```typescript
// lib/database.ts
import { createClient } from '@/utils/supabase/server'

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function getUserPlaylists(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createPlaylist(userId: string, playlist: {
  name: string
  spotify_id: string
  tracks?: any[]
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: userId,
      ...playlist
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createDJSession(userId: string, session: {
  name: string
  playlist_ids: string[]
  settings?: any
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('dj_sessions')
    .insert({
      user_id: userId,
      ...session
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### Client-Side Database Operations

```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export function useUserPlaylists(userId: string) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPlaylists() {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching playlists:', error)
      } else {
        setPlaylists(data || [])
      }
      setLoading(false)
    }

    fetchPlaylists()
  }, [userId, supabase])

  return { playlists, loading }
}
```

## Real-time Subscriptions

### Real-time Component for Live DJ Sessions

```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface DJSession {
  id: string
  name: string
  is_active: boolean
  settings: any
}

export function LiveDJSession({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<DJSession | null>(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial session data
    async function fetchSession() {
      const { data } = await supabase
        .from('dj_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      setSession(data)
    }

    fetchSession()

    // Subscribe to real-time changes
    const sessionChannel = supabase
      .channel(`dj-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dj_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new as DJSession)
        }
      )
      .subscribe()

    // Subscribe to track changes via broadcast
    const trackChannel = supabase
      .channel(`track-updates-${sessionId}`)
      .on(
        'broadcast',
        { event: 'track-changed' },
        (payload) => {
          setCurrentTrack(payload.track)
        }
      )
      .subscribe()

    return () => {
      sessionChannel.unsubscribe()
      trackChannel.unsubscribe()
    }
  }, [sessionId, supabase])

  return (
    <div>
      <h2>{session?.name}</h2>
      <div>Status: {session?.is_active ? 'Active' : 'Inactive'}</div>
      {currentTrack && (
        <div>Now Playing: {currentTrack.name}</div>
      )}
    </div>
  )
}
```

### Broadcasting Track Changes

```typescript
// lib/dj-controls.ts
import { createClient } from '@/utils/supabase/client'

export async function broadcastTrackChange(sessionId: string, track: any) {
  const supabase = createClient()
  
  await supabase
    .channel(`track-updates-${sessionId}`)
    .send({
      type: 'broadcast',
      event: 'track-changed',
      track
    })
}

export async function broadcastMixUpdate(sessionId: string, mixData: any) {
  const supabase = createClient()
  
  await supabase
    .channel(`track-updates-${sessionId}`)
    .send({
      type: 'broadcast',
      event: 'mix-updated',
      mixData
    })
}
```

## API Routes with Supabase

### Protected API Route

```typescript
// app/api/playlists/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ playlists })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await request.json()
  
  const { data: playlist, error } = await supabase
    .from('playlists')
    .insert({
      user_id: user.id,
      ...body
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ playlist })
}
```

## TypeScript Types

### Generate Types from Database

```bash
# Install Supabase CLI
npm install -g supabase

# Generate types
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

### Use Generated Types

```typescript
// types/database.types.ts (generated)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          subscription_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables
    }
  }
}

// Use with client
import { Database } from '@/types/database.types'
const supabase = createClient<Database>()
```

## Best Practices for Shakabra DJ App

### 1. Feature-Based Queries

```typescript
// lib/subscription.ts
export async function checkUserSubscription(userId: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single()
  
  return {
    isPro: profile?.subscription_tier === 'pro',
    isFree: profile?.subscription_tier === 'free' || !profile?.subscription_tier
  }
}

// lib/features.ts
export const FEATURE_LIMITS = {
  free: {
    maxPlaylists: 3,
    maxSessionDuration: 3600, // 1 hour
    crossfadeDuration: 3,
    canDownloadMixes: false
  },
  pro: {
    maxPlaylists: Infinity,
    maxSessionDuration: Infinity,
    crossfadeDuration: 30,
    canDownloadMixes: true
  }
}

export async function getUserFeatures(userId: string) {
  const { isPro } = await checkUserSubscription(userId)
  return isPro ? FEATURE_LIMITS.pro : FEATURE_LIMITS.free
}
```

### 2. Caching Strategy

```typescript
// lib/cache.ts
import { createClient } from '@/utils/supabase/server'
import { unstable_cache } from 'next/cache'

export const getUserProfileCached = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  },
  ['user-profile'],
  { 
    revalidate: 300, // 5 minutes
    tags: ['user-profile'] 
  }
)
```

### 3. Error Handling

```typescript
// lib/errors.ts
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error)
  
  if (error.code === 'PGRST116') {
    throw new DatabaseError('Resource not found', 'NOT_FOUND')
  }
  
  if (error.code === '23505') {
    throw new DatabaseError('Resource already exists', 'CONFLICT')
  }
  
  throw new DatabaseError(error.message || 'Database operation failed')
}
```

## Summary

This guide provides comprehensive patterns for integrating Supabase with Next.js 15:

1. **Proper Client Setup**: Different clients for different contexts
2. **Authentication**: Server and client-side auth patterns
3. **Database Operations**: CRUD with Row Level Security
4. **Real-time Features**: Live updates and broadcasting
5. **Type Safety**: Generated types from schema
6. **Best Practices**: Caching, error handling, feature gating

For the Shakabra project, use these patterns to build:
- User authentication and profile management
- Playlist and session storage
- Real-time DJ collaboration features
- Subscription-based feature gating
- Secure API endpoints