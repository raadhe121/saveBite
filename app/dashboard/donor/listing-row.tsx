'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cancelListing, confirmPickup, deleteListing, repostListing, unclaimListing } from '@/lib/actions/listings'
import { LISTING_STATUS_LABEL, type Listing } from '@/lib/types'

const statusBadge: Record<Listing['status'], string> = {
  available: 'badge-primary',
  claimed: 'badge-warning',
  picked_up: 'badge-muted',
  expired: 'badge-muted',
  cancelled: 'badge-danger',
}

export function ListingRow({ listing }: { listing: Listing }) {
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

  return (
    <div className="list-row" style={{ flexWrap: 'wrap' }}>
      <div className="flex items-center gap-3">
        {listing.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
        )}
        <div>
          <p className="font-medium">{listing.title}</p>
          <p className="text-sm text-[color:var(--muted)]">
            {listing.quantity_claimed != null && listing.quantity_total != null
              ? `${listing.quantity_claimed} of ${listing.quantity_total} ${listing.unit} claimed`
              : `${listing.quantity} ${listing.unit}`}{' '}
            · {listing.address}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`badge ${statusBadge[listing.status]}`}>{LISTING_STATUS_LABEL[listing.status]}</span>

        {listing.status === 'available' && (
          <>
            <Link href={`/dashboard/donor/listings/${listing.id}/edit`} className="btn-link text-sm">
              Edit
            </Link>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => deleteListing(listing.id))}
              className="btn-link text-sm"
              style={{ color: 'var(--danger)' }}
            >
              Delete
            </button>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => cancelListing(listing.id))}
              className="btn-link text-sm"
              style={{ color: 'var(--danger)' }}
            >
              Cancel
            </button>
          </>
        )}

        {listing.status === 'claimed' && !enteringCode && (
          <>
            <button onClick={() => setEnteringCode(true)} className="btn btn-primary btn-sm">
              Confirm pickup
            </button>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => unclaimListing(listing.id))}
              className="btn-link text-sm"
              style={{ color: 'var(--danger)' }}
              title="Receiver didn't show up — reopen this listing"
            >
              Cancel claim
            </button>
          </>
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
        <div className="flex w-full items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
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
