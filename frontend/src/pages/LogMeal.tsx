import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { api, type Analysis, type LogInput, type MealLabel } from '../api/client'
import { ErrorMessage, Field, SubmitButton } from '../components/AuthLayout'

const LABELS: MealLabel[] = ['breakfast', 'lunch', 'dinner', 'snack']

function labelForNow(): MealLabel {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h >= 17 && h < 22) return 'dinner'
  return 'snack'
}

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
  // The editable form; null until analyzed or "enter manually" is picked
  const [form, setForm] = useState<LogInput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function pickPhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview)
    setPhoto(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  async function analyze(e: FormEvent) {
    e.preventDefault()
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
        description: description.trim() || result.items.map((i) => i.name).join(', '),
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
    setAnalysis(null)
    setForm({ description, calories: 0, protein: 0, carbs: 0, fat: 0, mealLabel: labelForNow(), source: 'manual' })
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setError(null)
    setBusy(true)
    try {
      await api.logMeal(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  const num = (key: 'calories' | 'protein' | 'carbs' | 'fat') => ({
    type: 'number',
    min: 0,
    step: key === 'calories' ? 1 : 0.1,
    required: true,
    value: form![key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form!, [key]: Number(e.target.value) }),
  })

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <Link to="/" className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-200">← Back</Link>
        <h1 className="text-lg font-semibold">Log a meal</h1>
      </header>

      {!form ? (
        <form onSubmit={analyze} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">What did you eat?</span>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 2 eggs, toast with butter, a latte"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">Or add a photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:font-medium hover:file:bg-stone-200"
            />
          </label>
          {preview && (
            <img src={preview} alt="Selected meal" className="max-h-56 w-full rounded-lg object-cover" />
          )}
          <ErrorMessage message={error} />
          <SubmitButton busy={busy}>Analyze</SubmitButton>
          <button type="button" onClick={enterManually} className="w-full text-sm text-stone-500 hover:underline">
            Enter macros manually
          </button>
        </form>
      ) : (
        <form onSubmit={save} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {analysis && (
            <div className="rounded-lg bg-stone-50 p-3 text-sm">
              <ul className="space-y-1">
                {analysis.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{item.name} <span className="text-stone-400">({item.portion})</span></span>
                    <span className="shrink-0 text-stone-500">{item.calories} kcal</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-stone-500">
                <span className="font-medium capitalize">{analysis.confidence} confidence.</span> {analysis.notes}
              </p>
            </div>
          )}
          <Field label="Description" required maxLength={500} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">Meal</span>
            <select
              value={form.mealLabel}
              onChange={(e) => setForm({ ...form, mealLabel: e.target.value as MealLabel })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base capitalize outline-none focus:border-emerald-600"
            >
              {LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories (kcal)" {...num('calories')} />
            <Field label="Protein (g)" {...num('protein')} />
            <Field label="Carbs (g)" {...num('carbs')} />
            <Field label="Fat (g)" {...num('fat')} />
          </div>
          <ErrorMessage message={error} />
          <SubmitButton busy={busy}>Save meal</SubmitButton>
          <button type="button" onClick={() => setForm(null)} className="w-full text-sm text-stone-500 hover:underline">
            Start over
          </button>
        </form>
      )}
    </div>
  )
}
