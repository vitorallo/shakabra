import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shakabra - AI DJ Party Player',
  description: "The world's first AI-powered DJ that automatically mixes your Spotify playlists",
  keywords: ['AI DJ', 'Music Mixing', 'Spotify', 'Party', 'Automatic DJ'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-void-black text-white">{children}</div>
      </body>
    </html>
  )
}
