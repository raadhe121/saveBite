'use client'

import dynamic from 'next/dynamic'
import type { Listing } from '@/lib/types'

const LiveMapInner = dynamic(() => import('./live-map-inner').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm" style={{ color: 'var(--muted)' }}>
      Loading map…
    </div>
  ),
})

export function LiveMap({
  initialListings,
  currentUserId,
}: {
  initialListings: Listing[]
  currentUserId: string | null
}) {
  return <LiveMapInner initialListings={initialListings} currentUserId={currentUserId} />
}
