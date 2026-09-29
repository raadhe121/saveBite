'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CameraSmallIcon } from '@/components/icons'
import type { Profile } from '@/lib/types'
import { ProfileForm } from './profile-form'

type TabKey = 'personal' | 'claims' | 'notifications' | 'security'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'personal', label: 'Personal details' },
  { key: 'claims', label: 'My claims' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Account & security' },
]

type ClaimRow = {
  id: string
  status: string
  pickup_code: string | null
  listing_id: string
  listings: { title: string } | { title: string }[] | null
}

export function ProfileShell({
  profile,
  email,
  claims,
}: {
  profile: Profile
  email: string
  claims: ClaimRow[]
}) {
  const [tab, setTab] = useState<TabKey>('personal')

  const fields = [profile.full_name, profile.phone, profile.address, profile.lat, profile.photo_url]
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100)
  const showClaimsTab = profile.role === 'receiver' || profile.role === 'volunteer'
  const visibleTabs = TABS.filter((t) => t.key !== 'claims' || showClaimsTab)

  return (
    <>
      <div className="hero-banner" style={{ marginBottom: 0, borderRadius: 0, paddingBottom: '4.5rem' }}>
        <h1 className="hero-headline" style={{ fontSize: '2.1rem' }}>
          Your profile
        </h1>
        <p className="hero-copy">Keep this up to date so donors know who's picking up.</p>
      </div>

      <div className="page-main page-main--wide hero-overlap">
        <div className="grid grid-cols-[18rem_1fr] gap-5 items-start">
          <div>
            <div className="profile-summary-card">
              <div className="avatar-lg-wrap">
                <div className="avatar-lg">
                  {profile.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.photo_url} alt="" />
                  ) : (
                    (profile.full_name ?? profile.org_name ?? '?').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="avatar-edit-btn">
                  <CameraSmallIcon />
                </span>
              </div>
              <p className="profile-summary-name">{profile.full_name ?? 'Your name'}</p>
              <span className="badge badge-info capitalize" style={{ marginTop: '0.4rem' }}>
                {profile.role}
              </span>

              <div className="mt-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>Profile complete</span>
                  <strong style={{ color: 'var(--primary)' }}>{completeness}%</strong>
                </div>
                <div className="progress-track mt-2">
                  <div className="progress-fill" style={{ width: `${completeness}%` }} />
                </div>
                {completeness < 100 && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                    Add your phone and address so {profile.role === 'donor' ? 'receivers' : 'donors'} can
                    reach you.
                  </p>
                )}
              </div>
            </div>

            <div className="side-tabs">
              {visibleTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`side-tab ${tab === t.key ? 'side-tab-active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            {tab === 'personal' && <ProfileForm profile={profile} />}

            {tab === 'claims' && (
              <div className="panel">
                <div className="panel-header">
                  <h2>My claims</h2>
                </div>
                {claims.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    You haven't claimed anything yet.{' '}
                    <Link href="/dashboard/receiver" className="btn-link">
                      Find food near you
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {claims.map((c) => {
                      const listing = Array.isArray(c.listings) ? c.listings[0] : c.listings
                      return (
                        <div key={c.id} className="list-row">
                          <div>
                            <p className="font-medium">{listing?.title ?? 'Listing'}</p>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>
                              {c.status === 'completed' ? 'Picked up' : 'Pending pickup'}
                            </p>
                          </div>
                          <Link href={`/claims/${c.listing_id}`} className="btn-link text-sm">
                            View
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div className="panel">
                <div className="panel-header">
                  <h2>Notifications</h2>
                </div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  You're all caught up. Email notifications aren't set up yet — check your dashboard for
                  the latest activity.
                </p>
              </div>
            )}

            {tab === 'security' && (
              <div className="panel">
                <div className="panel-header">
                  <h2>Account & security</h2>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="field-label">Email</span>
                    <p className="font-medium">{email || '—'}</p>
                  </div>
                  <Link href="/forgot-password" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                    Change password
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
