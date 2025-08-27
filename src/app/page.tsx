import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-void-black via-dark-gray to-void-black" />

      {/* Hero section */}
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-7xl font-bold md:text-8xl">
            <span className="animate-pulse bg-gradient-to-r from-electric-blue via-neon-purple to-acid-green bg-clip-text text-transparent">
              Shakabra
            </span>
          </h1>

          <h2 className="mb-8 text-2xl font-light text-gray-300 md:text-3xl">AI DJ Party Player</h2>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
            The world's first AI-powered DJ that automatically mixes your Spotify playlists with
            professional-grade transitions, intelligent track selection, and perfect energy flow.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/signin"
              className="inline-block rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue px-8 py-4 text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-neon-purple/25"
            >
              Start Mixing Now
            </Link>

            <Link
              href="/demo"
              className="inline-block rounded-lg border border-electric-blue bg-transparent px-8 py-4 text-lg font-semibold text-electric-blue transition-all hover:scale-105 hover:bg-electric-blue hover:text-void-black"
            >
              Watch Demo
            </Link>
          </div>

          {/* Features preview */}
          <div className="mt-16 grid grid-cols-1 gap-8 text-center md:grid-cols-3">
            <div className="rounded-lg border border-gray-800 bg-dark-gray/50 p-6 backdrop-blur-sm">
              <div className="mb-2 text-3xl">🤖</div>
              <h3 className="mb-2 font-semibold text-electric-blue">AI Mixing</h3>
              <p className="text-sm text-gray-400">
                Intelligent track selection with perfect tempo and key matching
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-dark-gray/50 p-6 backdrop-blur-sm">
              <div className="mb-2 text-3xl">🎵</div>
              <h3 className="mb-2 font-semibold text-neon-purple">Spotify Integration</h3>
              <p className="text-sm text-gray-400">
                Direct access to your playlists with real-time playback control
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-dark-gray/50 p-6 backdrop-blur-sm">
              <div className="mb-2 text-3xl">⚡</div>
              <h3 className="mb-2 font-semibold text-acid-green">Live Mixing</h3>
              <p className="text-sm text-gray-400">
                Professional crossfades and seamless transitions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
