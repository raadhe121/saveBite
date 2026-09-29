'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toPounds, poundsToMeals, poundsToCo2Kg } from '@/lib/impact'
import { BagIcon, TruckIcon, UsersIcon, LeafIcon } from '@/components/icons'

export function PlatformCounters({
  initialPounds,
  initialDonors,
}: {
  initialPounds: number
  initialDonors: number
}) {
  const [pounds, setPounds] = useState(initialPounds)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('landing-impact')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings' },
        (payload) => {
          const row = payload.new as { status: string; quantity_total: number | null; quantity_claimed: number | null; unit: string }
          const old = payload.old as { status: string }
          if (row.status === 'picked_up' && old.status !== 'picked_up') {
            const lbs = toPounds(row.quantity_claimed ?? row.quantity_total, row.unit)
            setPounds((p) => p + lbs)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const meals = Math.round(poundsToMeals(pounds))
  const co2 = Math.round(poundsToCo2Kg(pounds))

  return (
    <div className="grid grid-cols-4 gap-4">
      <CounterCard label="Meals saved" value={meals} icon={<BagIcon />} />
      <CounterCard label="Food rescued (lbs)" value={Math.round(pounds)} icon={<TruckIcon />} />
      <CounterCard label="CO2 avoided (kg)" value={co2} icon={<LeafIcon />} />
      <CounterCard label="Active donors" value={initialDonors} icon={<UsersIcon />} />
    </div>
  )
}

function CounterCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="stat-card" style={{ textAlign: 'center' }}>
      <span className="icon-badge icon-badge-primary" style={{ margin: '0 auto 0.75rem' }}>
        {icon}
      </span>
      <p className="stat-value">{value.toLocaleString()}</p>
      <p className="stat-label">{label}</p>
    </div>
  )
}
