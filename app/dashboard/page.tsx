import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'

export default async function DashboardRouter() {
  const session = await getSessionProfile()
  if (!session) redirect('/login')

  redirect(`/dashboard/${session.profile.role === 'volunteer' ? 'receiver' : session.profile.role}`)
}
