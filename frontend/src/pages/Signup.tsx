import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { ErrorMessage, Field, PrimaryButton, SectionTitle } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { t } from '../lib/i18n'

// Not in the mockups: same layout as Login, plus the daily targets (editable later on Profile).
export default function Signup() {
  const { register } = useAuth()
  const [name, setName] = useState('')
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
        displayName: name.trim() || undefined,
        email,
        password,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        targetCalories: Number(targets.calories),
        targetProtein: Number(targets.protein),
        targetCarbs: Number(targets.carbs),
        targetFat: Number(targets.fat),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Sign up failed'))
    } finally {
      setBusy(false)
    }
  }

  const target = (key: keyof typeof targets, label: string) => (
    <Field label={label} numeric required step={key === 'calories' ? 1 : 0.1}
      value={targets[key]} onChange={(e) => setTargets({ ...targets, [key]: e.target.value })} />
  )

  return (
    <AuthLayout
      title={t('Create account')}
      subtitle={t('Set your daily targets. You can change them later.')}
      footer={<>
        <span>{t('Have an account?')}</span>
        <Link to="/login" className="flex h-11 items-center px-1 font-bold text-accent">{t('Log in')}</Link>
      </>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Field label={t('Name')} autoComplete="given-name" maxLength={100} placeholder={t('What friends see')}
          className="h-13" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label={t('Email')} type="email" autoComplete="email" required placeholder="you@example.com"
          className="h-13" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label={t('Password')} type="password" autoComplete="new-password" required minLength={8} maxLength={72}
          placeholder={t('At least 8 characters')} className="h-13" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <div className="mt-2 flex flex-col gap-2.5">
          <SectionTitle>{t('Daily targets')}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {target('calories', t('Calories (kcal)'))}
            {target('protein', t('Protein (g)'))}
            {target('carbs', t('Carbs (g)'))}
            {target('fat', t('Fat (g)'))}
          </div>
        </div>
        <ErrorMessage message={error} />
        <div className="mt-2.5"><PrimaryButton busy={busy}>{t('Create account')}</PrimaryButton></div>
      </form>
    </AuthLayout>
  )
}
