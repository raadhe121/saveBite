'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cancelListing, confirmPickup, deleteListing, repostListing, unclaimListing } from '@/lib/actions/listings'
import { LISTING_STATUS_LABEL, type Listing } from '@/lib/types'
import { CameraIcon, CheckIcon, MapPinIcon } from '@/components/icons'
import { RatePickupButton } from '@/components/rate-pickup-button'

const statusBadge: Record<Listing['status'], string> = {
  available: 'badge-primary',
  claimed: 'badge-warning',
  picked_up: 'badge-muted',
  expired: 'badge-muted',
  cancelled: 'badge-danger',
}

const cardAccent: Record<Listing['status'], string> = {
  available: 'listing-card-available',
  claimed: 'listing-card-claimed',
  picked_up: 'listing-card-completed',
  expired: 'listing-card-expired',
  cancelled: 'listing-card-expired',
}

export function ListingRow({ listing, alreadyRated = false }: { listing: Listing; alreadyRated?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [enteringCode, setEnteringCode] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  function submitCode() {
    setCodeError(null)
    startTransition(async () => {
      try {
        await confirmPickup(listing.id, code)
        setEnteringCode(false)
        setCode('')
      } catch (e) {
        setCodeError(e instanceof Error ? e.message : 'Could not confirm pickup')
      }
    })
  }

  const hasProgress = listing.quantity_claimed != null && listing.quantity_total != null
  const progressPct = hasProgress
    ? Math.min(100, Math.round(((listing.quantity_claimed as number) / (listing.quantity_total as number)) * 100))
    : null

  return (
    <div className={`listing-card ${cardAccent[listing.status]}`}>
      <div className="flex items-center gap-4" style={{ minWidth: '14rem' }}>
        <div className="listing-card-photo">
          {listing.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.photo_url} alt="" />
          ) : (
            <CameraIcon size={22} />
          )}
        </div>

        <div className="listing-card-body">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-lg">{listing.title}</h4>
            <span className={`badge ${statusBadge[listing.status]}`}>{LISTING_STATUS_LABEL[listing.status]}</span>
          </div>

          <p className="listing-card-location">
            <MapPinIcon size={14} />
            {listing.address}
          </p>

          {hasProgress ? (
            <div className="listing-card-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span>
                {listing.quantity_claimed} of {listing.quantity_total} {listing.unit} claimed
              </span>
            </div>
          ) : (
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {listing.quantity} {listing.unit}
            </p>
          )}
        </div>
      </div>

      <div className="listing-card-actions">
        {listing.status === 'available' && (
          <>
            <Link href={`/dashboard/donor/listings/${listing.id}/edit`} className="btn btn-secondary btn-sm">
              Edit
            </Link>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => cancelListing(listing.id))}
              className="btn-link text-sm"
              style={{ color: 'var(--danger)' }}
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => deleteListing(listing.id))}
              className="btn-link text-sm"
              style={{ color: 'var(--danger)' }}
            >
              Delete
            </button>
          </>
        )}

        {listing.status === 'claimed' && !enteringCode && (
          <>
            <button onClick={() => setEnteringCode(true)} className="btn btn-primary btn-sm">
              <CheckIcon size={14} />
              Confirm pickup
            </button>
            <Link href={`/listings/${listing.id}`} className="btn btn-secondary btn-sm">
              Message receiver
            </Link>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => unclaimListing(listing.id))}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}
              title="Receiver didn't show up — reopen this listing"
            >
              Cancel claim
            </button>
          </>
        )}

        {listing.status === 'picked_up' && (
          <RatePickupButton
            listingId={listing.id}
            ratee="the receiver"
            ratingLabel="Rate receiver"
            alreadyRated={alreadyRated}
          />
        )}

        {(listing.status === 'picked_up' || listing.status === 'expired' || listing.status === 'cancelled') && (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => repostListing(listing.id))}
            className="btn btn-secondary btn-sm"
          >
            Repost
          </button>
        )}
      </div>

      {listing.status === 'claimed' && enteringCode && (
        <div className="flex w-full items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          {codeError && <p className="banner banner-error" style={{ padding: '0.4rem 0.7rem' }}>{codeError}</p>}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter receiver's pickup code"
            maxLength={6}
            className="input"
            style={{ maxWidth: '12rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}
          />
          <button onClick={submitCode} disabled={isPending || code.length < 4} className="btn btn-primary btn-sm">
            {isPending ? 'Checking…' : 'Verify & complete'}
          </button>
          <button onClick={() => setEnteringCode(false)} className="btn btn-secondary btn-sm">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
