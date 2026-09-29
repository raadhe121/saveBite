'use client'

import { useTransition } from 'react'
import { setVerification, moderateListing, resolveReport } from '@/lib/actions/admin'

export function VerifyButtons({ profileId }: { profileId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() => startTransition(() => setVerification(profileId, 'verified'))}
        className="btn btn-primary btn-sm"
      >
        Verify
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => setVerification(profileId, 'rejected'))}
        className="btn btn-danger btn-sm"
      >
        Reject
      </button>
    </div>
  )
}

export function ModerateButton({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => moderateListing(listingId))}
      className="btn-link text-sm"
      style={{ color: 'var(--danger)' }}
    >
      Remove
    </button>
  )
}

export function ResolveReportButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => resolveReport(reportId))}
      className="btn-link text-sm"
    >
      Mark resolved
    </button>
  )
}
