'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { claimListing } from '@/lib/actions/listings'

export function ClaimButton({
  listingId,
  quantityTotal,
  unit,
}: {
  listingId: string
  quantityTotal: number | null
  unit: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [partial, setPartial] = useState(false)
  const [amount, setAmount] = useState(quantityTotal ?? 1)

  function handleClaim() {
    setError(null)
    startTransition(async () => {
      try {
        await claimListing(listingId, partial ? amount : undefined)
        router.push(`/claims/${listingId}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not claim this listing')
      }
    })
  }

  return (
    <div>
      {error && <p className="banner banner-error mb-2">{error}</p>}

      {quantityTotal != null && quantityTotal > 1 && (
        <div className="mb-3">
          <label className="checkbox-pill mb-2">
            <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} />
            Claim only part of it
          </label>
          {partial && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={quantityTotal}
                value={amount}
                onChange={(e) => setAmount(Math.min(quantityTotal, Math.max(1, Number(e.target.value))))}
                className="input"
                style={{ maxWidth: '7rem' }}
              />
              <span className="text-sm text-[color:var(--muted)]">
                of {quantityTotal} {unit}
              </span>
            </div>
          )}
        </div>
      )}

      <button onClick={handleClaim} disabled={isPending} className="btn btn-primary">
        {isPending ? 'Claiming…' : 'Claim this listing'}
      </button>
    </div>
  )
}
