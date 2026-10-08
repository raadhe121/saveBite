'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { createClient } from '@/lib/supabase/client'
import { claimListing } from '@/lib/actions/listings'
import { coarseLocation } from '@/lib/privacy'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/category-colors'
import type { FoodCategory, Listing } from '@/lib/types'
import { Countdown } from '@/components/countdown'
import { SearchIcon, CrosshairIcon, CameraIcon, MapPinIcon } from '@/components/icons'

const BAG_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'

function pinIcon(color: string, muted = false) {
  return L.divIcon({
    className: 'map-pin-icon',
    html: `<span class="map-pin ${muted ? 'map-pin-muted' : ''}" style="background:${color}">${BAG_SVG}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  })
}

const youAreHereIcon = L.divIcon({
  className: 'you-are-here-icon',
  html: '<span class="you-are-here-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 0.6 })
  }, [target, map])
  return null
}

const categories: (FoodCategory | 'all')[] = [
  'all',
  'cooked_meals',
  'bakery',
  'produce',
  'dairy',
  'packaged',
  'beverages',
  'other',
]

export function LiveMap({
  initialListings,
  currentUserId,
}: {
  initialListings: Listing[]
  currentUserId: string | null
}) {
  const router = useRouter()
  const [listings, setListings] = useState(initialListings)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<FoodCategory | 'all'>('all')
  const [vegOnly, setVegOnly] = useState(false)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

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

  function locateMe(silent = false) {
    if (!('geolocation' in navigator)) {
      if (!silent) setLocateError("Your browser doesn't support location access.")
      return
    }
    if (!window.isSecureContext) {
      if (!silent) {
        setLocateError('Location only works over HTTPS (or localhost) — open the site securely to use this.')
      }
      return
    }
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setFlyTarget([loc.lat, loc.lng])
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (!silent) {
          setLocateError(
            err.code === err.PERMISSION_DENIED
              ? 'Location access is blocked — allow it in your browser settings to find food near you.'
              : "Couldn't find your location. Try again."
          )
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    locateMe(true)
    // Only auto-locate once on mount; silent so a denied/first-load prompt doesn't flash an error banner.
  }, [])

  const filtered = useMemo(() => {
    let result = listings
    if (category !== 'all') result = result.filter((l) => l.category === category)
    if (vegOnly) result = result.filter((l) => l.dietary_tags.some((t) => t === 'vegetarian' || t === 'vegan'))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((l) => l.title.toLowerCase().includes(q) || l.address.toLowerCase().includes(q))
    }
    return [...result].sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())
  }, [listings, category, vegOnly, search])

  function handleClaim(id: string) {
    setError(null)
    setPendingId(id)
    startTransition(async () => {
      try {
        await claimListing(id)
        router.push(`/claims/${id}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not claim this listing')
      } finally {
        setPendingId(null)
      }
    })
  }

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : listings.length > 0
      ? [listings[0].lat, listings[0].lng]
      : [40.7128, -74.006]

  return (
    <div className="map-page-body">
      <div className="map-sidebar">
        <div className="search-bar">
          <SearchIcon size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search food or area" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`cat-pill ${category === c ? 'cat-pill-active' : ''}`}
            >
              {c !== 'all' && <span className="cat-dot" style={{ background: CATEGORY_COLORS[c] }} />}
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setVegOnly((v) => !v)}
          className={`cat-pill mt-2 ${vegOnly ? 'cat-pill-active' : ''}`}
          style={{ alignSelf: 'flex-start' }}
        >
          Veg only
        </button>

        <div className="mt-4 flex items-center justify-between">
          <strong>
            {filtered.length} listing{filtered.length === 1 ? '' : 's'} nearby
          </strong>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Sorted by time left
          </span>
        </div>

        {error && <p className="banner banner-error mt-2">{error}</p>}

        <div className="map-sidebar-list">
          {filtered.length === 0 && (
            <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
              No listings match your filters.
            </p>
          )}
          {filtered.map((listing) => (
            <div key={listing.id} className="map-listing-card" onClick={() => setFlyTarget([listing.lat, listing.lng])}>
              <div className="map-listing-photo">
                {listing.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.photo_url} alt="" />
                ) : (
                  <CameraIcon size={20} />
                )}
              </div>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <p className="font-bold">{listing.title}</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {listing.quantity} {listing.unit} · {coarseLocation(listing.address)}
                </p>
                <Countdown expiresAt={listing.expires_at} variant="pill" />
                <div className="mt-2 flex gap-2">
                  <a
                    href={`/listings/${listing.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    View details
                  </a>
                  {listing.status !== 'available' ? (
                    <span className="badge badge-warning flex-1 text-center">Claimed</span>
                  ) : !currentUserId ? (
                    <a href="/login" onClick={(e) => e.stopPropagation()} className="btn btn-primary btn-sm flex-1">
                      Log in to claim
                    </a>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClaim(listing.id)
                      }}
                      disabled={isPending && pendingId === listing.id}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      {isPending && pendingId === listing.id ? 'Claiming…' : 'Claim'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="map-key">
          <span className="map-key-label">Map key</span>
          <span className="map-key-item">
            <span className="map-key-dot" style={{ background: 'var(--primary)' }} />
            Food available
          </span>
          <span className="map-key-item">
            <span className="map-key-dot" style={{ background: '#2563eb' }} />
            You are here
          </span>
        </div>
      </div>

      <div className="map-area">
        <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo target={flyTarget} />

          {userLocation && (
            <>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={400}
                pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08, weight: 1 }}
              />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={youAreHereIcon} />
            </>
          )}

          {filtered.map((listing) => (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={pinIcon(CATEGORY_COLORS[listing.category], listing.status !== 'available')}
            >
              <Popup>
                <div className="map-popup">
                  <p className="font-bold">{listing.title}</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {listing.quantity} {listing.unit}
                  </p>
                  <p className="flex items-center gap-1 text-sm" style={{ color: 'var(--muted)' }}>
                    <MapPinIcon size={13} />
                    {coarseLocation(listing.address)}
                  </p>
                  <Countdown expiresAt={listing.expires_at} variant="pill" />
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <button
          type="button"
          onClick={() => locateMe()}
          className="map-locate-btn"
          aria-label="Find my location"
          title="Find my location"
          disabled={locating}
        >
          <span className={locating ? 'spin' : undefined} style={{ display: 'inline-flex' }}>
            <CrosshairIcon size={17} />
          </span>
        </button>

        {locateError && (
          <div
            className="map-coords-chip"
            style={{ left: 'auto', right: '0.7rem', top: '9.3rem', bottom: 'auto', maxWidth: '16rem', color: 'var(--danger)' }}
          >
            {locateError}
          </div>
        )}
      </div>
    </div>
  )
}
