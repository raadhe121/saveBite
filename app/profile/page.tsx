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
    listings: { title: string; donor_id: string } | { title: string; donor_id: string }[] | null
  }[] = []
  const { data: myRatingsReceived } = await supabase
    .from('ratings')
    .select('stars')
    .eq('ratee_id', session.userId)
  const ratingCount = myRatingsReceived?.length ?? 0
  const ratingAverage = ratingCount > 0 ? myRatingsReceived!.reduce((s, r) => s + r.stars, 0) / ratingCount : 0

  let ratedListingIds: string[] = []

  if (session.profile.role === 'receiver' || session.profile.role === 'volunteer') {
    const [{ data }, { data: myRatings }] = await Promise.all([
      supabase
        .from('claims')
        .select('id, status, pickup_code, listing_id, listings(title, donor_id)')
        .eq('receiver_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('ratings').select('listing_id').eq('rater_id', session.userId),
    ])
    claims = data ?? []
    ratedListingIds = (myRatings ?? []).map((r) => r.listing_id)
  }

  return (
    <div className="page-shell">
      <NavBar profile={session.profile} />
      <ProfileShell
        profile={session.profile}
        email={user?.email ?? ''}
        claims={claims}
        ratedListingIds={ratedListingIds}
        ratingAverage={ratingAverage}
        ratingCount={ratingCount}
        initialTab={tab}
      />
    </div>
  )
}
