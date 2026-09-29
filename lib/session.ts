import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/types'

export async function getSessionProfile(): Promise<{ userId: string; profile: Profile } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return { userId: user.id, profile: profile as Profile }
}

export async function requireRole(roles: UserRole[]) {
  const session = await getSessionProfile()
  if (!session) redirect('/login')
  if (session.profile.banned_at) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login?error=Your account has been suspended. Contact support if you think this is a mistake.')
  }
  if (!roles.includes(session.profile.role)) redirect('/dashboard')
  return session
}
