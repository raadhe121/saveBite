'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'

export async function submitReport(listingId: string, reason: string) {
  const session = await getSessionProfile()
  if (!session) throw new Error('You need to be logged in to report something')
  if (!reason.trim()) throw new Error('Please describe the issue')

  const supabase = await createClient()

  const { error } = await supabase.from('reports').insert({
    listing_id: listingId,
    reported_by: session.userId,
    reason: reason.trim(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/reports')
}
