import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, type Profile as ProfileData } from '../api/client'
import { Avatar } from '../components/Avatar'
import { Link } from 'react-router'
import { ChevronIcon } from '../components/icons'
import { ErrorMessage, Field, Loading, PageHeader, PrimaryButton, SectionTitle, selectCls, TabScreen, TextButton } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { kcalFromMacros, num } from '../lib/format'
import { lang, setLang, t, type Lang } from '../lib/i18n'
import { toAvatarBase64 } from '../lib/image'

const ZONES: string[] = Intl.supportedValuesOf?.('timeZone') ?? []

export default function Profile() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.profile().then(setForm).catch((e) => setError(e.message))
  }, [])

  function update(patch: Partial<ProfileData>) {
    setForm((f) => f && { ...f, ...patch })
    setSaved(false)
  }

  /** Pictures save right away; the rest of the form waits for "Save changes". */
  async function changePhoto(file: File | undefined) {
    if (!file) return
    setError(null)
    setPhotoBusy(true)
    try {
      const updated = await api.uploadAvatar(await toAvatarBase64(file))
      setForm((f) => f && { ...f, avatarVersion: updated.avatarVersion })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the picture')
    } finally {
      setPhotoBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function removePhoto() {
    if (!confirm(t('Remove your profile picture?'))) return
    setPhotoBusy(true)
    try {
      const updated = await api.deleteAvatar()
      setForm((f) => f && { ...f, avatarVersion: updated.avatarVersion })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the picture')
    } finally {
      setPhotoBusy(false)
    }
  }

  function confirmLogout() {
    if (confirm(t('Log out of MacroBridge?'))) logout()
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setError(null)
    setBusy(true)
    try {
      const { avatarVersion: _, ...changes } = form
      setForm(await api.updateProfile({ ...changes, displayName: form.displayName?.trim() || undefined }))
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
        <PageHeader title={t('Profile')} />
        <ErrorMessage message={error} />
        {!form && !error && <Loading />}
        {form && (
          <>
            <section className="mt-2.5 flex items-center gap-4">
              <button type="button" onClick={() => fileInput.current?.click()} aria-label={t('Change profile picture')}
                disabled={photoBusy} className="rounded-full disabled:opacity-60">
                <Avatar id={user!.id} name={form.displayName || user!.email} version={form.avatarVersion} size={72} />
              </button>
              <div className="flex flex-col items-start">
                <button type="button" onClick={() => fileInput.current?.click()} disabled={photoBusy}
                  className="h-9 text-sm font-bold text-accent disabled:opacity-60">
                  {t(photoBusy ? 'Uploading…' : form.avatarVersion ? 'Change photo' : 'Add a photo')}
                </button>
                {form.avatarVersion && (
                  <button type="button" onClick={removePhoto} disabled={photoBusy}
                    className="h-9 text-sm font-semibold text-muted hover:text-danger disabled:opacity-60">{t('Remove')}</button>
                )}
              </div>
              <input ref={fileInput} type="file" accept="image/*" className="hidden"
                onChange={(e) => changePhoto(e.target.files?.[0])} />
            </section>

            <section className="mt-4 flex flex-col gap-3">
              <Field label={t('Display name')} maxLength={100} value={form.displayName ?? ''}
                onChange={(e) => update({ displayName: e.target.value })} />
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-ink-2">{t('Timezone')}</span>
                <select value={form.timezone} onChange={(e) => update({ timezone: e.target.value })} className={selectCls}>
                  {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <span className="text-xs text-muted">{t('Decides when your day resets.')}</span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-ink-2">{t('Language')}</span>
                <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className={selectCls}>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </label>
            </section>

            <section className="mt-[18px] flex flex-col gap-2.5">
              <SectionTitle>{t('Daily targets')}</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {target('targetCalories', t('Calories (kcal)'))}
                {target('targetProtein', t('Protein (g)'))}
                {target('targetCarbs', t('Carbs (g)'))}
                {target('targetFat', t('Fat (g)'))}
              </div>
              <p className="text-xs text-muted">
                {t('Your macros add up to {n} kcal.', { n: num(kcalFromMacros({ protein: form.targetProtein, carbs: form.targetCarbs, fat: form.targetFat })) })}
              </p>
            </section>

            <label className="mt-3 flex h-13 items-center justify-between gap-3 rounded-[14px] bg-surface px-3.5">
              <span className="text-sm font-semibold">{t('Friends can see my meals')}</span>
              <input type="checkbox" checked={form.shareMeals} onChange={(e) => update({ shareMeals: e.target.checked })}
                className="m-0 size-[22px] accent-accent" />
            </label>

            <Link to="/profile/password"
              className="mt-2 flex h-13 items-center justify-between gap-3 rounded-[14px] bg-surface pr-2.5 pl-3.5 hover:bg-surface-2">
              <span className="text-sm font-semibold">{t('Change password')}</span>
              <ChevronIcon className="text-muted" />
            </Link>

            <div className="mt-auto flex flex-col gap-0.5 pt-6">
              <PrimaryButton busy={busy}>{t(saved ? 'Saved' : 'Save changes')}</PrimaryButton>
              <TextButton onClick={confirmLogout}>{t('Log out')}</TextButton>
            </div>
          </>
        )}
      </form>
    </TabScreen>
  )
}
