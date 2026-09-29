import Link from 'next/link'
import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { LISTING_STATUS_LABEL, type Listing } from '@/lib/types'
import { releaseExpiredListings } from '@/lib/actions/listings'
import { ModerateButton } from '../admin-actions'

export default async function AdminListingsPage() {
  const { profile } = await requireRole(['admin'])
  const supabase = await createClient()

  await releaseExpiredListings()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles:donor_id(org_name, full_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const items = (listings ?? []) as Listing[]

  return (
    <AppShell profile={profile} title="Listings" subtitle={`${items.length} most recent`}>
      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Food item</th>
              <th>Donor</th>
              <th>Category</th>
              <th>Posted</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">
                  <Link href={`/dashboard/admin/listings/${l.id}`} className="btn-link">
                    {l.title}
                  </Link>
                </td>
                <td className="text-[color:var(--muted)]">
                  {l.profiles?.org_name ?? l.profiles?.full_name ?? 'Donor'}
                </td>
                <td className="capitalize text-[color:var(--muted)]">{l.category.replace('_', ' ')}</td>
                <td className="text-[color:var(--muted)]">{new Date(l.created_at).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`badge ${
                      l.status === 'available'
                        ? 'badge-primary'
                        : l.status === 'claimed'
                          ? 'badge-warning'
                          : l.status === 'cancelled'
                            ? 'badge-danger'
                            : 'badge-muted'
                    }`}
                  >
                    {LISTING_STATUS_LABEL[l.status]}
                  </span>
                </td>
                <td>{l.status !== 'cancelled' && <ModerateButton listingId={l.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
