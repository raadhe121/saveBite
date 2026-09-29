import type { ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'
import { SearchIcon, BellIcon } from '@/components/icons'
import type { Profile } from '@/lib/types'

export function AppShell({
  profile,
  title,
  subtitle,
  children,
}: {
  profile: Profile
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="app-layout">
      <Sidebar profile={profile} />
      <div className="app-main">
        <div className="app-topbar">
          <div>
            <h1 className="hero-title" style={{ marginTop: 0 }}>
              {title}
            </h1>
            {subtitle && <p className="page-subtitle" style={{ marginBottom: 0 }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="search-bar">
              <SearchIcon size={16} />
              <input placeholder="Search listings, users…" />
            </div>
            <button type="button" className="icon-btn" aria-label="Notifications">
              <BellIcon size={18} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
