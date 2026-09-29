'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/session'
import type { VerificationStatus } from '@/lib/types'

export async function setVerification(profileId: string, status: VerificationStatus) {
  await requireRole(['admin'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ verification_status: status })
    .eq('id', profileId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/users')
}

export async function moderateListing(listingId: string) {
  await requireRole(['admin'])
  const supabase = await createClient()

  const { error } = await supabase.from('listings').update({ status: 'cancelled' }).eq('id', listingId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/listings')
  revalidatePath('/map')
}

export async function resolveReport(reportId: string) {
  await requireRole(['admin'])
  const supabase = await createClient()

  const { error } = await supabase.from('reports').update({ resolved: true }).eq('id', reportId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/reports')
}

export async function banUser(profileId: string) {
  await requireRole(['admin'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ banned_at: new Date().toISOString() })
    .eq('id', profileId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin')
}

export async function unbanUser(profileId: string) {
  await requireRole(['admin'])
  const supabase = await createClient()

  const { error } = await supabase.from('profiles').update({ banned_at: null }).eq('id', profileId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin')
}
