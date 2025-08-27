# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the AI DJ Party Player project - a **modern web application** that automatically mixes music from Spotify playlists using AI to analyze tempo, mood, and energy levels for seamless transitions.

## Project Status

**BIG SWITCH COMPLETE!** ✅ Successfully pivoted from Electron desktop app to Next.js web application with SaaS capabilities. Currently in Next.js development phase with basic structure established.

## Web App Architecture

**Tech Stack:**
- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Authentication**: NextAuth.js with Spotify OAuth
- **State Management**: Zustand
- **Database**: Supabase (recommended) or PlanetScale
- **Payments**: Stripe for SaaS subscriptions
- **Audio**: Spotify Web Playback SDK + Web Audio API
- **Deployment**: Vercel (recommended) or Netlify
- **Build Tool**: Next.js (Vite under the hood)

**Project Structure:**
```
app/
├── layout.tsx           # Root layout with metadata
├── page.tsx            # Home page
├── api/                # Next.js API routes
│   ├── auth/           # NextAuth.js endpoints
│   ├── spotify/        # Spotify API proxy routes
│   └── stripe/         # Subscription management
components/
├── ui/                 # Reusable UI components
├── dj/                 # DJ-specific components
└── auth/               # Authentication components
lib/
├── spotify.ts          # Spotify API client
├── auth.ts             # NextAuth configuration
├── stripe.ts           # Stripe integration
└── utils.ts            # Helper functions
hooks/                  # Custom React hooks
stores/                 # Zustand stores
types/                  # TypeScript definitions
utils/                  # Utility functions
public/                 # Static assets
```

## Development Commands

```bash
# Install dependencies (already completed)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Type checking
npm run typecheck

# Run tests (when implemented)
npm run test
```

## Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# Core Spotify Configuration
SPOTIFY_CLIENT_ID=your_spotify_app_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_app_client_secret
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_app_client_id

# NextAuth.js
NEXTAUTH_SECRET=your_nextauth_secret_32_characters_minimum
NEXTAUTH_URL=http://localhost:3000

# Database (Supabase recommended)
DATABASE_URL=your_supabase_connection_string

# Stripe (for SaaS subscriptions)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Spotify Integration Requirements (Web-Optimized)

**Authentication (MUCH SIMPLER FOR WEB):**
- Use NextAuth.js Spotify provider (handles OAuth automatically)
- Standard web redirect URI: `https://yourdomain.com/api/auth/callback/spotify`
- For local dev: `http://localhost:3000/api/auth/callback/spotify`
- **NO desktop callback server needed!**
- Required scopes: user-read-playback-state, user-modify-playback-state, playlist-read-private, user-read-currently-playing, user-library-read, streaming
- **IMPORTANT**: Player control APIs require Spotify Premium subscription

**Spotify Web Playback SDK Integration (Web-Native):**
```javascript
// Load in browser - much cleaner than Electron
window.onSpotifyWebPlaybackSDKReady = () => {
  const token = session.accessToken;
  const player = new Spotify.Player({
    name: 'Shakabra - AI DJ Party Player',
    getOAuthToken: cb => { cb(token); },
    volume: 0.5,
  });
  
  player.connect();
};
```

**Latest Spotify Web API Endpoints (2025):**
- **Next.js API Routes** handle all Spotify API calls server-side
- `/api/spotify/playlists` - GET user playlists
- `/api/spotify/tracks/[id]` - GET playlist tracks  
- `/api/spotify/player/play` - Start/resume playback
- `/api/spotify/player/pause` - Pause playback
- `/api/spotify/player/queue` - Add tracks to queue (CRITICAL for DJ mixing)
- `/api/spotify/audio-features/[ids]` - Track audio analysis (tempo, energy, key, etc.)

**Rate Limiting & Error Handling:**
- Server-side rate limiting with Redis caching
- Handle 429 responses (rate limiting) with exponential backoff
- Handle 401 (token expiration) with NextAuth automatic refresh
- Handle 403 (Premium required) with user notification and upgrade prompts

## Core Features to Implement (SaaS-Ready)

1. **NextAuth.js Spotify authentication** with automatic session management
2. **SaaS subscription system** with Stripe integration (Free/Pro tiers)
3. **Playlist management** - fetch and display user playlists with feature gating
4. **AI mixing engine** - analyze track compatibility using Spotify audio features
5. **Spotify Web Playback SDK** - direct browser audio control (better than Electron)
6. **Progressive Web App** - installable, offline-capable
7. **Social features** - session sharing, collaborative queues, voting
8. **Real-time collaboration** - multiple users can influence the DJ session
9. **Cross-device control** - control DJ session from phone while playing on laptop

