'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/lib/types'

// react-leaflet's default marker icons reference asset paths that don't
// resolve under Next's bundler; point them at the CDN instead.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const claimedIcon = new L.Icon({
  ...markerIcon.options,
  className: 'grayscale opacity-60',
})

export function LiveMap({ initialListings }: { initialListings: Listing[] }) {
  const [listings, setListings] = useState(initialListings)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('map-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        (payload) => {
          setListings((current) => {
            const row = payload.new as Listing
            if (payload.eventType === 'DELETE') {
              return current.filter((l) => l.id !== (payload.old as Listing).id)
            }
            if (!['available', 'claimed'].includes(row.status)) {
              return current.filter((l) => l.id !== row.id)
            }
            const exists = current.some((l) => l.id === row.id)
            return exists ? current.map((l) => (l.id === row.id ? { ...l, ...row } : l)) : [row, ...current]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const center: [number, number] =
    listings.length > 0 ? [listings[0].lat, listings[0].lng] : [40.7128, -74.006]

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={listing.status === 'available' ? markerIcon : claimedIcon}
        >
          <Popup>
            <p className="font-medium">{listing.title}</p>
            <p>{listing.quantity}</p>
            <p>{listing.address}</p>
            <p className="text-xs text-gray-500">
              {listing.status === 'available' ? 'Available' : 'Claimed'} · until{' '}
              {new Date(listing.expires_at).toLocaleString()}
            </p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
