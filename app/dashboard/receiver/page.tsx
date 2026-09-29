import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/nav-bar'
import type { Listing } from '@/lib/types'
import { ListingBrowser } from './listing-browser'

export default async function ReceiverDashboard() {
  const { userId, profile } = await requireRole(['receiver', 'volunteer', 'admin'])
  const supabase = await createClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles:donor_id(org_name, full_name)')
    .in('status', ['available', 'claimed'])
    .order('expires_at', { ascending: true })

  return (
    <div className="page-shell">
      <NavBar profile={profile} />
      <ListingBrowser initialListings={(listings ?? []) as Listing[]} currentUserId={userId} />
    </div>
  )
}
