import { updatePassword } from '@/lib/actions/auth'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="page-title">Set a new password</h1>

        {error && <p className="banner banner-error">{error}</p>}

        <form action={updatePassword} className="flex flex-col gap-3">
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="New password"
            className="input"
          />
          <button type="submit" className="btn btn-primary btn-block">
            Update password
          </button>
        </form>
      </div>
    </div>
  )
}
