'use client'

import { useTransition } from 'react'
import { banUser, unbanUser } from '@/lib/actions/admin'

export function PersonBanButton({ userId, bannedAt }: { userId: string; bannedAt: string | null }) {
  const [isPending, startTransition] = useTransition()
  const banned = bannedAt != null

  return banned ? (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => unbanUser(userId))}
      className="btn btn-secondary btn-sm"
    >
      Unban
    </button>
  ) : (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => banUser(userId))}
      className="btn btn-danger btn-sm"
    >
      Ban
    </button>
  )
}
