'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function subscribePush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  const supabase = await createClient()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: session.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw new Error(error.message)
}

export async function unsubscribePush(endpoint: string) {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  const supabase = await createClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', session.userId)
}

export async function updateNotificationPrefs(formData: FormData) {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  const supabase = await createClient()
  const radius = Number(formData.get('notify_radius_miles'))

  const { error } = await supabase
    .from('profiles')
    .update({
      notify_radius_miles: Number.isFinite(radius) && radius > 0 ? radius : 10,
      notify_new_listings: formData.get('notify_new_listings') === 'on',
      notify_claims: formData.get('notify_claims') === 'on',
    })
    .eq('id', session.userId)

  if (error) throw new Error(error.message)

  revalidatePath('/profile')
}
