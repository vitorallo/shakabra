import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function getServerAuthSession() {
  return await getServerSession(authOptions)
}

export { authOptions }