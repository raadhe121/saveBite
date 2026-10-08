import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'
import { GoogleButton } from './google-button'
import { AuthAside } from '@/components/auth-aside'
import { PasswordField } from '@/components/password-field'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <div className="auth-shell">
      <AuthAside />

      <main className="auth-main">
        <div className="auth-card">
          <div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Log in to keep rescuing food.</p>
          </div>

          {message && <p className="banner banner-success">{message}</p>}
          {error && <p className="banner banner-error">{error}</p>}

          <form action={signIn} className="flex flex-col gap-4">
            <div>
              <span className="field-label">Email</span>
              <input name="email" type="email" required placeholder="you@example.com" className="input" />
            </div>
            <div>
              <span className="field-label">Password</span>
              <PasswordField name="password" placeholder="Enter your password" />
            </div>
            <Link href="/forgot-password" className="self-end text-xs text-[color:var(--muted)] underline">
              Forgot password?
            </Link>
            <button type="submit" className="btn btn-primary btn-block">
              Log in
            </button>
          </form>

          <div className="auth-divider">or</div>

          <GoogleButton />

          <p className="text-sm text-[color:var(--muted)]">
            No account?{' '}
            <Link href="/signup" className="btn-link">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
