import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api/client'
import { ErrorMessage, Field, FlowScreen, PrimaryButton } from '../components/ui'

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
      alert('Password changed')
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="contents">
      <FlowScreen title="Change password" back="/profile" actions={
        <PrimaryButton busy={busy}>Change password</PrimaryButton>
      }>
        <section className="mt-4 flex flex-col gap-3">
          <Field label="Current password" type="password" autoComplete="current-password" required
            value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Field label="New password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
            hint="At least 8 characters" value={next} onChange={(e) => setNext(e.target.value)} />
          <Field label="Repeat new password" type="password" autoComplete="new-password" required
            value={repeat} onChange={(e) => setRepeat(e.target.value)} />
          <ErrorMessage message={error} />
        </section>
      </FlowScreen>
    </form>
  )
}
