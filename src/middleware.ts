import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next()

  // CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
