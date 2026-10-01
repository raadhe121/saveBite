'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import type { Profile } from '@/lib/types'

export function NavBar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const canPost = profile.role === 'donor' || profile.role === 'admin'
  const canFind = profile.role === 'receiver' || profile.role === 'volunteer'

  return (
    <header className="page-header">
      <Link href="/dashboard" className="brand">
        <span className="brand-mark">🍃</span>
        SaveBite
      </Link>
      <nav className="flex items-center gap-5 text-sm">
        {canPost && (
          <>
            <Link
              href="/dashboard/donor"
              className={pathname === '/dashboard/donor' ? 'btn btn-primary btn-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--foreground)]'}
            >
              My listings
            </Link>
            <Link
              href="/dashboard/donor/new"
              className={pathname === '/dashboard/donor/new' ? 'btn btn-primary btn-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--foreground)]'}
            >
              Post food
            </Link>
          </>
        )}
        {canFind && (
          <>
            <Link
              href="/dashboard/receiver"
              className={pathname === '/dashboard/receiver' ? 'btn btn-primary btn-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--foreground)]'}
            >
              Find food
            </Link>
            <Link
              href="/profile?tab=claims"
              className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            >
              My claims
            </Link>
          </>
        )}
        <Link href="/map" className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]">
          Live map
        </Link>
        {(profile.role === 'donor' || profile.role === 'receiver') && (
          <Link href="/impact" className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]">
            Impact
          </Link>
        )}
        <Link href="/profile" className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]">
          Profile
        </Link>
        <Link
          href="/guidelines"
          className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          title="Food safety & donor guidelines"
        >
          Safety
        </Link>
        {profile.role === 'admin' ? (
          <Link href="/dashboard/admin" className="badge badge-primary">
            Admin
          </Link>
        ) : (
          <span className={`badge ${profile.role === 'receiver' ? 'badge-info' : 'badge-muted'} capitalize`}>
            {profile.role}
          </span>
        )}
        <span className="avatar" aria-hidden>
          {(profile.full_name ?? profile.org_name ?? '?').charAt(0).toUpperCase()}
        </span>
        <form action={signOut}>
          <button type="submit" className="btn btn-secondary btn-sm">
            Log out
          </button>
        </form>
      </nav>
    </header>
  )
}
