import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { StarRatingDisplay } from '@/components/star-rating'
import type { Profile } from '@/lib/types'

interface RatingAggregate {
  profile: Profile
  average: number
  count: number
}

function RatingTable({ rows, roleLabel }: { rows: RatingAggregate[]; roleLabel: string }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{roleLabel}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No {roleLabel.toLowerCase()} yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name / org</th>
              <th>Rating</th>
              <th>Reviews</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ profile: p, average, count }) => (
              <tr key={p.id}>
                <td className="font-medium">{p.org_name ?? p.full_name ?? 'Unnamed'}</td>
                <td>
                  <StarRatingDisplay average={average} count={count} />
                </td>
                <td className="text-[color:var(--muted)]">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function aggregate(profiles: Profile[], ratingsByRatee: Map<string, number[]>): RatingAggregate[] {
  return profiles
    .map((profile) => {
      const stars = ratingsByRatee.get(profile.id) ?? []
      const count = stars.length
      const average = count > 0 ? stars.reduce((s, n) => s + n, 0) / count : 0
      return { profile, average, count }
    })
    .sort((a, b) => b.count - a.count)
}

export default async function AdminRatingsPage() {
  const { profile } = await requireRole(['admin'])
  const supabase = await createClient()

  const [{ data: profiles }, { data: ratings }] = await Promise.all([
    supabase.from('profiles').select('*').in('role', ['donor', 'receiver', 'volunteer']),
    supabase
      .from('ratings')
      .select('stars, comment, created_at, ratee_id, rater:rater_id(org_name, full_name), ratee:ratee_id(org_name, full_name, role)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const allProfiles = (profiles ?? []) as Profile[]
  const donors = allProfiles.filter((p) => p.role === 'donor')
  const receivers = allProfiles.filter((p) => p.role === 'receiver' || p.role === 'volunteer')

  const ratingsByRatee = new Map<string, number[]>()
  for (const r of ratings ?? []) {
    const list = ratingsByRatee.get(r.ratee_id) ?? []
    list.push(r.stars)
    ratingsByRatee.set(r.ratee_id, list)
  }

  const donorRatings = aggregate(donors, ratingsByRatee)
  const receiverRatings = aggregate(receivers, ratingsByRatee)

  type RatingFeedRow = {
    stars: number
    comment: string | null
    created_at: string
    rater: { org_name: string | null; full_name: string | null } | { org_name: string | null; full_name: string | null }[] | null
    ratee: { org_name: string | null; full_name: string | null; role: string } | { org_name: string | null; full_name: string | null; role: string }[] | null
  }
  const feed = (ratings ?? []) as RatingFeedRow[]
  const nameOf = (p: RatingFeedRow['rater']) => {
    const row = Array.isArray(p) ? p[0] : p
    return row?.org_name ?? row?.full_name ?? 'Someone'
  }

  return (
    <AppShell profile={profile} title="Ratings & reviews" subtitle="Food quality ratings for donors, reliability ratings for receivers">
      <div className="grid grid-cols-2 gap-4">
        <RatingTable rows={donorRatings} roleLabel="Donors — food quality" />
        <RatingTable rows={receiverRatings} roleLabel="Receivers — reliability" />
      </div>

      <div className="panel mt-4">
        <div className="panel-header">
          <h2>Recent reviews</h2>
        </div>
        {feed.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No reviews submitted yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {feed.map((r, i) => {
              const ratee = Array.isArray(r.ratee) ? r.ratee[0] : r.ratee
              return (
                <div key={i} className="list-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <p className="text-sm">
                      <strong>{nameOf(r.rater)}</strong> rated <strong>{nameOf(r.ratee)}</strong>{' '}
                      <span className="badge badge-muted capitalize">{ratee?.role}</span>
                    </p>
                    {r.comment && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>&ldquo;{r.comment}&rdquo;</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRatingDisplay average={r.stars} count={1} size={12} hideCount />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
