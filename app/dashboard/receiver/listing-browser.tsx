'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { claimListing } from '@/lib/actions/listings'
import { DIETARY_TAGS, type DietaryTag, type FoodCategory, type Listing } from '@/lib/types'
import { distanceMiles, parseQuantityNumber } from '@/lib/distance'
import { coarseLocation } from '@/lib/privacy'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/category-colors'
import { Countdown } from '@/components/countdown'
import { SearchIcon, CrosshairIcon, BellIcon, MapPinIcon } from '@/components/icons'

const categories: (FoodCategory | 'all')[] = [
  'all',
  'bakery',
  'produce',
  'dairy',
  'cooked_meals',
  'packaged',
  'beverages',
  'other',
]

type SortKey = 'distance' | 'time_left'

export function ListingBrowser({
  initialListings,
  currentUserId,
}: {
  initialListings: Listing[]
  currentUserId: string
}) {
  const router = useRouter()
  const [listings, setListings] = useState(initialListings)
  const [category, setCategory] = useState<FoodCategory | 'all'>('all')
  const [tags, setTags] = useState<DietaryTag[]>([])
  const [search, setSearch] = useState('')
  const [radius, setRadius] = useState<number | 'any'>('any')
  const [minQuantity, setMinQuantity] = useState('')
  const [sort, setSort] = useState<SortKey>('time_left')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('listings-realtime')
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
            return exists
              ? current.map((l) => (l.id === row.id ? { ...l, ...row } : l))
              : [row, ...current]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setLocationError('Your browser does not support location detection.')
      return
    }
    setLocationError(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocationError('Could not get your location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const withDistance = useMemo(
    () =>
      listings.map((l) => ({
        ...l,
        distance: userLocation ? distanceMiles(userLocation.lat, userLocation.lng, l.lat, l.lng) : null,
      })),
    [listings, userLocation]
  )

  const filtered = useMemo(() => {
    let result = withDistance

    if (category !== 'all') result = result.filter((l) => l.category === category)
    if (tags.length > 0) result = result.filter((l) => tags.every((t) => l.dietary_tags.includes(t)))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || (l.description ?? '').toLowerCase().includes(q)
      )
    }
    if (radius !== 'any' && userLocation) {
      result = result.filter((l) => l.distance != null && l.distance <= radius)
    }
    if (minQuantity.trim()) {
      const min = Number(minQuantity)
      if (Number.isFinite(min)) {
        result = result.filter((l) => {
          const q = parseQuantityNumber(l.quantity)
          return q == null || q >= min
        })
      }
    }

    result = [...result].sort((a, b) => {
      if (sort === 'distance') {
        if (a.distance == null && b.distance == null) return 0
        if (a.distance == null) return 1
        if (b.distance == null) return -1
        return a.distance - b.distance
      }
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    })

    return result
  }, [withDistance, category, tags, search, radius, minQuantity, sort, userLocation])

  function toggleTag(tag: DietaryTag) {
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))
  }

  function clearFilters() {
    setCategory('all')
    setTags([])
    setSearch('')
    setRadius('any')
    setMinQuantity('')
  }

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

  const hasActiveFilters =
    category !== 'all' || tags.length > 0 || search.trim() !== '' || radius !== 'any' || minQuantity.trim() !== ''

  return (
    <div>
      {/* Hero */}
      <div className="hero-banner" style={{ marginBottom: 0, borderRadius: 0, paddingBottom: '4.5rem' }}>
        <span className="live-badge">
          <span className="live-dot" />
          Live · updates as listings come and go
        </span>
        <h1 className="hero-headline" style={{ fontSize: '2.4rem', marginTop: '0.6rem' }}>
          Fresh food, waiting for you nearby.
        </h1>

        <div className="hero-search-bar mt-5">
          <SearchIcon size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bread, rice, sandwiches…"
          />
          <button type="button" onClick={useMyLocation} disabled={locating} className="btn btn-secondary btn-sm">
            <CrosshairIcon size={14} />
            {locating ? 'Locating…' : 'Near me'}
          </button>
          <button type="button" className="btn btn-hero-primary btn-sm">
            Search
          </button>
        </div>
        {locationError && <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{locationError}</p>}
      </div>

      {/* Filter card, overlapping the hero */}
      <div className="filter-card">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`cat-pill ${category === c ? 'cat-pill-active' : ''}`}
            >
              {c !== 'all' && (
                <span className="cat-dot" style={{ background: CATEGORY_COLORS[c] }} />
              )}
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
              Diet
            </span>
            {DIETARY_TAGS.map((tag) => (
              <label key={tag} className="checkbox-pill">
                <input type="checkbox" checked={tags.includes(tag)} onChange={() => toggleTag(tag)} />
                <span className="capitalize">{tag === 'contains_nuts' ? 'No nuts' : tag.replace('_', ' ')}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="compact-select">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="time_left">Time left</option>
                <option value="distance">Distance</option>
              </select>
            </label>
            <label className="compact-select">
              Within
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value === 'any' ? 'any' : Number(e.target.value))}
              >
                <option value="any">Any distance</option>
                <option value={1}>1 mi</option>
                <option value={3}>3 mi</option>
                <option value={5}>5 mi</option>
                <option value={10}>10 mi</option>
              </select>
            </label>
            <label className="compact-select">
              Min qty
              <input
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="Any"
                inputMode="numeric"
                style={{ width: '3rem' }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="page-main page-main--wide" style={{ paddingTop: '1.5rem' }}>
        {error && <p className="banner banner-error mb-3">{error}</p>}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {filtered.length} listing{filtered.length === 1 ? '' : 's'} available
          </h2>
          <Link href="/map" className="btn-link text-sm">
            View on live map →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {filtered.map((listing) => {
            const showExact = listing.claimed_by === currentUserId
            return (
              <div key={listing.id} className="food-card">
                <Link href={`/listings/${listing.id}`} className="food-card-photo">
                  {listing.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.photo_url} alt="" />
                  ) : (
                    <span>[{listing.title} photo]</span>
                  )}
                  <Countdown expiresAt={listing.expires_at} variant="chip" />
                  <span className="qty-chip">
                    {listing.quantity} {listing.unit}
                  </span>
                </Link>

                <div className="food-card-body">
                  <div>
                    <Link href={`/listings/${listing.id}`}>
                      <p className="font-bold">{listing.title}</p>
                    </Link>
                    <p className="food-card-location">
                      <MapPinIcon size={14} />
                      {showExact ? listing.address : coarseLocation(listing.address)}
                      {listing.distance != null && ` · ${listing.distance.toFixed(1)} mi`}
                    </p>
                  </div>

                  {listing.dietary_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {listing.dietary_tags.map((tag) => (
                        <span key={tag} className="chip" style={{ background: 'var(--primary-soft)', color: 'var(--primary-hover)' }}>
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="food-card-donor">
                    <div className="food-card-donor-info">
                      <span className="avatar">
                        {(listing.profiles?.org_name ?? listing.profiles?.full_name ?? '?').charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="food-card-donor-name">
                          {listing.profiles?.org_name ?? listing.profiles?.full_name ?? 'Donor'}
                        </p>
                        <p className="food-card-donor-role">Donor</p>
                      </div>
                    </div>

                    {listing.status === 'available' ? (
                      <button
                        onClick={() => handleClaim(listing.id)}
                        disabled={isPending && pendingId === listing.id}
                        className="btn btn-primary btn-sm"
                      >
                        {isPending && pendingId === listing.id ? 'Claiming…' : 'Claim'}
                      </button>
                    ) : (
                      <span className="badge badge-warning">Claimed</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="empty-live-card">
            <span className="icon-badge icon-badge-primary" style={{ height: '3.2rem', width: '3.2rem' }}>
              <BellIcon size={22} />
            </span>
            <strong>More food is on the way</strong>
            <p>New listings appear here automatically. Widen your distance or clear filters to see more.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-secondary btn-sm mt-1">
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
