import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout, ErrorMessage, Field, SubmitButton } from '../components/AuthLayout'
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
    <AuthLayout title="Welcome back" subtitle="Log in to track today's macros">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <ErrorMessage message={error} />
        <SubmitButton busy={busy}>Log in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        No account?{' '}
        <Link to="/signup" className="font-medium text-emerald-700 hover:underline">Sign up</Link>
      </p>
    </AuthLayout>
  )
}
