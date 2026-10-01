import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { ArrowLeftIcon } from '@/components/icons'
import type { Listing } from '@/lib/types'
import { LiveMap } from './live-map'

export default async function MapPage() {
  const supabase = await createClient()
  const session = await getSessionProfile()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles:donor_id(org_name, full_name)')
    .in('status', ['available', 'claimed'])

  return (
    <div className="flex h-screen flex-col">
      <header className="map-page-header">
        <Link href={session ? '/dashboard' : '/'} className="btn btn-secondary btn-sm">
          <ArrowLeftIcon size={15} />
          Back
        </Link>
        <span className="brand-mark">🍃</span>
        <div className="flex-1">
          <h1 className="font-bold text-lg" style={{ lineHeight: 1.2 }}>
            Live map
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Surplus food available right now in your community.
          </p>
        </div>
        <span className="live-pill-light">
          <span className="live-dot" style={{ background: 'var(--primary)' }} />
          Updating live
        </span>
      </header>
      <div className="flex-1">
        <LiveMap initialListings={(listings ?? []) as Listing[]} currentUserId={session?.userId ?? null} />
      </div>
    </div>
  )
}
