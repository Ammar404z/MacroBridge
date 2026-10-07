import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { ErrorMessage, Field, PrimaryButton } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="MacroBridge"
      subtitle={<>Describe a meal or snap a photo.<br />Your macros are logged against today's targets.</>}
      footer={<>
        <span>New here?</span>
        <Link to="/signup" className="flex h-11 items-center px-1 font-bold text-accent">Create an account</Link>
      </>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Field label="Email" type="email" autoComplete="email" required placeholder="you@example.com"
          className="h-13" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required
          className="h-13" value={password} onChange={(e) => setPassword(e.target.value)} />
        <ErrorMessage message={error} />
        <div className="mt-2.5"><PrimaryButton busy={busy}>Log in</PrimaryButton></div>
      </form>
    </AuthLayout>
  )
}
