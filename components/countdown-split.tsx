'use client'

import { useEffect, useState } from 'react'

export function CountdownSplit({ expiresAt }: { expiresAt: string }) {
  const target = new Date(expiresAt).getTime()
  const [remaining, setRemaining] = useState(() => target - Date.now())

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 30000)
    return () => clearInterval(id)
  }, [target])

  const totalMinutes = Math.max(0, Math.floor(remaining / 60000))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const [big, bigLabel, small, smallLabel] =
    days > 0 ? [days, 'day' + (days === 1 ? '' : 's'), hours, 'hours'] : [hours, 'hours', minutes, 'min']

  return (
    <div className="countdown-display">
      <div>
        <strong>{remaining <= 0 ? 0 : big}</strong>
        <span>{bigLabel}</span>
      </div>
      <span className="countdown-display-colon">:</span>
      <div>
        <strong>{remaining <= 0 ? 0 : small}</strong>
        <span>{smallLabel}</span>
      </div>
    </div>
  )
}
