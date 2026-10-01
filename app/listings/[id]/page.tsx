import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { NavBar } from '@/components/nav-bar'
import { Countdown } from '@/components/countdown'
import { CountdownSplit } from '@/components/countdown-split'
import { ReportButton } from '@/components/report-button'
import { ArrowLeftIcon, BagIcon, TagIcon, LeafIcon, MapPinIcon, GridIcon, CheckIcon, NavigationIcon } from '@/components/icons'
import { LISTING_STATUS_LABEL, type Listing } from '@/lib/types'
import { coarseLocation } from '@/lib/privacy'
import { ClaimButton } from './claim-button'
import { ListingMap } from './listing-map'
import { CancelClaimButton } from './cancel-claim-button'
import { ChatPanel } from './chat-panel'
import type { Message } from '@/lib/types'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const session = await getSessionProfile()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles:donor_id(org_name, full_name, business_type, operating_hours)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const l = listing as Listing & {
    profiles: {
      org_name: string | null
      full_name: string | null
      business_type: string | null
      operating_hours: string | null
    } | null
  }

  const canClaim = session?.profile.role === 'receiver' || session?.profile.role === 'volunteer'
  const isMine = session != null && session.userId === l.claimed_by
  const isDonor = session != null && session.userId === l.donor_id
  const showExactLocation = session != null && (isDonor || isMine)
  const donorName = l.profiles?.org_name ?? l.profiles?.full_name ?? 'Donor'

  const canChat = l.claimed_by != null && (isMine || isDonor)
  let initialMessages: Message[] = []
  let otherUserName = ''
  if (canChat && session) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', l.id)
      .order('created_at', { ascending: true })
      .limit(200)
    initialMessages = (msgs ?? []) as Message[]

    if (isMine) {
      otherUserName = donorName
    } else {
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('full_name, org_name')
        .eq('id', l.claimed_by as string)
        .single()
      otherUserName = receiverProfile?.org_name ?? receiverProfile?.full_name ?? 'Receiver'
    }
  }

  return (
    <div className="page-shell">
      {session ? (
        <NavBar profile={session.profile} />
      ) : (
        <header className="page-header" style={{ position: 'static' }}>
          <Link href="/" className="brand">
            <span className="brand-mark">🍃</span>
            SaveBite
          </Link>
          <Link href="/login" className="btn btn-secondary btn-sm">
            Log in
          </Link>
        </header>
      )}

      <main className="page-main page-main--wide">
        <Link href="/dashboard/receiver" className="btn-link mb-4 inline-flex items-center gap-2">
          <ArrowLeftIcon size={15} />
          Back to food near you
        </Link>

        <div className="listing-hero-card">
          <div className="listing-hero-photo">
            {l.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photo_url} alt={l.title} />
            ) : (
              <span>[Food photo — full width]</span>
            )}
            <div className="listing-hero-badges">
              <span className={`pill-dot ${l.status === 'available' ? 'pill-dot-available' : 'pill-dot-claimed'}`}>
                {LISTING_STATUS_LABEL[l.status]}
              </span>
              <Countdown expiresAt={l.expires_at} variant="pill" />
            </div>
          </div>
          <div className="listing-hero-caption">
            {l.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {l.dietary_tags.map((tag) => (
                  <span key={tag} className="chip" style={{ background: 'var(--primary-soft)', color: 'var(--primary-hover)' }}>
                    {tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
            <h1>{l.title}</h1>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_22rem] gap-5 items-start">
          <div>
            <div className="panel">
              <p className="eyebrow">About this food</p>
              {l.description && <p className="mt-2">{l.description}</p>}

              <div className="mt-4 flex gap-3 flex-wrap">
                <div className="info-tile">
                  <span className="info-tile-icon">
                    <BagIcon size={17} />
                  </span>
                  <div>
                    <p className="info-tile-label">Quantity</p>
                    <p className="info-tile-value">
                      {l.quantity} {l.unit}
                    </p>
                  </div>
                </div>
                <div className="info-tile">
                  <span className="info-tile-icon">
                    <TagIcon size={17} />
                  </span>
                  <div>
                    <p className="info-tile-label">Category</p>
                    <p className="info-tile-value capitalize">{l.category.replace('_', ' ')}</p>
                  </div>
                </div>
                {l.dietary_tags.length > 0 && (
                  <div className="info-tile">
                    <span className="info-tile-icon">
                      <LeafIcon size={17} />
                    </span>
                    <div>
                      <p className="info-tile-label">Diet</p>
                      <p className="info-tile-value capitalize">
                        {l.dietary_tags.map((t) => t.replace('_', ' ')).join(' · ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="panel mt-4">
              <p className="eyebrow">Pickup</p>
              <div className="mt-3 grid grid-cols-[1fr_1.3fr] gap-4 items-start">
                {showExactLocation ? (
                  <ListingMap lat={l.lat} lng={l.lng} />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-[0.65rem] border text-xs text-center p-4"
                    style={{ height: 140, borderColor: 'var(--border)', color: 'var(--muted)' }}
                  >
                    Map shown after you claim
                  </div>
                )}
                <div>
                  <p className="font-bold">{showExactLocation ? l.address : coarseLocation(l.address)}</p>
                  {l.pickup_start && l.pickup_end && (
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Window: {new Date(l.pickup_start).toLocaleString()} –{' '}
                      {new Date(l.pickup_end).toLocaleTimeString()}
                    </p>
                  )}
                  {showExactLocation && l.special_instructions && (
                    <p className="mt-1 text-sm text-[color:var(--muted)]">Note: {l.special_instructions}</p>
                  )}
                  {showExactLocation ? (
                    <a
                      className="btn btn-secondary btn-sm mt-3"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`}
                    >
                      <NavigationIcon size={14} />
                      Get directions
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      The exact address and directions are shown once you claim this listing.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {canChat && session && (
              <ChatPanel
                listingId={l.id}
                currentUserId={session.userId}
                otherUserName={otherUserName}
                initialMessages={initialMessages}
              />
            )}

            {session && (
              <div className="mt-4">
                <ReportButton listingId={l.id} />
              </div>
            )}
          </div>

          <div>
            {isMine && l.status === 'claimed' ? (
              <div className="claim-status-panel">
                <div className="claim-status-header">
                  <span className="check-circle" style={{ height: '2.6rem', width: '2.6rem' }}>
                    <CheckIcon size={18} />
                  </span>
                  <div>
                    <strong>You claimed this</strong>
                    <p>Pick it up before time runs out.</p>
                  </div>
                </div>

                <CountdownSplit expiresAt={l.expires_at} />

                <Link href={`/claims/${l.id}`} className="btn btn-accent-solid">
                  <GridIcon size={16} />
                  Show pickup code
                </Link>

                <hr className="claim-status-divider" />

                <div className="claim-status-donor">
                  <span className="avatar">{donorName.charAt(0).toUpperCase()}</span>
                  <div>
                    <p>{donorName}</p>
                    <p>Donor</p>
                  </div>
                </div>

                <CancelClaimButton listingId={l.id} />
              </div>
            ) : (
              <div className="panel">
                <p className="eyebrow">Donor</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="avatar" style={{ height: '2.4rem', width: '2.4rem' }}>
                    {donorName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium">{donorName}</p>
                    {l.profiles?.business_type && (
                      <p className="text-sm text-[color:var(--muted)]">{l.profiles.business_type}</p>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  {l.status === 'available' && canClaim && (
                    <ClaimButton listingId={l.id} quantityTotal={l.quantity_total} unit={l.unit} />
                  )}
                  {l.status === 'available' && !session && (
                    <Link href="/login" className="btn btn-primary btn-block">
                      Log in to claim
                    </Link>
                  )}
                  {l.status !== 'available' && !isMine && (
                    <span className="badge badge-warning">
                      <MapPinIcon size={13} /> Already claimed
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
