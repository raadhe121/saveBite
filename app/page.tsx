import type { ReactNode } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { toPounds } from '@/lib/impact'
import { PlatformCounters } from '@/components/platform-counters'
import { BagIcon, CheckIcon, TruckIcon } from '@/components/icons'

export default async function Home() {
  const supabase = await createClient()

  const [{ data: rescued }, { data: donorRows }] = await Promise.all([
    supabase.from('listings').select('quantity_total, quantity_claimed, unit').eq('status', 'picked_up'),
    supabase.from('listings').select('donor_id'),
  ])

  const totalPounds = (rescued ?? []).reduce(
    (sum, r) => sum + toPounds(r.quantity_claimed ?? r.quantity_total, r.unit),
    0
  )
  const activeDonors = new Set((donorRows ?? []).map((r) => r.donor_id)).size

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 pt-20 pb-14 text-center">
        <span className="brand-mark text-2xl">🍃</span>
        <h1 className="text-4xl font-bold text-[color:var(--primary)] sm:text-5xl">SaveBite</h1>
        <p className="max-w-2xl text-lg text-[color:var(--muted)]">
          Restaurants, bakeries, grocery stores and cafeterias throw away edible food every day, while
          families nearby go hungry. SaveBite connects surplus food to the people who need it —
          in real time, before it expires.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/signup?role=donor" className="btn btn-primary">
            I have food to share
          </Link>
          <Link href="/signup?role=receiver" className="btn btn-secondary">
            I need food
          </Link>
        </div>
        <Link href="/map" className="btn-link text-sm">
          Or just view the live map →
        </Link>
      </section>

      {/* Live impact counters */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
          Live impact
        </h2>
        <PlatformCounters initialPounds={totalPounds} initialDonors={activeDonors} />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">How it works</h2>
        <div className="grid grid-cols-3 gap-6">
          <HowStep
            step={1}
            icon={<BagIcon size={22} />}
            title="Post"
            description="A donor lists surplus food with a photo, quantity, and pickup window."
          />
          <HowStep
            step={2}
            icon={<CheckIcon size={22} />}
            title="Claim"
            description="A nearby food bank, shelter, or individual claims it in one tap — locked instantly."
          />
          <HowStep
            step={3}
            icon={<TruckIcon size={22} />}
            title="Pick up"
            description="The receiver shows their pickup code, the donor confirms, and the food is rescued."
          />
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-[color:var(--muted)]" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-center gap-4">
          <Link href="/login" className="btn-link">
            Already have an account? Log in
          </Link>
          <Link href="/guidelines" className="btn-link">
            Food safety & donor guidelines
          </Link>
        </div>
      </footer>
    </div>
  )
}

function HowStep({
  step,
  icon,
  title,
  description,
}: {
  step: number
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="card card-pad text-center">
      <span className="icon-badge icon-badge-primary" style={{ margin: '0 auto 0.9rem' }}>
        {icon}
      </span>
      <p className="text-xs font-semibold text-[color:var(--muted)]">Step {step}</p>
      <h3 className="mt-1 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-[color:var(--muted)]">{description}</p>
    </div>
  )
}
