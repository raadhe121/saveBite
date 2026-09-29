'use client'

import { useTransition } from 'react'
import { setVerification, banUser, unbanUser } from '@/lib/actions/admin'
import type { Profile } from '@/lib/types'

export function UserRow({ user }: { user: Profile }) {
  const [isPending, startTransition] = useTransition()
  const banned = user.banned_at != null

  return (
    <tr>
      <td className="font-medium">{user.org_name ?? user.full_name ?? 'Unnamed'}</td>
      <td className="capitalize text-[color:var(--muted)]">{user.role}</td>
      <td>
        <span
          className={`badge ${
            user.verification_status === 'verified'
              ? 'badge-primary'
              : user.verification_status === 'rejected'
                ? 'badge-danger'
                : 'badge-muted'
          }`}
        >
          {user.verification_status}
        </span>
      </td>
      <td>
        <span className={`badge ${banned ? 'badge-danger' : 'badge-primary'}`}>
          {banned ? 'Banned' : 'Active'}
        </span>
      </td>
      <td>
        <div className="flex gap-2">
          {user.role !== 'admin' && user.verification_status !== 'verified' && (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => setVerification(user.id, 'verified'))}
              className="btn-link text-sm"
            >
              Verify
            </button>
          )}
          {user.role !== 'admin' &&
            (banned ? (
              <button
                disabled={isPending}
                onClick={() => startTransition(() => unbanUser(user.id))}
                className="btn-link text-sm"
              >
                Unban
              </button>
            ) : (
              <button
                disabled={isPending}
                onClick={() => startTransition(() => banUser(user.id))}
                className="btn-link text-sm"
                style={{ color: 'var(--danger)' }}
              >
                Ban
              </button>
            ))}
        </div>
      </td>
    </tr>
  )
}
