# Next.js 15 Best Practices and Features Guide

## Overview
This documentation covers Next.js 15 best practices, App Router features, Server Components, and modern development patterns for the Shakabra AI DJ Party Player.

## App Router Architecture (Next.js 13.4+)

### Key Features
- **Layouts**: Share UI across pages with partial rendering on navigation
- **Server Components**: Default server-side rendering with better performance
- **Client Components**: Interactive components marked with `'use client'`
- **Streaming**: Progressive UI loading with React Suspense
- **Parallel Data Fetching**: Reduced network waterfalls

### Routing Best Practices

#### Layouts
- Purpose: Share UI across pages and enable partial rendering on navigation
- Use `app/layout.tsx` for root layouts
- Create nested layouts for section-specific UI

```tsx
// app/layout.tsx - Root Layout
export default function Layout({ children }) {
  return (
    <html>
      <body>
        <nav>Global Navigation</nav>
        {children}
      </body>
    </html>
  )
}

// app/dashboard/layout.tsx - Nested Layout
export default function DashboardLayout({ children }) {
  return (
    <div>
      <h2>My Dashboard</h2>
      {children}
    </div>
  )
}
```

#### Navigation
- Use `<Link>` component for client-side navigation and prefetching
- Import from `next/link`

```tsx
import Link from 'next/link'

export default function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/playlists">Playlists</Link>
    </nav>
  )
}
```

#### Error Handling
- Create custom error pages for graceful error handling
- Use `error.tsx` for catch-all errors
- Use `not-found.tsx` for 404 errors

### Server and Client Components

#### Server Components (Default)
```tsx
// Server Component - runs on server
import { getPosts } from '@/lib/data'
import { Post } from '@/ui/post'

export default async function Page() {
  const posts = await getPosts()

  return (
    <ul>
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </ul>
  )
}
```

#### Client Components
```tsx
'use client' // Required directive at top of file

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

#### Component Composition Patterns
```tsx
// Server Component fetches data and passes to Client Component
import LikeButton from '@/app/ui/like-button'
import { getPost } from '@/lib/data'

export default async function Page({ params }) {
  const post = await getPost(params.id)

  return (
    <div>
      <h1>{post.title}</h1>
      <LikeButton likes={post.likes} />
    </div>
  )
}
```

### Data Fetching Best Practices

#### Server Components Data Fetching
```tsx
export default async function Page() {
  // Static data (cached until manually invalidated)
  const staticData = await fetch(`https://api.example.com/static`, { 
    cache: 'force-cache' 
  })

  // Dynamic data (refetched on every request)
  const dynamicData = await fetch(`https://api.example.com/dynamic`, { 
    cache: 'no-store' 
  })

  // Time-based caching (revalidate every 10 seconds)
  const revalidatedData = await fetch(`https://api.example.com/timed`, {
    next: { revalidate: 10 }
  })

  return <div>{/* Render data */}</div>
}
```

#### Parallel Data Fetching
```tsx
async function getData() {
  // Fetch data in parallel
  const [posts, user, analytics] = await Promise.all([
    fetch('/api/posts'),
    fetch('/api/user'),
    fetch('/api/analytics')
  ])

  return {
    posts: await posts.json(),
    user: await user.json(),
    analytics: await analytics.json()
  }
}
```

#### Route Handlers (API Routes)
```tsx
// app/api/playlist/route.ts
export async function GET() {
  const playlists = await getPlaylists()
  return Response.json({ playlists })
}

export async function POST(request: Request) {
  const data = await request.json()
  const playlist = await createPlaylist(data)
  return Response.json({ playlist })
}
```

### Streaming and Loading UI

#### Loading States
```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>
}
```

#### Streaming with Suspense
```tsx
import { Suspense } from 'react'
import { PostFeed, Weather } from './Components'

