import Link from 'next/link'
import { getSessionProfile } from '@/lib/session'
import { NavBar } from '@/components/nav-bar'
import { AlertIcon, CheckSquareIcon, ShieldCheckIcon } from '@/components/icons'

const GUIDELINES = [
  'Only post food that is still safe to eat and hasn’t passed any use-by date.',
  "Keep hot food hot and cold food cold until it's picked up.",
  'List known allergens using the dietary tags when creating a listing.',
  "Set a realistic pickup window and expiry — don't leave food out indefinitely.",
  "Package food so it's safe to transport (sealed containers, bags, etc).",
  'If something changes (food spoils, plans change), cancel the listing rather than leaving it up.',
]

export default async function GuidelinesPage() {
  const session = await getSessionProfile()

  return (
    <div className="page-shell">
      {session ? (
        <NavBar profile={session.profile} />
      ) : (
        <header className="page-header" style={{ position: 'static' }}>
          <Link href="/" className="brand">
            <span className="brand-mark">🍃</span>
            SaveBite
          </Link>
          <Link href="/" className="btn btn-secondary btn-sm">
            Back home
          </Link>
        </header>
      )}

      <div className="hero-banner" style={{ marginBottom: 0, borderRadius: 0, paddingBottom: '4.5rem' }}>
        <span className="hero-pill">Please read before posting or claiming</span>
        <h1 className="hero-headline" style={{ fontSize: '2.3rem' }}>
          Food safety & donor guidelines
        </h1>
        <p className="hero-copy">Simple rules that keep everyone on SaveBite safe and well fed.</p>
        <div className="hero-art-square">
          <ShieldCheckIcon size={40} />
        </div>
      </div>

      <main className="page-main page-main--wide hero-overlap">
        <div className="grid grid-cols-2 gap-5 items-start">
          <div className="disclaimer-card">
            <h2>
              <AlertIcon size={20} />
              Food safety disclaimer
            </h2>
            <p>
              SaveBite is a platform that connects donors with surplus food to receivers — we do not
              inspect, prepare, handle, or transport any food ourselves, and we make no guarantee about the
              safety or quality of food listed here.
            </p>
            <p>
              Donors are responsible for accurately describing what they're giving away, including
              ingredients and potential allergens. Receivers are responsible for using their own judgment
              before consuming or distributing any food claimed through the platform.
            </p>
            <div className="disclaimer-callout">When in doubt, don't eat it.</div>
          </div>

          <div className="guidelines-card">
            <h2>
              <CheckSquareIcon size={20} />
              Donor guidelines
            </h2>
            <div className="guideline-grid">
              {GUIDELINES.map((g, i) => (
                <div key={i} className="guideline-item">
                  <span className="guideline-number">{i + 1}</span>
                  <p>{g}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="section-title">Legal protection for donors</h2>
        <div className="card card-pad">
          <p className="text-sm text-[color:var(--muted)]">
            In the United States, the{' '}
            <strong>Federal Bill Emerson Good Samaritan Food Donation Act (42 U.S.C. § 1791)</strong>{' '}
            protects individuals, businesses, and nonprofit organizations from civil and criminal liability
            when they donate food in good faith to a nonprofit for distribution to people in need — except
            in cases of gross negligence or intentional misconduct. Many states have their own similar or
            broader protections. SaveBite encourages every donor to donate in good faith and in line with
            these guidelines, but you should independently verify how this applies to your situation; this
            is not legal advice.
          </p>
        </div>

        <h2 className="section-title">Reporting a problem</h2>
        <div className="card card-pad">
          <p className="text-sm text-[color:var(--muted)]">
            Every listing has a <strong>Report</strong> button — use it if food looks unsafe, a donor or
            receiver doesn't show up, or you suspect a fake listing or account. Our admin team reviews every
            report.
          </p>
        </div>
      </main>
    </div>
  )
}
