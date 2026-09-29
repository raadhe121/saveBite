'use client'

import { useEffect, useState } from 'react'
import { ClockIcon } from '@/components/icons'

function format(msRemaining: number) {
  if (msRemaining <= 0) return 'Expired'
  const totalMinutes = Math.floor(msRemaining / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

export function Countdown({
  expiresAt,
  className,
  variant = 'badge',
}: {
  expiresAt: string
  className?: string
  variant?: 'badge' | 'chip' | 'pill'
}) {
  const target = new Date(expiresAt).getTime()
  const [remaining, setRemaining] = useState(() => target - Date.now())

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 30000)
    return () => clearInterval(id)
  }, [target])

  const expired = remaining <= 0
  const urgent = !expired && remaining < 60 * 60 * 1000

  if (variant === 'chip') {
    return (
      <span className={`countdown-chip ${urgent ? 'countdown-chip-urgent' : ''} ${className ?? ''}`}>
        <ClockIcon size={13} />
        {format(remaining)}
      </span>
    )
  }

  if (variant === 'pill') {
    return (
      <span className={`pill-white ${className ?? ''}`}>
        <ClockIcon size={13} />
        {format(remaining)}
      </span>
    )
  }

  return (
    <span
      className={`badge ${expired ? 'badge-muted' : urgent ? 'badge-danger' : 'badge-primary'} ${className ?? ''}`}
    >
      {format(remaining)}
    </span>
  )
}
