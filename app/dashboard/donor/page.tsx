import Link from 'next/link'
import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/nav-bar'
import { PlusIcon } from '@/components/icons'
import type { Listing } from '@/lib/types'
import { releaseExpiredListings } from '@/lib/actions/listings'
import { ListingTabs } from './listing-tabs'

export default async function DonorDashboard() {
  const { userId, profile } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  await releaseExpiredListings()

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('donor_id', userId)
    .order('created_at', { ascending: false })

  const items = (listings ?? []) as Listing[]

  const impact = {
    posted: items.length,
    pickedUp: items.filter((l) => l.status === 'picked_up').length,
  }

  return (
    <div className="page-shell">
      <NavBar profile={profile} />
      <main className="page-main">
        <div className="hero-row">
          <div>
            <h1 className="page-title">Your listings</h1>
            <p className="page-subtitle">
              You've posted {impact.posted} listing{impact.posted === 1 ? '' : 's'}, {impact.pickedUp} picked
              up so far. Thank you for reducing food waste!
            </p>
          </div>
          <Link href="/dashboard/donor/new" className="btn btn-primary">
            <PlusIcon size={16} />
            Post surplus food
          </Link>
        </div>

        <ListingTabs listings={items} />
      </main>
    </div>
  )
}
