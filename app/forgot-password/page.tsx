import Link from 'next/link'
import { requestPasswordReset } from '@/lib/actions/auth'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div>
          <h1 className="page-title">Reset your password</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            We'll email you a link to set a new one.
          </p>
        </div>

        {error && <p className="banner banner-error">{error}</p>}

        <form action={requestPasswordReset} className="flex flex-col gap-3">
          <input name="email" type="email" required placeholder="Email" className="input" />
          <button type="submit" className="btn btn-primary btn-block">
            Send reset link
          </button>
        </form>

        <Link href="/login" className="btn-link text-sm">
          Back to log in
        </Link>
      </div>
    </div>
  )
}
