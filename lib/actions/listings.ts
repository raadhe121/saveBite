'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/session'
import type { DietaryTag, FoodCategory } from '@/lib/types'
import { parseQuantityNumber } from '@/lib/distance'
import type { SupabaseClient } from '@supabase/supabase-js'

async function buildListingFields(
  formData: FormData,
  userId: string,
  supabase: SupabaseClient
) {
  const lat = Number(formData.get('lat'))
  const lng = Number(formData.get('lng'))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('A valid pickup location (lat/lng) is required')
  }

  const dietaryTags = formData.getAll('dietary_tags').map(String) as DietaryTag[]

  let photoUrl: string | null = String(formData.get('existing_photo_url') ?? '') || null
  const photo = formData.get('photo') as File | null
  if (photo && photo.size > 0) {
    const path = `${userId}/${Date.now()}-${photo.name.split('/').pop()}`
    const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, photo)
    if (uploadError) throw new Error(uploadError.message)
    photoUrl = supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl
  }

  const quantity = String(formData.get('quantity') ?? '')

  return {
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? '') || null,
    category: String(formData.get('category') ?? 'other') as FoodCategory,
    quantity,
    quantity_total: parseQuantityNumber(quantity),
    unit: String(formData.get('unit') ?? 'items'),
    dietary_tags: dietaryTags,
    photo_url: photoUrl,
    address: String(formData.get('address') ?? ''),
    lat,
    lng,
    pickup_start: String(formData.get('pickup_start') ?? '') || null,
    pickup_end: String(formData.get('pickup_end') ?? '') || null,
    special_instructions: String(formData.get('special_instructions') ?? '') || null,
    expires_at: String(formData.get('expires_at') ?? ''),
  }
}

export async function createListing(formData: FormData) {
  const { userId } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const fields = await buildListingFields(formData, userId, supabase)

  const { error } = await supabase.from('listings').insert({ donor_id: userId, ...fields })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/donor')
  revalidatePath('/map')
}

export async function updateListing(listingId: string, formData: FormData) {
  const { userId } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const fields = await buildListingFields(formData, userId, supabase)

  const { error } = await supabase
    .from('listings')
    .update(fields)
    .eq('id', listingId)
    .eq('donor_id', userId)
    .eq('status', 'available')

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/donor')
  revalidatePath('/map')
}

export async function deleteListing(listingId: string) {
  const { userId } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('donor_id', userId)
    .eq('status', 'available')

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/donor')
  revalidatePath('/map')
}

export async function cancelListing(listingId: string) {
  const { userId } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('listings')
    .update({ status: 'cancelled' })
    .eq('id', listingId)
    .eq('donor_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/donor')
  revalidatePath('/map')
}

// Donor types in the code the receiver was shown at claim time; only marks
// the listing Completed if it matches the pending claim's pickup_code.
export async function confirmPickup(listingId: string, code: string) {
  const { userId } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const { data: claim } = await supabase
    .from('claims')
    .select('id, pickup_code')
    .eq('listing_id', listingId)
    .eq('status', 'pending')
    .single()

  if (!claim || !claim.pickup_code || claim.pickup_code.toUpperCase() !== code.trim().toUpperCase()) {
    throw new Error('Pickup code does not match')
  }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'picked_up', picked_up_at: new Date().toISOString() })
    .eq('id', listingId)
    .eq('donor_id', userId)

  if (error) throw new Error(error.message)

  await supabase
    .from('claims')
    .update({ status: 'completed', picked_up_at: new Date().toISOString() })
    .eq('id', claim.id)

  revalidatePath('/dashboard/donor')
}

// The receiver never showed up: reopen the listing so someone else can claim it.
export async function unclaimListing(listingId: string) {
  const { userId } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const { error: listingError } = await supabase
    .from('listings')
    .update({ status: 'available', claimed_by: null, claimed_at: null, quantity_claimed: null })
    .eq('id', listingId)
    .eq('donor_id', userId)
    .eq('status', 'claimed')

  if (listingError) throw new Error(listingError.message)

  await supabase.from('claims').delete().eq('listing_id', listingId)

  revalidatePath('/dashboard/donor')
  revalidatePath('/map')
}

// One-tap repost for daily surplus: clone a past listing as a fresh available
// one, defaulting the new expiry to 24h from now since the original picker
// value no longer applies.
export async function repostListing(listingId: string) {
  const { userId } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const { data: original, error: fetchError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('donor_id', userId)
    .single()

  if (fetchError || !original) throw new Error(fetchError?.message ?? 'Listing not found')

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('listings').insert({
    donor_id: userId,
    title: original.title,
    description: original.description,
    category: original.category,
    quantity: original.quantity,
    quantity_total: original.quantity_total,
    unit: original.unit,
    dietary_tags: original.dietary_tags,
    photo_url: original.photo_url,
    address: original.address,
    lat: original.lat,
    lng: original.lng,
    special_instructions: original.special_instructions,
    expires_at: expiresAt,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/donor')
  revalidatePath('/map')
}

// quantity is only meaningful when the listing's quantity could be parsed to
// a number (quantity_total set); omit it to claim the whole listing.
export async function claimListing(listingId: string, quantity?: number) {
  await requireRole(['receiver', 'volunteer', 'admin'])
  const supabase = await createClient()

  const { error } = await supabase.rpc('claim_listing', {
    p_listing_id: listingId,
    p_quantity: quantity ?? null,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/receiver')
  revalidatePath('/map')
}

// The receiver themself no longer wants what they claimed.
export async function cancelMyClaim(listingId: string) {
  await requireRole(['receiver', 'volunteer', 'admin'])
  const supabase = await createClient()

  const { error } = await supabase.rpc('cancel_my_claim', { p_listing_id: listingId })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/receiver')
  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/map')
}

// Lazy auto-release: called opportunistically from donor/admin pages (RLS
// scopes this to listings the caller owns or, for admins, all listings) so
// expired listings flip status even without a background job. See
// supabase/migrations/004_claim_and_pickup_flow.sql for the optional
// pg_cron-based sweep that covers every listing independent of page visits.
export async function releaseExpiredListings() {
  const supabase = await createClient()
  await supabase
    .from('listings')
    .update({ status: 'expired' })
    .in('status', ['available', 'claimed'])
    .lt('expires_at', new Date().toISOString())
}
