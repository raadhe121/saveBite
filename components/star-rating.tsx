import { StarIcon } from '@/components/icons'

export function StarRatingDisplay({
  average,
  count,
  size = 14,
  hideCount = false,
}: {
  average: number
  count: number
  size?: number
  hideCount?: boolean
}) {
  if (count === 0) {
    return <span className="text-sm" style={{ color: 'var(--muted)' }}>No ratings yet</span>
  }
  return (
    <span className="flex items-center gap-1 text-sm">
      <span className="flex items-center" style={{ color: 'var(--accent)' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} size={size} filled={n <= Math.round(average)} />
        ))}
      </span>
      <strong>{average.toFixed(1)}</strong>
      {!hideCount && <span style={{ color: 'var(--muted)' }}>({count})</span>}
    </span>
  )
}
