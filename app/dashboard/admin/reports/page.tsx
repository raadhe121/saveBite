import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { ResolveReportButton } from '../admin-actions'

export default async function AdminReportsPage() {
  const { profile } = await requireRole(['admin'])
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('reports')
    .select('*, listings(title, donor_id)')
    .order('resolved', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)

  const items = reports ?? []

  return (
    <AppShell profile={profile} title="Reports" subtitle={`${items.filter((r) => !r.resolved).length} open`}>
      <div className="panel">
        {items.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No reports yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((r) => (
              <div key={r.id} className="list-row">
                <div>
                  <p className="font-medium">{r.reason}</p>
                  <p className="text-sm text-[color:var(--muted)]">
                    Listing: {r.listings?.title ?? 'deleted'} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                {r.resolved ? (
                  <span className="badge badge-muted">Resolved</span>
                ) : (
                  <ResolveReportButton reportId={r.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
