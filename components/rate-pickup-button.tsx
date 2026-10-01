'use client'

import { useState, useTransition } from 'react'
import { submitRating } from '@/lib/actions/ratings'
import { StarIcon } from '@/components/icons'

export function RatePickupButton({
  listingId,
  ratee,
  ratingLabel,
  alreadyRated,
}: {
  listingId: string
  ratee: string
  ratingLabel: string
  alreadyRated: boolean
}) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(alreadyRated)
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (done && !open) {
    return <span className="badge badge-muted">Rated</span>
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">
        <StarIcon size={14} />
        {ratingLabel}
      </button>
    )
  }

  function submit() {
    if (stars === 0) {
      setError('Pick a star rating')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await submitRating(listingId, stars, comment)
        setDone(true)
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not submit rating')
      }
    })
  }

  return (
    <div className="rate-popover">
      <p className="field-label">Rate {ratee}</p>
      <div className="flex items-center gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="rate-star-btn"
            style={{ color: 'var(--accent)' }}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            <StarIcon size={22} filled={n <= (hover || stars)} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment…"
        className="input mt-2"
        maxLength={500}
      />
      {error && <p className="banner banner-error mt-2">{error}</p>}
      <div className="flex gap-2 mt-2">
        <button onClick={submit} disabled={isPending} className="btn btn-primary btn-sm">
          {isPending ? 'Submitting…' : 'Submit rating'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
