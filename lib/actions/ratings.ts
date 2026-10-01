'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function submitRating(listingId: string, stars: number, comment: string) {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new Error('Rating must be between 1 and 5 stars')
  }

  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, status, donor_id, claimed_by')
    .eq('id', listingId)
    .single()

  if (!listing || listing.status !== 'picked_up') {
    throw new Error('You can only rate a completed pickup')
  }

  let rateeId: string | null = null
  if (session.userId === listing.donor_id) rateeId = listing.claimed_by
  else if (session.userId === listing.claimed_by) rateeId = listing.donor_id

  if (!rateeId) throw new Error('You were not part of this pickup')

  const { error } = await supabase.from('ratings').insert({
    listing_id: listingId,
    rater_id: session.userId,
    ratee_id: rateeId,
    stars,
    comment: comment.trim() || null,
  })

  if (error) {
    if (error.code === '23505') throw new Error("You've already rated this pickup")
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/donor')
  revalidatePath('/profile')
  revalidatePath(`/listings/${listingId}`)
}
