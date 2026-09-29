import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/lib/types'
import { LiveMap } from './live-map'

export default async function MapPage() {
  const supabase = await createClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles:donor_id(org_name, full_name)')
    .in('status', ['available', 'claimed'])

  return (
    <div className="flex h-screen flex-col">
      <header className="page-header" style={{ position: 'static' }}>
        <div>
          <div className="brand">
            <span className="brand-mark">🍃</span>
            SaveBite — Live map
          </div>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Surplus food available right now in your community.
          </p>
        </div>
      </header>
      <div className="flex-1">
        <LiveMap initialListings={(listings ?? []) as Listing[]} />
      </div>
    </div>
  )
}
