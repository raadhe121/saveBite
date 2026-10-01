import Link from 'next/link'
import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/nav-bar'
import { PlusIcon, BagIcon, ClockIcon, CheckIcon } from '@/components/icons'
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

  const stats = {
    posted: items.length,
    waitingForPickup: items.filter((l) => l.status === 'claimed').length,
    pickedUp: items.filter((l) => l.status === 'picked_up').length,
  }

  return (
    <div className="page-shell">
      <NavBar profile={profile} />

      <div className="hero-banner" style={{ marginBottom: 0, borderRadius: 0 }}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className="hero-pill">Thank you for reducing food waste</span>
            <h1 className="hero-headline">Your listings</h1>
            <p className="hero-copy">Track every food post from claim to pickup.</p>
          </div>
          <Link href="/dashboard/donor/new" className="btn btn-hero-primary">
            <PlusIcon size={16} />
            Post surplus food
          </Link>
        </div>
      </div>

      <main className="page-main hero-overlap">
        <div className="stat-row mb-5">
          <div className="stat-row-card">
            <span className="icon-badge icon-badge-primary">
              <BagIcon size={18} />
            </span>
            <div>
              <strong>{stats.posted}</strong>
              <span>Listings posted</span>
            </div>
          </div>
          <div className="stat-row-card">
            <span className="icon-badge icon-badge-accent">
              <ClockIcon size={18} />
            </span>
            <div>
              <strong>{stats.waitingForPickup}</strong>
              <span>Waiting for pickup</span>
            </div>
          </div>
          <div className="stat-row-card">
            <span className="icon-badge icon-badge-info">
              <CheckIcon size={18} />
            </span>
            <div>
              <strong>{stats.pickedUp}</strong>
              <span>Picked up</span>
            </div>
          </div>
        </div>

        <ListingTabs listings={items} />
      </main>
    </div>
  )
}
