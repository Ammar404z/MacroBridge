import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout, ErrorMessage, Field, SubmitButton } from '../components/AuthLayout'
import { useAuth } from '../hooks/useAuth'

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [targets, setTargets] = useState({ calories: '2000', protein: '150', carbs: '200', fat: '65' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await register({
        email,
        password,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        targetCalories: Number(targets.calories),
        targetProtein: Number(targets.protein),
        targetCarbs: Number(targets.carbs),
        targetFat: Number(targets.fat),
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setBusy(false)
    }
  }

  const target = (key: keyof typeof targets, label: string) => (
    <Field label={label} type="number" min={0} step={key === 'calories' ? 1 : 0.1} required inputMode="decimal"
      value={targets[key]} onChange={(e) => setTargets({ ...targets, [key]: e.target.value })} />
  )

  return (
    <AuthLayout title="Create your account" subtitle="Set your daily targets — you can change them later">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
          placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        <fieldset className="grid grid-cols-2 gap-3 border-t border-stone-100 pt-4">
          <legend className="mb-2 text-sm font-medium text-stone-500">Daily targets</legend>
          {target('calories', 'Calories (kcal)')}
          {target('protein', 'Protein (g)')}
          {target('carbs', 'Carbs (g)')}
          {target('fat', 'Fat (g)')}
        </fieldset>
        <ErrorMessage message={error} />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-emerald-700 hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  )
}
