'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-hot-pink">Oops!</h1>
        <h2 className="mb-4 text-2xl font-semibold">Something went wrong</h2>
        <p className="mb-8 text-gray-400">We encountered an error while loading this page.</p>
        <button
          onClick={reset}
          className="rounded-lg bg-gradient-to-r from-hot-pink to-neon-purple px-6 py-3 font-semibold transition-all hover:scale-105"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
