import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import type { Profile } from '@/lib/types'
import { UserRow } from './user-row'

export default async function AdminUsersPage() {
  const { profile } = await requireRole(['admin'])
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const users = (profiles ?? []) as Profile[]

  return (
    <AppShell profile={profile} title="Users" subtitle={`${users.length} registered`}>
      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name / org</th>
              <th>Role</th>
              <th>Verification</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
