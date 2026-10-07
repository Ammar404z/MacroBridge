import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api/client'
import { ErrorMessage, Field, FlowScreen, PrimaryButton } from '../components/ui'
import { t } from '../lib/i18n'

/** /profile/password. There's no "forgot password" (that needs email); this is for changing a known one. */
export default function ChangePassword() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (next !== repeat) {
      setError("The new passwords don't match")
      return
    }
    setError(null)
    setBusy(true)
    try {
      await api.changePassword(current, next)
      alert(t('Password changed'))
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="contents">
      <FlowScreen title={t('Change password')} back="/profile" actions={
        <PrimaryButton busy={busy}>{t('Change password')}</PrimaryButton>
      }>
        <section className="mt-4 flex flex-col gap-3">
          <Field label={t('Current password')} type="password" autoComplete="current-password" required
            value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Field label={t('New password')} type="password" autoComplete="new-password" required minLength={8} maxLength={72}
            hint={t('At least 8 characters')} value={next} onChange={(e) => setNext(e.target.value)} />
          <Field label={t('Repeat new password')} type="password" autoComplete="new-password" required
            value={repeat} onChange={(e) => setRepeat(e.target.value)} />
          <ErrorMessage message={error} />
        </section>
      </FlowScreen>
    </form>
  )
}
