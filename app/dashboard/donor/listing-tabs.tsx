'use client'

import { useMemo, useState } from 'react'
import type { Listing } from '@/lib/types'
import { ListingRow } from './listing-row'

type TabKey = 'active' | 'claimed' | 'completed' | 'expired'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'completed', label: 'Completed' },
  { key: 'expired', label: 'Expired / cancelled' },
]

function bucketOf(listing: Listing): TabKey {
  if (listing.status === 'available') return 'active'
  if (listing.status === 'claimed') return 'claimed'
  if (listing.status === 'picked_up') return 'completed'
  return 'expired'
}

export function ListingTabs({ listings }: { listings: Listing[] }) {
  const [tab, setTab] = useState<TabKey>('active')

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { active: 0, claimed: 0, completed: 0, expired: 0 }
    for (const l of listings) c[bucketOf(l)]++
    return c
  }, [listings])

  const shown = useMemo(() => listings.filter((l) => bucketOf(l) === tab), [listings, tab])

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`chip ${tab === t.key ? 'chip-active' : ''}`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {shown.length === 0 && (
          <p className="text-sm text-[color:var(--muted)]">Nothing here yet.</p>
        )}
        {shown.map((listing) => (
          <ListingRow key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
