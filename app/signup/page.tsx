import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { GoogleButton } from '../login/google-button'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>
}) {
  const { error, role } = await searchParams
  const defaultRole = role === 'donor' ? 'donor' : 'receiver'

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div>
          <Link href="/" className="brand mb-1">
            <span className="brand-mark">🍃</span>
            SaveBite
          </Link>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Post surplus food or find food near you.
          </p>
        </div>

        {error && <p className="banner banner-error">{error}</p>}

        <form action={signUp} className="flex flex-col gap-3">
          <select name="role" required className="input" defaultValue={defaultRole}>
            <option value="donor">Donor (restaurant, bakery, store, cafeteria)</option>
            <option value="receiver">Receiver (food bank, shelter, individual)</option>
          </select>
          <input name="full_name" placeholder="Your name" required className="input" />
          <input name="org_name" placeholder="Organization name (optional)" className="input" />
          <input name="email" type="email" required placeholder="Email" className="input" />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Password"
            className="input"
          />
          <button type="submit" className="btn btn-primary btn-block">
            Sign up
          </button>
        </form>

        <div className="auth-divider">or</div>

        <GoogleButton />

        <p className="text-sm text-[color:var(--muted)]">
          Already have an account?{' '}
          <Link href="/login" className="btn-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
