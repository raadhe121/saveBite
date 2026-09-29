'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  const supabase = await createClient()

  const lat = formData.get('lat') ? Number(formData.get('lat')) : null
  const lng = formData.get('lng') ? Number(formData.get('lng')) : null

  const update: Record<string, unknown> = {
    full_name: String(formData.get('full_name') ?? '') || null,
    org_name: String(formData.get('org_name') ?? '') || null,
    phone: String(formData.get('phone') ?? '') || null,
    address: String(formData.get('address') ?? '') || null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  }

  if (session.profile.role === 'donor') {
    update.business_type = String(formData.get('business_type') ?? '') || null
    update.operating_hours = String(formData.get('operating_hours') ?? '') || null
  }

  const photo = formData.get('photo') as File | null
  if (photo && photo.size > 0) {
    const path = `${session.userId}/avatar-${Date.now()}.${photo.name.split('.').pop() ?? 'jpg'}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, photo, {
      upsert: true,
    })
    if (uploadError) throw new Error(uploadError.message)

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    update.photo_url = data.publicUrl
  }

  const { error } = await supabase.from('profiles').update(update).eq('id', session.userId)
  if (error) throw new Error(error.message)

  revalidatePath('/profile')
  revalidatePath('/dashboard')
}