export default function Posts() {
  return (
    <section>
      <Suspense fallback={<p>Loading feed...</p>}>
        <PostFeed />
      </Suspense>
      <Suspense fallback={<p>Loading weather...</p>}>
        <Weather />
      </Suspense>
    </section>
  )
}
```

### Navigation Hooks (Client Components)

```tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function ClientComponent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleNavigation = () => {
    router.push('/dashboard')
  }

  return (
    <div>
      <p>Current path: {pathname}</p>
      <button onClick={handleNavigation}>Go to Dashboard</button>
    </div>
  )
}
```

### Dynamic Routes and Static Generation

#### Dynamic Routes with generateStaticParams
```tsx
// app/posts/[id]/page.tsx
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }]
}

async function getPost(params) {
  const res = await fetch(`https://api.example.com/posts/${params.id}`)
  return res.json()
}

export default async function Post({ params }) {
  const post = await getPost(params)
  return <div>{post.title}</div>
}
```

### Middleware and Request Handling

#### Accessing Headers and Cookies
```tsx
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const theme = (await cookies()).get('theme')
  const authHeader = (await headers()).get('authorization')
  
  return <div>Theme: {theme?.value}</div>
}
```

#### Middleware
```tsx
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check authentication
    const token = request.cookies.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
}

export const config = {
  matcher: '/dashboard/:path*'
}
```

### Performance Optimizations

#### Image Optimization
```tsx
import Image from 'next/image'

export default function ProfilePicture() {
  return (
    <Image
      src="/profile.jpg"
      alt="Profile"
      width={500}
      height={500}
      priority
    />
  )
}
```

#### Script Optimization
```tsx
import Script from 'next/script'

export default function Page() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js"
        strategy="afterInteractive"
      />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        `}
      </Script>
    </>
  )
}
```

## Next.js 15 Specific Changes

### Async Request APIs (Breaking Change)
In Next.js 15, `params`, `searchParams`, `cookies()`, and `headers()` are now async:

```tsx
// Before (Next.js 14)
export function generateMetadata({ params }) {
  const { slug } = params
}

// After (Next.js 15)
export async function generateMetadata({ params }) {
  const { slug } = await params
}
```

### Server External Packages
The `experimental.serverComponentsExternalPackages` has been renamed:

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Before
  experimental: {
    serverComponentsExternalPackages: ['package-name'],
  },

  // After (Next.js 15)
  serverExternalPackages: ['package-name'],
}
```

## Best Practices for Shakabra DJ App

### Authentication Flow
```tsx
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'user-read-playback-state user-modify-playback-state playlist-read-private streaming'
        }
      }
    })
  ]
})

export { handler as GET, handler as POST }
```

### State Management with Server Components
```tsx
// app/dashboard/page.tsx
import { PlaylistGrid } from '@/components/playlist-grid'
import { getPlaylists } from '@/lib/spotify'

export default async function Dashboard() {
  const playlists = await getPlaylists()
  
  return (
    <div>
      <h1>DJ Dashboard</h1>
      <PlaylistGrid playlists={playlists} />
    </div>
  )
}
```

### Real-time Features with WebSockets
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/use-websocket'

export default function DJSession() {
  const { socket, isConnected } = useWebSocket('/api/ws/dj-session')
  const [currentTrack, setCurrentTrack] = useState(null)
  
  useEffect(() => {
    if (socket) {
      socket.on('track-changed', setCurrentTrack)
    }
  }, [socket])

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {currentTrack && <TrackDisplay track={currentTrack} />}
    </div>
  )
}
```

## Summary

Next.js 15 with App Router provides:
- Better performance with Server Components by default
- Improved data fetching patterns
- Enhanced type safety
- Built-in streaming and loading states
- Simplified routing and layouts
- Better separation of server/client code

For the Shakabra project, focus on:
1. Using Server Components for data fetching from Spotify API
2. Client Components for interactive DJ controls
3. Streaming for progressive playlist loading
4. Route Handlers for API endpoints
5. Middleware for authentication and rate limiting