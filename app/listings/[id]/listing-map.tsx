'use client'

import dynamic from 'next/dynamic'

const ListingMapInner = dynamic(() => import('./listing-map-inner').then((m) => m.ListingMap), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-[0.65rem] border text-xs"
      style={{ height: 200, borderColor: 'var(--border)', color: 'var(--muted)' }}
    >
      Loading map…
    </div>
  ),
})

export function ListingMap({ lat, lng }: { lat: number; lng: number }) {
  return <ListingMapInner lat={lat} lng={lng} />
}
