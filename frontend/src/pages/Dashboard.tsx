import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, type Macros, type Meal, type Today } from '../api/client'
import { ErrorMessage } from '../components/AuthLayout'
import { useAuth } from '../hooks/useAuth'

const MACROS: { key: keyof Macros; label: string; unit: string; color: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: 'bg-emerald-600' },
  { key: 'protein', label: 'Protein', unit: 'g', color: 'bg-sky-600' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: 'bg-amber-500' },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'bg-rose-500' },
]

export default function Dashboard() {
  const { logout } = useAuth()
  const [today, setToday] = useState<Today | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.today().then(setToday).catch((e) => setError(e.message))
  }, [])

  async function remove(meal: Meal) {
    if (!confirm(`Delete "${meal.description}"?`)) return
    try {
      await api.deleteMeal(meal.id)
      setToday(await api.today())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 font-bold text-white">M</div>
          <span className="text-lg font-semibold">MacroBridge</span>
        </div>
        <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-200">
          Log out
        </button>
      </header>

      <ErrorMessage message={error} />

      {today && (
        <>
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-stone-500">
              Today ·{' '}
              {new Date(today.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </h2>
            <div className="space-y-4">
              {MACROS.map((m) => (
                <MacroBar key={m.key} label={m.label} unit={m.unit} color={m.color} value={today.totals[m.key]} target={today.targets[m.key]} />
              ))}
            </div>
          </section>

          <Link
            to="/log"
            className="mt-4 block rounded-xl bg-emerald-600 px-4 py-3 text-center font-medium text-white hover:bg-emerald-700"
          >
            + Log a meal
          </Link>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-stone-500">Meals</h2>
            {today.logs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                Nothing logged yet today.
              </p>
            ) : (
              <ul className="space-y-2">
                {today.logs.map((meal) => (
                  <li key={meal.id} className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{meal.mealLabel}</p>
                      <p className="truncate font-medium">{meal.description}</p>
                      <p className="mt-1 text-sm text-stone-500">
                        {meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                      </p>
                    </div>
                    <button
                      onClick={() => remove(meal)}
                      aria-label={`Delete ${meal.description}`}
                      className="rounded-lg px-2 py-1 text-sm text-stone-400 hover:bg-red-50 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function MacroBar({ label, unit, color, value, target }: { label: string; unit: string; color: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  const left = Math.round((target - value) * 10) / 10
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-stone-500">
          {value} / {target} {unit}
          <span className={left < 0 ? 'text-red-600' : ''}> · {left < 0 ? `${-left} over` : `${left} left`}</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${left < 0 ? 'bg-red-500' : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
