import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/nav-bar'
import { ProfileShell } from './profile-shell'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  const { tab } = await searchParams

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let claims: {
    id: string
    status: string
    pickup_code: string | null
    listing_id: string
    listings: { title: string } | { title: string }[] | null
  }[] = []

  if (session.profile.role === 'receiver' || session.profile.role === 'volunteer') {
    const { data } = await supabase
      .from('claims')
      .select('id, status, pickup_code, listing_id, listings(title)')
      .eq('receiver_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20)
    claims = data ?? []
  }

  return (
    <div className="page-shell">
      <NavBar profile={session.profile} />
      <ProfileShell profile={session.profile} email={user?.email ?? ''} claims={claims} initialTab={tab} />
    </div>
  )
}