## SaaS Business Model

**Free Tier:**
- Limited to 3 playlists
- 50 tracks per session
- Basic crossfade (3 seconds max)
- Basic AI mixing (tempo + energy only)

**Pro Tier ($9.99/month):**
- Unlimited playlists and tracks
- Advanced crossfade up to 12 seconds
- Full AI algorithm with all weights
- Mix recording and export
- Advanced analytics
- Social features and collaboration
- Priority support

## AI Mixing Algorithm Specifications (Same Logic, Web-Optimized)

**Compatibility Scoring Weights:**
- Tempo compatibility: 30%
- Energy progression: 25%
- Key harmony: 20%
- Genre similarity: 15%
- Mood flow: 10%

**Web-Optimized Mixing Logic:**
- **Web Workers** for heavy audio analysis processing
- **IndexedDB** for caching audio features offline
- **Real-time updates** using WebSockets or Server-Sent Events
- **Canvas API** for waveform visualization
- **Web Audio API** for advanced audio analysis
- Match tempos within ±5% BPM tolerance
- Select next track 30 seconds before current track ends
- Prevent track repetition within 2-hour window

## State Management (Zustand) for Web App

**Store Structure:**
- **AuthStore**: NextAuth session integration and user data
- **PlaylistStore**: playlist data with web caching and feature gates
- **PlayerStore**: Spotify Web Playback SDK state
- **MixStore**: DJ engine state and queue with real-time sync
- **SettingsStore**: user preferences with localStorage persistence
- **SubscriptionStore**: Stripe subscription status and feature access
- **SocialStore**: collaboration features and session sharing

## Web App Advantages

**Technical Benefits:**
- **Simpler OAuth**: Standard web redirect
- **Better Performance**: Native web technologies, no Electron overhead
- **Instant Updates**: No app distribution, immediate feature deployment
- **Cross-Platform**: Works on any device with a browser
- **Better Audio Control**: Spotify Web Playback SDK more reliable than Connect
- **Real-time Features**: WebSockets, WebRTC for collaboration

**Business Benefits:**
- **SaaS Ready**: Built-in subscription management and analytics
- **Global Reach**: Instantly accessible worldwide
- **SEO/Discovery**: Search engine indexable, better marketing
- **Social Features**: Easy session sharing and collaboration
- **Mobile Responsive**: Works great on tablets for DJ control
- **PWA Capabilities**: Installable like native app, offline functionality

## Error Handling Priorities (Web-Optimized)

- **Network connectivity** with offline mode and cached data
- **Spotify API rate limiting** (429 responses) with server-side caching
- **Token expiration** (handled automatically by NextAuth)
- **Premium subscription requirement** with upgrade prompts
- **Cross-browser compatibility** issues
- **Mobile/tablet responsive** layout problems

## Documentation
- query context7 when needed 
- store fetched documentation for later use in /doc folder with .md format

## Design Guidelines (Web-Optimized)

- **Dark theme** optimized for party environments
- **Responsive design** that works on desktop, tablet, and mobile
- **Touch-friendly** controls for mobile/tablet DJ use
- **Custom color palette**: Deep purple (#8B5CF6), Electric blue (#06B6D4), Neon green (#10B981)
- **Accessibility compliance** (WCAG 2.1)
- **Progressive enhancement** - works without JavaScript
- **Fast loading** with Next.js optimizations
- **SEO optimized** for discoverability

## Development Workflow

Use the **SHAKABRA_TASKLIST.md** for detailed implementation phases. Current status:

**✅ Phase 1 Complete**: Next.js foundation, TypeScript setup, Tailwind configuration
**🚧 Phase 1 Remaining**: Spotify authentication setup (tasks 1.4-1.9)

**Next Steps**:
1. Implement NextAuth.js with Spotify provider
2. Set up basic authentication UI
3. Create responsive web app layout
4. Set up Zustand stores for web app state
5. Begin Phase 2: Next.js API routes and SaaS features

## Key Web Technologies

**Modern Web APIs Used:**
- **Spotify Web Playback SDK** - Direct browser audio control
- **Web Audio API** - Real-time audio analysis and visualization
- **IndexedDB** - Offline caching of audio features
- **Service Workers** - PWA functionality and offline support
- **WebSockets/SSE** - Real-time collaboration features
- **Web Workers** - Background audio processing
- **Canvas API** - Waveform visualization and UI effects
- **Web MIDI API** - Hardware DJ controller support (future)

The web app approach provides a **significantly better user experience** and **stronger business model** than the original desktop application concept.