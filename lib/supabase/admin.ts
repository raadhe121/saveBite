import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Bypasses RLS with the service role key. Server-only, and only for the
// narrow cases that legitimately need to read/write across users — e.g.
// fanning out push notifications to receivers who aren't the current
// request's authenticated user. Never expose this client or its key to the
// browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase service role key is not configured on this server')
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
