# SHAKABRA - AI DJ Party Player - Micro SaaS Web App PRD

## 🎯 Product Vision

### Mission Statement
Create the world's first AI-powered DJ web application that automatically mixes Spotify playlists with professional-grade transitions, making every party legendary through intelligent music curation.

### Target Market
- **Primary**: Party hosts, event planners, small venue owners
- **Secondary**: Amateur DJs, music enthusiasts, social media content creators
- **Tertiary**: Professional DJs seeking AI assistance

## 🏗️ Technical Architecture

### Stack Selection
```
Frontend: Next.js 14 + React + TypeScript
Styling: Tailwind CSS + Framer Motion (shadcn if needed)
Authentication: NextAuth.js + Spotify OAuth
Backend: Next.js API Routes + Prisma ORM
Database: PostgreSQL (Supabase/PlanetScale)
Deployment: Vercel + CDN
Analytics: Posthog + Stripe Analytics
Real-time: WebSockets (Pusher/Socket.io)
Payments: stripe
```

### Infrastructure
- **Hosting**: Vercel for automatic scaling
- **Database**: Supabase for PostgreSQL + real-time features
- **CDN**: Vercel Edge Network for global performance
- **Monitoring**: Sentry for error tracking
- **Analytics**: PostHog for user behavior insights

## 💰 Monetization Strategy

### Pricing Tiers

#### 🆓 **Free Tier** - "Party Starter"
- **Price**: $0/month
- **Limits**: 
  - 2 AI DJ sessions per month (max 1 hour each)
  - Access to 1 playlists
  - Basic mixing algorithm
  - Standard audio quality
  - No support
- **Features**:
  - Spotify playlist import
  - Basic auto-DJ mixing
  - Simple crossfade transitions
  - Mobile-responsive interface

#### 💎 **Pro Tier** - "Party Legend" 
- **Price**: $9.99/month or $99/year (1 months free)
- **Limits**: 
  - Unlimited AI DJ sessions
  - Unlimited playlists
  - Advanced mixing algorithms
  - High-quality audio analysis
  - Priority support
- **Features**:
  - All Free features +
  - Advanced AI mixing (key matching, energy progression)
  - Custom party modes (chill, build-up, peak time)
  - Real-time audio visualization
  - Mix history and analytics
  - Download mix reports
  - Custom crossfade settings (1-30 seconds)
  - Multi-room sync capabilities
  - ambiend mood selection based on predefined list: see enum Partymode

### Revenue Projections (Year 1)
- **Month 6**: 1,000 users (850 Free, 140 Pro) = ~$2,000 MRR
- **Month 12**: 5,000 users (3,500 Free, 1,400 Pro) = ~$19,000 MRR

## 🎨 UI/UX Design System

### Design Philosophy
- **Dark-first**: Optimized for party/club environments
- **Neon aesthetics**: Electric blues, purples, and accent colors
- **Minimalist**: Clean interface that doesn't distract from music
- **Touch-friendly**: Large buttons for mobile/tablet use

### Color Palette
```css
Primary Colors:
--electric-blue: #00D9FF
--neon-purple: #B347FF
--acid-green: #39FF14
--hot-pink: #FF1493

Background Colors:
--void-black: #0A0A0A
--dark-gray: #1A1A1A
--mid-gray: #2D2D2D
--light-gray: #404040

Text Colors:
--neon-white: #FFFFFF
--muted-gray: #9CA3AF
--dim-gray: #6B7280
```

### Typography
- **Headers**: Inter Bold for modern tech feel
- **Body**: Inter Regular for excellent readability
- **Accent**: Orbitron for futuristic elements
- **Code**: JetBrains Mono for technical displays

### Component Library
- **Glassmorphism cards** for content containers
- **Neon glow effects** for active states
- **Smooth animations** with Framer Motion
- **Audio waveform visualizations**
- **Gradient backgrounds** with subtle motion

## 🚀 Core Features

### 1. Authentication & Onboarding
- **Spotify OAuth Integration**: Seamless login with required scopes
- **Freemium Onboarding**: 
  - Welcome tutorial with interactive demo
  - Tier selection with clear value props
  - First mix setup wizard
- **User Profile**: Usage analytics, subscription management

### 2. AI DJ Engine

#### Smart Playlist Analysis
```typescript
interface PlaylistAnalysis {
  totalTracks: number;
  averageTempo: number;
  energyDistribution: EnergyLevel[];
  genreBreakdown: GenreStats[];
  moodProgression: MoodAnalysis;
  mixabilityScore: number; // 0-100
}
```

#### Advanced Mixing Algorithm
- **Tempo Matching**: BPM synchronization within ±3% tolerance
- **Harmonic Mixing**: Key compatibility using Camelot Wheel
- **Energy Management**: Intelligent energy curve progression
- **Mood Transitions**: Valence-based emotional journey
- **Genre Blending**: Smart cross-genre mixing when appropriate

#### Party Modes
```typescript
enum PartyMode {
  WARM_UP = "warm_up",     // Gradual energy build (60-90 BPM)
  PEAK_TIME = "peak_time", // High energy maintenance (120-130 BPM)
  COOL_DOWN = "cool_down", // Gentle wind-down (80-100 BPM)
  ECLECTIC = "eclectic",   
  ROCK = "rock",
  LATINO = "latino",
  VINTAGE = "vintage"
}