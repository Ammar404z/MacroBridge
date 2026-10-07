import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { api, type Analysis, type LogInput } from '../api/client'
import { CameraIcon, ChevronIcon, FoodsIcon } from '../components/icons'
import {
  Card, Checkbox, ErrorMessage, Field, FlowScreen, MealSegment, PrimaryButton, TextArea, TextButton,
} from '../components/ui'
import { capitalize, labelForNow, num } from '../lib/format'

/** Shrinks a photo to a JPEG at most 1280px wide/tall so uploads stay small. */
async function toJpegBase64(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function LogMeal() {
  const navigate = useNavigate()
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
      await api.logMeal(form)
      navigate('/', { replace: true })
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
          title={analysis ? 'Check the estimate' : 'Enter macros'}
          back={startOver}
          actions={<>
            <PrimaryButton busy={busy}>Save meal</PrimaryButton>
            <TextButton onClick={startOver}>Start over</TextButton>
          </>}
        >
          {analysis && (
            <Card className="mt-3 flex flex-col gap-2">
              {analysis.items.map((item, i) => (
                <div key={i} className="flex justify-between gap-2 text-[13px]">
                  <div>{item.name} <span className="text-muted">({item.portion})</span></div>
                  <div className="shrink-0 text-ink-2">{num(item.calories)} kcal</div>
                </div>
              ))}
              <p className="mt-0.5 border-t border-line pt-2.5 text-xs leading-normal text-muted">
                <span className="font-bold text-ink">{capitalize(analysis.confidence)} confidence.</span> {analysis.notes}
              </p>
            </Card>
          )}
          <section className="mt-3.5 flex flex-col gap-3">
            <Field label="Description" required maxLength={500} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <MealSegment value={form.mealLabel} onChange={(mealLabel) => setForm({ ...form, mealLabel })} />
            <div className="grid grid-cols-2 gap-3">
              {num4('calories', 'Calories (kcal)')}
              {num4('protein', 'Protein (g)')}
              {num4('carbs', 'Carbs (g)')}
              {num4('fat', 'Fat (g)')}
            </div>
            <Checkbox label="Also save to my foods" checked={saveToFoods} onChange={setSaveToFoods} />
            <ErrorMessage message={error} />
          </section>
        </FlowScreen>
      </form>
    )
  }

  return (
    <form onSubmit={analyze} className="contents">
      <FlowScreen
        title="Log a meal"
        back="/"
        actions={<>
          <PrimaryButton busy={busy} busyLabel="Analyzing…">Analyze</PrimaryButton>
          <TextButton onClick={enterManually}>Enter macros manually</TextButton>
        </>}
      >
        <section className="mt-5 flex flex-col gap-4">
          <TextArea label="What did you eat?" rows={4} maxLength={500} value={description}
            onChange={(e) => setDescription(e.target.value)} placeholder="e.g. 2 eggs, toast with butter, a latte"
            className="h-31" />

          <input ref={fileInput} type="file" accept="image/*" className="hidden"
            onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)} />
          {preview ? (
            <div className="relative overflow-hidden rounded-[14px] border border-line">
              <img src={preview} alt="Selected meal" className="h-44 w-full object-cover" />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <button type="button" onClick={() => fileInput.current?.click()}
                  className="h-9 rounded-full bg-bg/85 px-3.5 text-[13px] font-bold text-ink backdrop-blur">Change</button>
                <button type="button" onClick={() => pickPhoto(null)}
                  className="h-9 rounded-full bg-bg/85 px-3.5 text-[13px] font-bold text-danger backdrop-blur">Remove</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileInput.current?.click()}
              className="flex h-33 flex-col items-center justify-center gap-2.5 rounded-[14px] border border-dashed border-[#3A434A] hover:bg-surface">
              <CameraIcon className="text-accent" />
              <span className="text-[15px] font-semibold">Take or choose a photo</span>
              <span className="text-xs text-muted">Text, a photo, or both</span>
            </button>
          )}

          <Link to="/foods" className="flex h-13 items-center gap-2.5 rounded-[14px] bg-surface pr-2.5 pl-3.5 hover:bg-surface-2">
            <FoodsIcon size={20} className="text-muted" />
            <span className="flex-1 text-sm font-semibold">Pick from my foods</span>
            <ChevronIcon className="text-muted" />
          </Link>
          <ErrorMessage message={error} />
        </section>
      </FlowScreen>
    </form>
  )
}
