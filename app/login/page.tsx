import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'
import { GoogleButton } from './google-button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div>
          <Link href="/" className="brand mb-1">
            <span className="brand-mark">🍃</span>
            SaveBite
          </Link>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Rescue food before it goes to waste.
          </p>
        </div>

        {message && <p className="banner banner-success">{message}</p>}
        {error && <p className="banner banner-error">{error}</p>}

        <form action={signIn} className="flex flex-col gap-3">
          <input name="email" type="email" required placeholder="Email" className="input" />
          <input name="password" type="password" required placeholder="Password" className="input" />
          <button type="submit" className="btn btn-primary btn-block">
            Log in
          </button>
          <Link href="/forgot-password" className="self-end text-xs text-[color:var(--muted)] underline">
            Forgot password?
          </Link>
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
    </div>
  )
}
