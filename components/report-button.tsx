'use client'

import { useState, useTransition } from 'react'
import { submitReport } from '@/lib/actions/reports'
import { FlagIcon } from '@/components/icons'

const REASONS = ['Spoiled or unsafe food', 'Donor was a no-show', 'Suspicious / fake listing', 'Other']

export function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (submitted) {
    return <p className="text-sm text-[color:var(--muted)]">Thanks — our team will take a look.</p>
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-link text-sm" style={{ color: 'var(--muted)' }}>
        <FlagIcon size={14} /> Report
      </button>
    )
  }

  function handleSubmit() {
    setError(null)
    const combined = details.trim() ? `${reason}: ${details.trim()}` : reason
    startTransition(async () => {
      try {
        await submitReport(listingId, combined)
        setSubmitted(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not send report')
      }
    })
  }

  return (
    <div className="card card-pad" style={{ maxWidth: '24rem' }}>
      <p className="field-label">Report this listing</p>
      {error && <p className="banner banner-error mb-2">{error}</p>}
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="input mb-2">
        {REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Any details that would help (optional)"
        className="input mb-2"
      />
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={isPending} className="btn btn-danger btn-sm">
          {isPending ? 'Sending…' : 'Submit report'}
        </button>
        <button onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
