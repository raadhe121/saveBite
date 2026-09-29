import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { Countdown } from '@/components/countdown'
import { LISTING_STATUS_LABEL, type Listing, type Profile } from '@/lib/types'
import { ModerateButton } from '../../admin-actions'
import { PersonBanButton } from './person-ban-button'

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { profile } = await requireRole(['admin'])
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, donor:donor_id(*)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const { data: claim } = await supabase
    .from('claims')
    .select('*, receiver:receiver_id(*)')
    .eq('listing_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const l = listing as Listing & { donor: Profile }
  const receiver = claim?.receiver as Profile | undefined

  const statusBadge =
    l.status === 'available'
      ? 'badge-primary'
      : l.status === 'claimed'
        ? 'badge-warning'
        : l.status === 'cancelled'
          ? 'badge-danger'
          : 'badge-muted'

  return (
    <AppShell profile={profile} title={l.title} subtitle={`Listing detail · posted ${new Date(l.created_at).toLocaleString()}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`badge ${statusBadge}`}>{LISTING_STATUS_LABEL[l.status]}</span>
          <Countdown expiresAt={l.expires_at} />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/admin/listings" className="btn btn-secondary btn-sm">
            Back to listings
          </Link>
          {l.status !== 'cancelled' && <ModerateButton listingId={l.id} />}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_22rem] gap-5 items-start">
        <div>
          {l.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.photo_url} alt={l.title} className="mb-4 h-56 w-full rounded-xl object-cover" />
          )}

          <div className="panel">
            <div className="panel-header">
              <h2>Listing details</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="field-label">Quantity</p>
                <p className="font-medium">
                  {claim?.quantity_claimed != null && l.quantity_total != null
                    ? `${claim.quantity_claimed} of ${l.quantity_total} ${l.unit} claimed`
                    : `${l.quantity} ${l.unit}`}
                </p>
              </div>
              <div>
                <p className="field-label">Category</p>
                <p className="font-medium capitalize">{l.category.replace('_', ' ')}</p>
              </div>
            </div>

            {l.dietary_tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {l.dietary_tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}

            {l.description && <p className="mt-3 text-sm text-[color:var(--muted)]">{l.description}</p>}
          </div>

          <div className="panel mt-4">
            <div className="panel-header">
              <h2>Pickup</h2>
            </div>
            <p className="font-medium">{l.address}</p>
            {l.pickup_start && l.pickup_end && (
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Window: {new Date(l.pickup_start).toLocaleString()} – {new Date(l.pickup_end).toLocaleTimeString()}
              </p>
            )}
            {l.special_instructions && (
              <p className="mt-1 text-sm text-[color:var(--muted)]">Note: {l.special_instructions}</p>
            )}
            <a
              className="btn-link mt-2 inline-block text-sm"
              target="_blank"
              rel="noreferrer"
              href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`}
            >
              Open in Google Maps
            </a>
          </div>

          <div className="panel mt-4">
            <div className="panel-header">
              <h2>Timeline</h2>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Posted</span>
                <span>{new Date(l.created_at).toLocaleString()}</span>
              </div>
              {l.claimed_at && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Claimed</span>
                  <span>{new Date(l.claimed_at).toLocaleString()}</span>
                </div>
              )}
              {l.picked_up_at && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Picked up</span>
                  <span>{new Date(l.picked_up_at).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Expires</span>
                <span>{new Date(l.expires_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Owner / donor */}
          <div className="panel">
            <div className="panel-header">
              <h2>Owner (donor)</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="avatar" style={{ height: '2.6rem', width: '2.6rem' }}>
                {(l.donor.org_name ?? l.donor.full_name ?? '?').charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-medium">{l.donor.org_name ?? l.donor.full_name ?? 'Unnamed'}</p>
                <p className="text-sm text-[color:var(--muted)]">{l.donor.full_name}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-1 text-sm">
              {l.donor.phone && (
                <p>
                  <span style={{ color: 'var(--muted)' }}>Phone: </span>
                  {l.donor.phone}
                </p>
              )}
              {l.donor.business_type && (
                <p>
                  <span style={{ color: 'var(--muted)' }}>Type: </span>
                  {l.donor.business_type}
                </p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`badge ${
                  l.donor.verification_status === 'verified'
                    ? 'badge-primary'
                    : l.donor.verification_status === 'rejected'
                      ? 'badge-danger'
                      : 'badge-muted'
                }`}
              >
                {l.donor.verification_status}
              </span>
              {l.donor.banned_at && <span className="badge badge-danger">Banned</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <Link href="/dashboard/admin/users" className="btn btn-secondary btn-sm">
                View all users
              </Link>
              <PersonBanButton userId={l.donor_id} bannedAt={l.donor.banned_at} />
            </div>
          </div>

          {/* Receiver */}
          <div className="panel">
            <div className="panel-header">
              <h2>Received by</h2>
            </div>
            {!claim || !receiver ? (
              <p className="text-sm text-[color:var(--muted)]">Not claimed yet.</p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="avatar" style={{ height: '2.6rem', width: '2.6rem' }}>
                    {(receiver.org_name ?? receiver.full_name ?? '?').charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium">{receiver.org_name ?? receiver.full_name ?? 'Unnamed'}</p>
                    <p className="text-sm text-[color:var(--muted)]">{receiver.full_name}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  {receiver.phone && (
                    <p>
                      <span style={{ color: 'var(--muted)' }}>Phone: </span>
                      {receiver.phone}
                    </p>
                  )}
                  <p>
                    <span style={{ color: 'var(--muted)' }}>Pickup code: </span>
                    <strong style={{ letterSpacing: '0.15em' }}>{claim.pickup_code}</strong>
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`badge ${claim.status === 'completed' ? 'badge-primary' : 'badge-warning'}`}>
                    {claim.status === 'completed' ? 'Pickup completed' : 'Pending pickup'}
                  </span>
                  {receiver.banned_at && <span className="badge badge-danger">Banned</span>}
                </div>
                <div className="mt-3">
                  <PersonBanButton userId={receiver.id} bannedAt={receiver.banned_at} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
