import { LeafIcon, BowlIcon } from '@/components/icons'

const features = [
  'Share leftovers before they go to waste',
  'See available food live on a map',
  'Claim and pick up with a simple code',
]

export function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-blob auth-aside-blob-1" />
      <div className="auth-aside-blob auth-aside-blob-2" />

      <div className="auth-brand-chip">
        <span className="auth-brand-chip-mark">
          <LeafIcon size={20} />
        </span>
        SaveBite
      </div>

      <div>
        <div className="auth-aside-art">
          <BowlIcon size={56} />
        </div>
        <h2 className="auth-aside-headline">
          Good food deserves
          <br />
          a second chance.
        </h2>
        <p className="auth-aside-subtext">Post surplus food or find food near you, in minutes.</p>
      </div>

      <ul className="auth-aside-features">
        {features.map((feature) => (
          <li key={feature}>
            <span className="auth-aside-check">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </aside>
  )
}
