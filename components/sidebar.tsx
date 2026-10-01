'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import type { Profile } from '@/lib/types'
import {
  GridIcon,
  MapPinIcon,
  BagIcon,
  ShieldCheckIcon,
  FlagIcon,
  UsersIcon,
  LogOutIcon,
  ChartIcon,
  StarIcon,
} from '@/components/icons'
import { InviteLinkButton } from '@/components/invite-link-button'

const NAV_ITEMS = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: GridIcon },
  { href: '/map', label: 'Live map', icon: MapPinIcon },
  { href: '/dashboard/admin/listings', label: 'Listings', icon: BagIcon },
  { href: '/dashboard/admin#verification', label: 'Verification', icon: ShieldCheckIcon, anchor: true },
  { href: '/dashboard/admin/reports', label: 'Reports', icon: FlagIcon },
  { href: '/dashboard/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/dashboard/admin/ratings', label: 'Ratings', icon: StarIcon },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: ChartIcon },
]

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand">
        <span className="brand-mark">🍃</span>
        SaveBite
      </Link>

      <p className="sidebar-menu-label">Menu</p>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          // Same-page anchors (e.g. #verification) can't be distinguished
          // from the page itself via pathname, so never highlight them —
          // otherwise they'd light up together with "Dashboard".
          const isActive = !item.anchor && pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-spacer" />

      <div className="promo-card">
        <h3>Spread the word</h3>
        <p>Invite restaurants and NGOs near you to start rescuing food.</p>
        <InviteLinkButton />
      </div>

      <div className="sidebar-profile">
        <span className="avatar">{(profile.full_name ?? profile.org_name ?? '?').charAt(0).toUpperCase()}</span>
        <div className="flex-1">
          <p className="sidebar-profile-name">{profile.full_name ?? 'Admin'}</p>
          <p className="sidebar-profile-role capitalize">
            {profile.role === 'admin' ? 'Super admin' : profile.role}
          </p>
        </div>
        <form action={signOut}>
          <button type="submit" className="icon-btn" aria-label="Log out">
            <LogOutIcon size={16} />
          </button>
        </form>
      </div>
    </aside>
  )
}
