import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/nav-bar'
import type { Listing } from '@/lib/types'
import { EditListingForm } from './edit-listing-form'

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId, profile } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('donor_id', userId)
    .single()

  if (!listing) notFound()
  if (listing.status !== 'available') notFound()

  return (
    <div className="page-shell">
      <NavBar profile={profile} />
      <main className="page-main">
        <h1 className="page-title">Edit listing</h1>
        <p className="page-subtitle">Only listings that haven't been claimed yet can be edited.</p>
        <EditListingForm listing={listing as Listing} />
      </main>
    </div>
  )
}
