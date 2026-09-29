'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelMyClaim } from '@/lib/actions/listings'

export function CancelClaimButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      try {
        await cancelMyClaim(listingId)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not cancel your claim')
      }
    })
  }

  return (
    <div>
      {error && (
        <p className="banner banner-error mt-3" style={{ background: 'rgba(255,255,255,0.9)' }}>
          {error}
        </p>
      )}
      <button onClick={handleCancel} disabled={isPending} className="btn btn-outline-white">
        {isPending ? 'Cancelling…' : 'Cancel my claim'}
      </button>
    </div>
  )
}
