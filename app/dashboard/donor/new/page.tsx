import { requireRole } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/nav-bar'
import { AddFoodForm } from './add-food-form'

export default async function AddFoodPage() {
  const { userId, profile } = await requireRole(['donor', 'admin'])
  const supabase = await createClient()

  const [{ count: posted }, { count: pickedUp }] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('donor_id', userId),
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('donor_id', userId)
      .eq('status', 'picked_up'),
  ])

  return (
    <div className="page-shell">
      <NavBar profile={profile} />
      <AddFoodForm
        postedCount={posted ?? 0}
        pickedUpCount={pickedUp ?? 0}
        defaultAddress={profile.address}
        defaultLat={profile.lat}
        defaultLng={profile.lng}
      />
    </div>
  )
}
