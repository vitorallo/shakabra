'use server'

// Server Actions for Next.js 15
export async function getServerTime() {
  return new Date().toISOString()
}

export async function logUserAction(action: string, data?: any) {
  console.log(`User action: ${action}`, data)
  // In production, this would log to your analytics service
  return { success: true, timestamp: new Date().toISOString() }
}
