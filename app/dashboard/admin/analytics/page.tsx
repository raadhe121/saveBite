import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { BarChart } from '@/components/bar-chart'

function lastNDaysSeries(dates: string[], n: number) {
  const counts = new Map<string, number>()
  for (const d of dates) {
    const key = new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const series: { label: string; value: number }[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    series.push({ label, value: counts.get(label) ?? 0 })
  }
  return series
}

export default async function AdminAnalyticsPage() {
  const { profile } = await requireRole(['admin'])
  const supabase = await createClient()

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    supabase.from('profiles').select('created_at'),
    supabase.from('listings').select('created_at, status'),
  ])

  const signupDates = (profiles ?? []).map((p) => p.created_at as string)
  const listingDates = (listings ?? []).map((l) => l.created_at as string)

  const total = listings?.length ?? 0
  const cancelled = listings?.filter((l) => l.status === 'cancelled').length ?? 0
  const completed = listings?.filter((l) => l.status === 'picked_up').length ?? 0
  const denominator = total - cancelled
  const completionRate = denominator > 0 ? Math.round((completed / denominator) * 100) : 0

  return (
    <AppShell profile={profile} title="Analytics" subtitle="Platform activity over the last 14 days">
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="stat-label" style={{ marginTop: 0 }}>
            Total signups
          </p>
          <p className="stat-value">{profiles?.length ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginTop: 0 }}>
            Total listings
          </p>
          <p className="stat-value">{total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginTop: 0 }}>
            Completion rate
          </p>
          <p className="stat-value">{completionRate}%</p>
          <p className="stat-label">Picked up ÷ (posted − cancelled)</p>
        </div>
      </div>

      <h2 className="section-title">Signups per day</h2>
      <div className="panel">
        <BarChart data={lastNDaysSeries(signupDates, 14)} />
      </div>

      <h2 className="section-title">Listings posted per day</h2>
      <div className="panel">
        <BarChart data={lastNDaysSeries(listingDates, 14)} color="var(--accent)" />
      </div>
    </AppShell>
  )
}
