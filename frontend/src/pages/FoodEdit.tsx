import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api, type FoodInput } from '../api/client'
import { ErrorMessage, Field, FlowScreen, Loading, PrimaryButton, SectionTitle, TextButton } from '../components/ui'
import { t } from '../lib/i18n'

const EMPTY: FoodInput = { name: '', servingLabel: '', calories: 0, protein: 0, carbs: 0, fat: 0 }

/** /foods/new (empty, no Delete) and /foods/:id. */
export default function FoodEdit() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [form, setForm] = useState<FoodInput | null>(isNew ? EMPTY : null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isNew) return
    api.foods()
      .then((all) => {
        const f = all.find((x) => x.id === id)
        if (f) setForm({ name: f.name, servingLabel: f.servingLabel, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat })
        else setError('Food not found')
      })
      .catch((e) => setError(e.message))
  }, [id, isNew])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setError(null)
    setBusy(true)
    try {
      if (isNew) await api.createFood(form)
      else await api.updateFood(id, form)
      navigate('/foods', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  async function remove() {
    if (!id || !form || !confirm(t('Delete "{name}"? Meals you already logged keep their macros.', { name: form.name }))) return
    setBusy(true)
    try {
      await api.deleteFood(id)
      navigate('/foods', { replace: true })
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
      <FlowScreen
        title={t(isNew ? 'New food' : 'Edit food')}
        back="/foods"
        actions={form && <>
          <PrimaryButton busy={busy}>{t('Save food')}</PrimaryButton>
          {!isNew && <TextButton danger onClick={remove} disabled={busy}>{t('Delete food')}</TextButton>}
        </>}
      >
        {!form && !error && <Loading />}
        {form && (
          <>
            <section className="mt-4 flex flex-col gap-4">
              <Field label={t('Name')} required maxLength={100} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Field label={t('Serving (optional)')} maxLength={50} placeholder={t('e.g. 1 bowl, 100 g')} value={form.servingLabel ?? ''}
                onChange={(e) => setForm({ ...form, servingLabel: e.target.value })} />
            </section>
            <section className="mt-6 flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <SectionTitle>{t('Macros per serving')}</SectionTitle>
                <p className="text-xs text-muted">{t('Logging 2 servings doubles these.')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {macro('calories', t('Calories (kcal)'))}
                {macro('protein', t('Protein (g)'))}
                {macro('carbs', t('Carbs (g)'))}
                {macro('fat', t('Fat (g)'))}
              </div>
            </section>
          </>
        )}
        <div className="mt-4"><ErrorMessage message={error} /></div>
      </FlowScreen>
    </form>
  )
}
