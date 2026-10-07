import { useEffect, useState, type FormEvent } from 'react'
import { api, type Profile as ProfileData } from '../api/client'
import { ErrorMessage, Field, PageHeader, PrimaryButton, SectionTitle, selectCls, TabScreen, TextButton } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { kcalFromMacros, num } from '../lib/format'

const ZONES: string[] = Intl.supportedValuesOf?.('timeZone') ?? []

export default function Profile() {
  const { logout } = useAuth()
  const [form, setForm] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.profile().then(setForm).catch((e) => setError(e.message))
  }, [])

  function update(patch: Partial<ProfileData>) {
    setForm((f) => f && { ...f, ...patch })
    setSaved(false)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setError(null)
    setBusy(true)
    try {
      setForm(await api.updateProfile({ ...form, displayName: form.displayName?.trim() || undefined }))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const target = (key: 'targetCalories' | 'targetProtein' | 'targetCarbs' | 'targetFat', label: string) => form && (
    <Field label={label} numeric required step={key === 'targetCalories' ? 1 : 0.1} value={form[key]}
      onChange={(e) => update({ [key]: Number(e.target.value) })} />
  )

  // Keep the saved zone selectable even if this browser's list doesn't have it
  const zones = form && !ZONES.includes(form.timezone) ? [form.timezone, ...ZONES] : ZONES

  return (
    <TabScreen>
      <form onSubmit={save} className="flex min-h-[calc(100dvh-84px-env(safe-area-inset-bottom)-40px)] flex-col">
        <PageHeader title="Profile" />
        <ErrorMessage message={error} />
        {form && (
          <>
            <section className="mt-2.5 flex flex-col gap-3">
              <Field label="Display name" maxLength={100} value={form.displayName ?? ''}
                onChange={(e) => update({ displayName: e.target.value })} />
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-ink-2">Timezone</span>
                <select value={form.timezone} onChange={(e) => update({ timezone: e.target.value })} className={selectCls}>
                  {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <span className="text-xs text-muted">Decides when your day resets.</span>
              </label>
            </section>

            <section className="mt-[18px] flex flex-col gap-2.5">
              <SectionTitle>Daily targets</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {target('targetCalories', 'Calories (kcal)')}
                {target('targetProtein', 'Protein (g)')}
                {target('targetCarbs', 'Carbs (g)')}
                {target('targetFat', 'Fat (g)')}
              </div>
              <p className="text-xs text-muted">
                Your macros add up to {num(kcalFromMacros({ protein: form.targetProtein, carbs: form.targetCarbs, fat: form.targetFat }))} kcal.
              </p>
            </section>

            <div className="mt-auto flex flex-col gap-0.5 pt-6">
              <PrimaryButton busy={busy}>{saved ? 'Saved' : 'Save changes'}</PrimaryButton>
              <TextButton onClick={logout}>Log out</TextButton>
            </div>
          </>
        )}
      </form>
    </TabScreen>
  )
}
