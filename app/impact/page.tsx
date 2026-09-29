import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/nav-bar'
import { BarChart } from '@/components/bar-chart'
import { BagIcon, ScaleIcon, CloudIcon } from '@/components/icons'
import { summarizeImpact, weeklySeries, topCategories, type ImpactRow } from '@/lib/impact'
import { CATEGORY_LABELS } from '@/lib/category-colors'
import type { FoodCategory } from '@/lib/types'

const DEFAULT_CATEGORIES: FoodCategory[] = ['cooked_meals', 'bakery', 'produce', 'packaged']

export default async function ImpactPage() {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  const supabase = await createClient()
  const isDonor = session.profile.role === 'donor'

  let rows: ImpactRow[] = []

  if (isDonor) {
    const { data } = await supabase
      .from('listings')
      .select('quantity_total, quantity_claimed, unit, category, picked_up_at')
      .eq('donor_id', session.userId)
      .eq('status', 'picked_up')
    rows = data ?? []
  } else {
    const { data } = await supabase
      .from('claims')
      .select('quantity_claimed, listings!inner(quantity_total, unit, category, picked_up_at)')
      .eq('receiver_id', session.userId)
      .eq('status', 'completed')

    rows = (data ?? []).map((c) => {
      const listing = Array.isArray(c.listings) ? c.listings[0] : c.listings
      return {
        quantity_total: listing?.quantity_total ?? null,
        quantity_claimed: c.quantity_claimed,
        unit: listing?.unit ?? 'items',
        category: listing?.category ?? 'other',
        picked_up_at: listing?.picked_up_at ?? null,
      }
    })
  }

  const summary = summarizeImpact(rows)
  const weekly = weeklySeries(summary.byWeek)
  const hasData = summary.pounds > 0
  const categories = hasData
    ? topCategories(summary.byCategory, 4)
    : DEFAULT_CATEGORIES.map((c) => ({ label: CATEGORY_LABELS[c], value: 0 }))
  const maxCategory = Math.max(1, ...categories.map((c) => c.value))

  return (
    <div className="page-shell">
      <NavBar profile={session.profile} />

      <div className="hero-banner" style={{ marginBottom: 0, borderRadius: 0, paddingBottom: '4.5rem' }}>
        <span className="hero-pill">Your running total</span>
        <h1 className="hero-headline" style={{ fontSize: '2.4rem' }}>
          Your impact
        </h1>
        <p className="hero-copy">
          {isDonor
            ? "Every listing you post keeps good food out of the bin. Here's what you've saved through SaveBite."
            : "Every pickup keeps good food out of the bin. Here's what you've saved through SaveBite."}
        </p>
      </div>

      <div className="page-main page-main--wide hero-overlap">
        <div className="grid grid-cols-3 gap-4">
          <div className="impact-stat-card">
            <span className="icon-badge icon-badge-primary">
              <BagIcon />
            </span>
            <p className="impact-stat-value">{Math.round(summary.meals)}</p>
            <p className="impact-stat-label">Meals {isDonor ? 'donated' : 'received'}</p>
          </div>
          <div className="impact-stat-card">
            <span className="icon-badge icon-badge-accent">
              <ScaleIcon />
            </span>
            <p className="impact-stat-value">
              {Math.round(summary.pounds)}
              <span>lbs</span>
            </p>
            <p className="impact-stat-label">Food saved</p>
          </div>
          <div className="impact-stat-card">
            <span className="icon-badge icon-badge-info">
              <CloudIcon />
            </span>
            <p className="impact-stat-value">
              {Math.round(summary.co2Kg)}
              <span>kg</span>
            </p>
            <p className="impact-stat-label">CO2 avoided</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_22rem] gap-4 items-start">
          <div className="panel">
            <div className="panel-header">
              <h2>Food saved per week</h2>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                Last 8 weeks
              </span>
            </div>

            {hasData ? (
              <BarChart data={weekly} suffix=" lb" />
            ) : (
              <div className="chart-empty">
                <strong>Your chart starts with your first pickup</strong>
                <p>Bars fill in each week as you {isDonor ? 'donate' : 'collect'} food.</p>
                <Link href={isDonor ? '/dashboard/donor/new' : '/dashboard/receiver'} className="btn btn-primary">
                  {isDonor ? 'Post surplus food' : 'Find food near you'}
                </Link>
                <div className="chart-empty-bars">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Top categories</h2>
            </div>

            {categories.map((c) => (
              <div key={c.label} className="category-row">
                <div className="category-row-head">
                  <span className="capitalize">{c.label}</span>
                  <span>{c.value}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(c.value / maxCategory) * 100}%` }} />
                </div>
              </div>
            ))}

            {!hasData && (
              <div className="note-box">Nothing here yet. Your most-received food types will rank here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
