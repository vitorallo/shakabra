export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-8xl font-bold text-neon-purple">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="mb-8 text-gray-400">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="inline-block rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue px-6 py-3 font-semibold transition-all hover:scale-105"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
