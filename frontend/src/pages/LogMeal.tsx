import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api, type Analysis, type LogInput, type Meal } from '../api/client'
import { CameraIcon, ChevronIcon, FoodsIcon } from '../components/icons'
import { ItemRows } from '../components/MealDetails'
import {
  Card, Checkbox, ErrorMessage, Field, FlowScreen, MealSegment, PastDayNote, Pill, PrimaryButton, SectionTitle, TextArea,
  TextButton,
} from '../components/ui'
import { capitalize, dateQuery, labelForNow, num, pcf, relogInput } from '../lib/format'
import { t } from '../lib/i18n'
import { toJpegBase64 } from '../lib/image'

export default function LogMeal() {
  const navigate = useNavigate()
  // Set when adding a meal to a past day from Today's arrows
  const date = useSearchParams()[0].get('date')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  // The editable form; null until analyzed or "Enter macros manually" is picked
  const [form, setForm] = useState<LogInput | null>(null)
  const [saveToFoods, setSaveToFoods] = useState(false)
  // Remembered so a retry after a failed meal save doesn't try to create the food twice
  const [foodSaved, setFoodSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const [recent, setRecent] = useState<Meal[]>([])

  // Nice to have, so failures stay quiet
  useEffect(() => {
    api.recentMeals().then(setRecent).catch(() => {})
  }, [])

  function pickPhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview)
    setPhoto(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  async function analyze(e: FormEvent) {
    e.preventDefault()
    if (!description.trim() && !photo) {
      setError('Describe the meal or add a photo')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const imageBase64 = photo ? await toJpegBase64(photo) : undefined
      const result = await api.analyzeMeal({
        description: description.trim() || undefined,
        imageBase64,
        mimeType: imageBase64 ? 'image/jpeg' : undefined,
      })
      setAnalysis(result)
      setForm({
        ...result.totals,
        description: result.title || description.trim(),
        mealLabel: labelForNow(),
        source: photo ? 'photo' : 'text',
        items: result.items,
        confidence: result.confidence,
        aiNotes: result.notes,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setBusy(false)
    }
  }

  function enterManually() {
    setError(null)
    setAnalysis(null)
    setForm({ description: description.trim(), calories: 0, protein: 0, carbs: 0, fat: 0, mealLabel: labelForNow(), source: 'manual' })
  }

  function startOver() {
    setForm(null)
    setAnalysis(null)
    setError(null)
  }

  /** "Log" on a recent meal: saved straight away, no AI. */
  async function relog(m: Meal) {
    setError(null)
    setBusy(true)
    try {
      await api.logMeal(relogInput(m, date ?? undefined))
      navigate(`/${dateQuery(date)}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setError(null)
    setBusy(true)
    try {
      if (saveToFoods && !foodSaved) {
        const { description: name, calories, protein, carbs, fat } = form
        await api.createFood({ name, calories, protein, carbs, fat })
        setFoodSaved(true)
      }
      const photoBase64 = photo ? await toJpegBase64(photo, 800) : undefined
      await api.logMeal({ ...form, logDate: date ?? undefined, photoBase64 })
      navigate(`/${dateQuery(date)}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  if (form) {
    const num4 = (key: 'calories' | 'protein' | 'carbs' | 'fat', label: string) => (
      <Field label={label} numeric required step={key === 'calories' ? 1 : 0.1} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
    )
    return (
      <form onSubmit={save} className="contents">
        <FlowScreen
          title={t(analysis ? 'Check the estimate' : 'Enter macros')}
          back={startOver}
          actions={<>
            <PrimaryButton busy={busy}>{t('Save meal')}</PrimaryButton>
            <TextButton onClick={startOver}>{t('Start over')}</TextButton>
          </>}
        >
          {date && <PastDayNote date={date} />}
          {analysis && (
            <Card className="mt-3 flex flex-col gap-2">
              <ItemRows items={analysis.items} />
              <p className="mt-0.5 border-t border-line pt-2.5 text-xs leading-normal text-muted">
                <span className="font-bold text-ink">{t(`${capitalize(analysis.confidence)} confidence.`)}</span> {analysis.notes}
              </p>
            </Card>
          )}
          <section className="mt-3.5 flex flex-col gap-3">
            <Field label={t('Description')} required maxLength={500} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <MealSegment value={form.mealLabel} onChange={(mealLabel) => setForm({ ...form, mealLabel })} />
            <div className="grid grid-cols-2 gap-3">
              {num4('calories', t('Calories (kcal)'))}
              {num4('protein', t('Protein (g)'))}
              {num4('carbs', t('Carbs (g)'))}
              {num4('fat', t('Fat (g)'))}
            </div>
            <Checkbox label={t('Also save to my foods')} checked={saveToFoods} onChange={setSaveToFoods} />
            <ErrorMessage message={error} />
          </section>
        </FlowScreen>
      </form>
    )
  }

  return (
    <form onSubmit={analyze} className="contents">
      <FlowScreen
        title={t('Log a meal')}
        back={`/${dateQuery(date)}`}
        actions={<>
          <PrimaryButton busy={busy} busyLabel={t('Analyzing…')}>{t('Analyze')}</PrimaryButton>
          <TextButton onClick={enterManually}>{t('Enter macros manually')}</TextButton>
        </>}
      >
        {date && <PastDayNote date={date} />}
        <section className="mt-5 flex flex-col gap-4">
          <TextArea label={t('What did you eat?')} rows={4} maxLength={500} value={description}
            onChange={(e) => setDescription(e.target.value)} placeholder={t('e.g. 2 eggs, toast with butter, a latte')}
            className="h-31" />

          <input ref={fileInput} type="file" accept="image/*" className="hidden"
            onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)} />
          {preview ? (
            <div className="relative overflow-hidden rounded-[14px] border border-line">
              <img src={preview} alt={t('Selected meal')} className="h-44 w-full object-cover" />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <button type="button" onClick={() => fileInput.current?.click()}
                  className="h-9 rounded-full bg-bg/85 px-3.5 text-[13px] font-bold text-ink backdrop-blur">{t('Change')}</button>
                <button type="button" onClick={() => pickPhoto(null)}
                  className="h-9 rounded-full bg-bg/85 px-3.5 text-[13px] font-bold text-danger backdrop-blur">{t('Remove')}</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileInput.current?.click()}
              className="flex h-33 flex-col items-center justify-center gap-2.5 rounded-[14px] border border-dashed border-[#3A434A] hover:bg-surface">
              <CameraIcon className="text-accent" />
              <span className="text-[15px] font-semibold">{t('Take or choose a photo')}</span>
              <span className="text-xs text-muted">{t('Text, a photo, or both')}</span>
            </button>
          )}

          <Link to={`/foods${dateQuery(date)}`} className="flex h-13 items-center gap-2.5 rounded-[14px] bg-surface pr-2.5 pl-3.5 hover:bg-surface-2">
            <FoodsIcon size={20} className="text-muted" />
            <span className="flex-1 text-sm font-semibold">{t('Pick from my foods')}</span>
            <ChevronIcon className="text-muted" />
          </Link>
          <ErrorMessage message={error} />
        </section>

        {recent.length > 0 && (
          <section className="mt-6 flex flex-col gap-2">
            <SectionTitle>{t('Recent')}</SectionTitle>
            {recent.map((m) => (
              <div key={m.id} className="flex h-15 items-center gap-2 rounded-[14px] bg-surface pr-2 pl-3.5">
                {/* Tap the meal to change it before saving, or Log to save it as it was */}
                <button type="button" onClick={() => setForm(relogInput(m))} aria-label={t('Change {name} before logging', { name: m.description })}
                  className="flex min-w-0 flex-1 flex-col gap-1 self-stretch justify-center text-left">
                  <span className="truncate text-sm font-semibold">{m.description}</span>
                  <span className="text-xs text-muted">{num(m.calories)} kcal · {pcf(m)}</span>
                </button>
                <Pill onClick={() => relog(m)} disabled={busy}>{t('Log')}</Pill>
              </div>
            ))}
          </section>
        )}
      </FlowScreen>
    </form>
  )
}
