import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    redirect('/admin/login')
  }
  return user
} 