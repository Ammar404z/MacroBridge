import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api, type EditMealInput } from '../api/client'
import {
  ErrorMessage, Field, FlowScreen, Loading, MealSegment, PrimaryButton, TextButton,
} from '../components/ui'
import { dateQuery, localToday } from '../lib/format'
import { t } from '../lib/i18n'

/** /meals/:id, opened by tapping a meal on Today. */
export default function EditMeal() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<EditMealInput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.meal(id)
      .then((m) => setForm({
        description: m.description, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat,
        mealLabel: m.mealLabel, logDate: m.logDate,
      }))
      .catch((e) => setError(e.message))
  }, [id])

  // Back to the day the meal is on
  const dayUrl = `/${dateQuery(form?.logDate && form.logDate < localToday() ? form.logDate : null)}`

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setError(null)
    setBusy(true)
    try {
      await api.editMeal(id, form)
      navigate(dayUrl, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  async function remove() {
    if (!form || !confirm(t('Delete "{name}"?', { name: form.description }))) return
    setBusy(true)
    try {
      await api.deleteMeal(id)
      navigate(dayUrl, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setBusy(false)
    }
  }

  const macro = (key: 'calories' | 'protein' | 'carbs' | 'fat', label: string) => form && (
    <Field label={label} numeric required step={key === 'calories' ? 1 : 0.1} value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
  )

  return (
    <form onSubmit={save} className="contents">
      <FlowScreen title={t('Edit meal')} back={dayUrl} actions={form && <>
        <PrimaryButton busy={busy}>{t('Save changes')}</PrimaryButton>
        <TextButton danger onClick={remove} disabled={busy}>{t('Delete meal')}</TextButton>
      </>}>
        <ErrorMessage message={error} />
        {!form && !error && <Loading />}
        {form && (
          <section className="mt-4 flex flex-col gap-3">
            <Field label={t('Description')} required maxLength={500} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <MealSegment value={form.mealLabel ?? 'snack'} onChange={(mealLabel) => setForm({ ...form, mealLabel })} />
            <div className="grid grid-cols-2 gap-3">
              {macro('calories', t('Calories (kcal)'))}
              {macro('protein', t('Protein (g)'))}
              {macro('carbs', t('Carbs (g)'))}
              {macro('fat', t('Fat (g)'))}
            </div>
            <Field label={t('Day')} type="date" required max={localToday()} value={form.logDate ?? ''}
              onChange={(e) => setForm({ ...form, logDate: e.target.value })} />
          </section>
        )}
      </FlowScreen>
    </form>
  )
}
