import type { Metadata } from 'next'
import { Inter, Orbitron, JetBrains_Mono } from 'next/font/google'
import { SessionProviderWrapper } from '@/components/providers/session-provider'
import { getServerAuthSession } from '@/lib/auth'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#00D9FF',
}

export const metadata: Metadata = {
  title: 'Shakabra - AI DJ Party Player',
  description: "The world's first AI-powered DJ that automatically mixes your Spotify playlists",
  keywords: ['AI DJ', 'Music Mixing', 'Spotify', 'Party', 'Automatic DJ'],
  authors: [{ name: 'Shakabra Team' }],
  openGraph: {
    title: 'Shakabra - AI DJ Party Player',
    description: 'Professional AI DJ mixing for your Spotify playlists',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession()

  return (
    <html lang="en" className="dark">
      <body 
        className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable} font-inter antialiased`}
      >
        <SessionProviderWrapper session={session}>
          <div className="min-h-screen bg-gradient-to-br from-void-black via-dark-gray to-void-black text-neon-white">
            <div className="fixed inset-0 bg-gradient-to-br from-electric-blue/5 via-transparent to-neon-purple/5 pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
