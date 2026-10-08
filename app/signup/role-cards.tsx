'use client'

import { useState } from 'react'
import { StoreIcon, HeartIcon, CheckIcon } from '@/components/icons'

const roles = [
  {
    value: 'donor',
    title: "I'm a donor",
    desc: 'Restaurant, bakery, store, cafeteria',
    Icon: StoreIcon,
    iconBg: 'var(--accent-soft)',
    iconColor: 'var(--accent)',
  },
  {
    value: 'receiver',
    title: "I'm a receiver",
    desc: 'NGO, shelter, food bank, or individual',
    Icon: HeartIcon,
    iconBg: '#e3eafd',
    iconColor: '#3b5fe0',
  },
] as const

export function RoleCards({ defaultRole }: { defaultRole: string }) {
  const [role, setRole] = useState(defaultRole)

  return (
    <div className="role-card-group" role="radiogroup" aria-label="Account type">
      <input type="hidden" name="role" value={role} />
      {roles.map(({ value, title, desc, Icon, iconBg, iconColor }) => {
        const selected = role === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setRole(value)}
            className={`role-card${selected ? ' is-selected' : ''}`}
          >
            <span
              className="role-card-icon"
              style={{ background: selected ? undefined : iconBg, color: iconColor }}
            >
              <Icon size={22} />
            </span>
            {selected && (
              <span className="role-card-check">
                <CheckIcon size={13} />
              </span>
            )}
            <p className="role-card-title">{title}</p>
            <p className="role-card-desc">{desc}</p>
          </button>
        )
      })}
    </div>
  )
}
