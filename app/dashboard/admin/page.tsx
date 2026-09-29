import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { BagIcon, TruckIcon, UsersIcon, ShieldCheckIcon, FlagIcon, PlusIcon, BowlIcon } from '@/components/icons'
import { LISTING_STATUS_LABEL, type Listing, type Profile } from '@/lib/types'
import { releaseExpiredListings } from '@/lib/actions/listings'
import { VerifyButtons, ModerateButton, ResolveReportButton } from './admin-actions'
import { ExportDataButton } from './export-button'

export default async function AdminDashboard() {
  const { profile } = await requireRole(['admin'])
  const supabase = await createClient()

  await releaseExpiredListings()

  const [{ data: profiles }, { data: listings }, { data: reports }, { count: totalListings }, { count: pickedUpCount }] =
    await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase
        .from('listings')
        .select('*, profiles:donor_id(org_name, full_name)')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('reports')
        .select('*, listings(title)')
        .eq('resolved', false)
        .order('created_at', { ascending: false }),
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'picked_up'),
    ])

  const pendingOrgs = ((profiles ?? []) as Profile[]).filter(
    (p) => p.verification_status === 'pending' || p.verification_status === 'unverified'
  )
  const recentListings = (listings ?? []) as Listing[]
  const openReports = reports ?? []

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <AppShell profile={profile} title="Dashboard" subtitle={today}>
      <div className="hero-banner">
        <span className="hero-pill">Welcome back, {profile.full_name ?? 'Admin'}</span>
        <h2 className="hero-headline">Every meal saved is a meal shared.</h2>
        <p className="hero-copy">
          Your platform is ready. Add the first food listing or invite donors to get surplus food moving to
          people who need it.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard/donor/new" className="btn btn-hero-primary">
            <PlusIcon size={16} />
            Add a listing
          </Link>
          <Link href="/map" className="btn btn-hero-outline">
            Open live map
          </Link>
        </div>
        <div className="hero-art">
          <BowlIcon size={44} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<BagIcon />}
          tone="primary"
          label="Total listings"
          value={totalListings ?? 0}
          description="Food posts from donors"
        />
        <StatCard
          icon={<TruckIcon />}
          tone="accent"
          label="Picked up"
          value={pickedUpCount ?? 0}
          description="Meals rescued from waste"
        />
        <StatCard
          icon={<UsersIcon />}
          tone="info"
          label="Registered users"
          value={(profiles ?? []).length}
          description="Donors, NGOs, volunteers"
        />
      </div>

      <div className="mt-6 grid grid-cols-[1fr_22rem] gap-4 items-start">
        <div className="panel" id="recent-listings">
          <div className="panel-header">
            <h2>Recent listings</h2>
            <Link href="/map" className="btn-link text-sm">
              View all →
            </Link>
          </div>

          {recentListings.length === 0 ? (
            <div className="empty-dashed">
              <div className="empty-block">
                <span className="icon-badge icon-badge-primary" style={{ height: '3.2rem', width: '3.2rem' }}>
                  <BagIcon size={24} />
                </span>
                <strong>No food listed yet</strong>
                <p>When donors share surplus food, it appears here with its pickup status.</p>
                <Link href="/dashboard/donor/new" className="btn btn-primary mt-2">
                  Create the first listing
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Food item</th>
                    <th>Donor</th>
                    <th>Posted</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map((l) => (
                    <tr key={l.id}>
                      <td className="font-medium">{l.title}</td>
                      <td className="text-[color:var(--muted)]">
                        {l.profiles?.org_name ?? l.profiles?.full_name ?? 'Donor'}
                      </td>
                      <td className="text-[color:var(--muted)]">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
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
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="panel" id="verification">
            <div className="panel-header">
              <h2>Organization verification</h2>
              <span className={`pill-count ${pendingOrgs.length === 0 ? 'pill-count-zero' : ''}`}>
                {pendingOrgs.length} pending
              </span>
            </div>

            {pendingOrgs.length === 0 ? (
              <div className="empty-inline">
                <span className="icon-badge icon-badge-primary">
                  <ShieldCheckIcon />
                </span>
                <div>
                  <strong>All caught up</strong>
                  <p>New NGO sign-ups will wait here for approval.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingOrgs.map((p) => (
                  <div key={p.id} className="list-row">
                    <div>
                      <p className="font-medium">{p.org_name ?? p.full_name ?? 'Unnamed'}</p>
                      <p className="text-sm capitalize text-[color:var(--muted)]">
                        {p.role} · {p.verification_status}
                      </p>
                    </div>
                    <VerifyButtons profileId={p.id} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel" id="reports">
            <div className="panel-header">
              <h2>Open reports</h2>
              <span className={`pill-count ${openReports.length === 0 ? 'pill-count-zero' : ''}`}>
                {openReports.length} open
              </span>
            </div>

            {openReports.length === 0 ? (
              <div className="empty-inline">
                <span className="icon-badge icon-badge-primary">
                  <FlagIcon />
                </span>
                <div>
                  <strong>No issues reported</strong>
                  <p>User reports about listings show up here.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {openReports.map((r) => (
                  <div key={r.id} className="list-row">
                    <div>
                      <p className="font-medium">{r.reason}</p>
                      <p className="text-sm text-[color:var(--muted)]">Listing: {r.listings?.title ?? 'deleted'}</p>
                    </div>
                    <ResolveReportButton reportId={r.id} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Quick actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/signup" className="btn btn-secondary">
                Invite an NGO
              </Link>
              <ExportDataButton listings={recentListings} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  tone,
  label,
  value,
  description,
}: {
  icon: ReactNode
  tone: 'primary' | 'accent' | 'info'
  label: string
  value: number
  description: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span>{label}</span>
        <span className={`icon-badge icon-badge-${tone}`}>{icon}</span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{description}</p>
    </div>
  )
}
