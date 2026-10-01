'use server'

import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sendPushToUsers } from '@/lib/push'

export async function sendMessage(listingId: string, body: string) {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  const text = body.trim()
  if (!text) throw new Error('Message cannot be empty')
  if (text.length > 1000) throw new Error('Message is too long')

  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, donor_id, claimed_by')
    .eq('id', listingId)
    .single()

  if (!listing || (session.userId !== listing.donor_id && session.userId !== listing.claimed_by)) {
    throw new Error('You are not part of this conversation')
  }

  const { error } = await supabase.from('messages').insert({
    listing_id: listingId,
    sender_id: session.userId,
    body: text,
  })
  if (error) throw new Error(error.message)

  const otherUserId = session.userId === listing.donor_id ? listing.claimed_by : listing.donor_id
  if (otherUserId) {
    try {
      await sendPushToUsers([otherUserId], {
        title: `New message about "${listing.title}"`,
        body: text,
        url: `/listings/${listingId}`,
      })
    } catch {
      // Notifications are best-effort.
    }
  }
}
