import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { GoogleButton } from '../login/google-button'
import { AuthAside } from '@/components/auth-aside'
import { PasswordField } from '@/components/password-field'
import { RoleCards } from './role-cards'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>
}) {
  const { error, role } = await searchParams
  const defaultRole = role === 'receiver' ? 'receiver' : 'donor'

  return (
    <div className="auth-shell">
      <AuthAside />

      <main className="auth-main">
        <div className="auth-card auth-card-wide">
          <div>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">First, tell us how you&apos;ll use SaveBite.</p>
          </div>

          {error && <p className="banner banner-error">{error}</p>}

          <form action={signUp} className="flex flex-col gap-4">
            <RoleCards defaultRole={defaultRole} />

            <div className="field-row">
              <div>
                <span className="field-label">Your name</span>
                <input name="full_name" placeholder="Your name" required className="input" />
              </div>
              <div>
                <span className="field-label">Organization</span>
                <input name="org_name" placeholder="Optional" className="input" />
              </div>
            </div>

            <div>
              <span className="field-label">Email</span>
              <input name="email" type="email" required placeholder="you@example.com" className="input" />
            </div>

            <div>
              <span className="field-label">Password</span>
              <PasswordField name="password" placeholder="At least 8 characters" minLength={6} />
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-1">
              Create account →
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
      </main>
    </div>
  )
}
