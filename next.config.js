/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  
  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Bundle optimization
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'localhost:3002'],
    },
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image-cdn-ak.spotifycdn.com', 
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
        pathname: '/**',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Bundle analyzer (when ANALYZE=true)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      )
      return config
    },
  }),
}

module.exports = nextConfig
