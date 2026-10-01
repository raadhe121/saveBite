import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { NavBar } from '@/components/nav-bar'
import { Countdown } from '@/components/countdown'
import { CheckIcon, MapPinIcon, ClockIcon, NavigationIcon, ChatIcon } from '@/components/icons'
import type { Listing } from '@/lib/types'
import { CopyCodeButton } from './copy-code-button'

export default async function ClaimConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  const supabase = await createClient()

  const [{ data: listing }, { data: claim }] = await Promise.all([
    supabase.from('listings').select('*, profiles:donor_id(org_name, full_name)').eq('id', id).single(),
    supabase
      .from('claims')
      .select('*')
      .eq('listing_id', id)
      .eq('receiver_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (!listing || !claim) notFound()

  const l = listing as Listing & {
    profiles: { org_name: string | null; full_name: string | null } | null
  }
  const donorName = l.profiles?.org_name ?? l.profiles?.full_name ?? 'donor'
  const qrDataUrl = claim.pickup_code
    ? await QRCode.toDataURL(claim.pickup_code, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: { dark: '#12201a', light: '#ffffff' },
      })
    : null

  return (
    <div className="page-shell">
      <NavBar profile={session.profile} />

      <div className="hero-banner claim-hero" style={{ marginBottom: 0, borderRadius: 0, paddingBottom: '6rem' }}>
        <span className="confetti" style={{ top: '18%', left: '27%', height: '1.1rem', width: '1.1rem', background: 'var(--accent)', transform: 'rotate(20deg)' }} />
        <span className="confetti" style={{ top: '15%', right: '32%', height: '1.6rem', width: '0.4rem', background: 'var(--accent)', transform: 'rotate(-30deg)' }} />
        <span className="confetti" style={{ top: '38%', left: '32%', height: '0.5rem', width: '0.5rem', borderRadius: '999px', background: 'rgba(255,255,255,0.5)' }} />
        <span className="confetti" style={{ top: '30%', right: '20%', height: '0.6rem', width: '0.6rem', borderRadius: '999px', background: '#4ade80' }} />

        <span className="check-circle">
          <CheckIcon size={30} />
        </span>
        <p className="claim-eyebrow">CLAIM CONFIRMED</p>
        <h1 className="hero-headline" style={{ fontSize: '2.6rem', margin: '0.5rem auto 0' }}>
          You've got it!
        </h1>
        <p className="hero-copy" style={{ margin: '0.6rem auto 0' }}>
          Show this code to the donor when you arrive, or let them scan the QR.
        </p>
      </div>

      <div className="claim-card">
        {claim.status === 'completed' ? (
          <div className="text-center py-6">
            <span className="badge badge-primary">Pickup completed</span>
          </div>
        ) : (
          <div className="qr-code-row">
            {qrDataUrl && (
              <div className="qr-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Pickup QR code" />
                <span className="qr-overlay" />
              </div>
            )}
            <div>
              <p className="field-label">Pickup code</p>
              <div className="code-boxes">
                {(claim.pickup_code ?? '').split('').map((ch: string, i: number) => (
                  <span key={i} className="code-box">
                    {ch}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <CopyCodeButton code={claim.pickup_code ?? ''} />
              </div>
            </div>
          </div>
        )}

        <hr className="claim-divider" />

        <div className="listing-summary-row">
          <div className="listing-summary-photo">
            {l.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photo_url} alt="" />
            ) : (
              <span>[photo]</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{l.title}</p>
              <span className="qty-chip" style={{ position: 'static' }}>
                {l.quantity} {l.unit}
              </span>
            </div>
            <p className="listing-summary-meta">
              <MapPinIcon size={14} />
              {l.address}
            </p>
            {l.pickup_start && l.pickup_end && (
              <p className="listing-summary-meta">
                <ClockIcon size={14} />
                Pickup window: {new Date(l.pickup_start).toLocaleString()} –{' '}
                {new Date(l.pickup_end).toLocaleTimeString()}
              </p>
            )}
          </div>
          <Countdown expiresAt={l.expires_at} />
        </div>
      </div>

      <div className="page-main" style={{ maxWidth: '48rem', paddingTop: '1.25rem' }}>
        <div className="grid grid-cols-3 gap-3">
          <a
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`}
          >
            <NavigationIcon size={15} />
            Get directions
          </a>
          <Link href={`/listings/${l.id}`} className="btn btn-secondary">
            <ChatIcon size={15} />
            Message {donorName}
          </Link>
          <Link href="/dashboard/receiver" className="btn btn-secondary">
            Back to food near you
          </Link>
        </div>
      </div>
    </div>
  )
}
