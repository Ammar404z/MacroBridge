import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { ErrorMessage, Field, PrimaryButton } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { t } from '../lib/i18n'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Login failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="MacroBridge"
      subtitle={<>{t('Describe a meal or snap a photo.')}<br />{t("Your macros are logged against today's targets.")}</>}
      footer={<>
        <span>{t('New here?')}</span>
        <Link to="/signup" className="flex h-11 items-center px-1 font-bold text-accent">{t('Create an account')}</Link>
      </>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Field label={t('Email')} type="email" autoComplete="email" required placeholder="you@example.com"
          className="h-13" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label={t('Password')} type="password" autoComplete="current-password" required
          className="h-13" value={password} onChange={(e) => setPassword(e.target.value)} />
        <ErrorMessage message={error} />
        <div className="mt-2.5"><PrimaryButton busy={busy}>{t('Log in')}</PrimaryButton></div>
      </form>
    </AuthLayout>
  )
}
