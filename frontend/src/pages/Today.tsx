import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, type Meal, type Today as TodayData } from '../api/client'
import { CalorieRing } from '../components/CalorieRing'
import { ChevronIcon, TrashIcon } from '../components/icons'
import { Empty, ErrorMessage, MacroTiles, PageHeader, SectionTitle, TabScreen } from '../components/ui'
import { capitalize, num, pcf } from '../lib/format'

export default function Today() {
  const [today, setToday] = useState<TodayData | null>(null)
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

  const date = today
    ? new Date(today.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : undefined

  return (
    <TabScreen>
      <PageHeader title="Today" subtitle={date} />
      <ErrorMessage message={error} />
      {today && <TodayBody today={today} onDelete={remove} />}
    </TabScreen>
  )
}

function TodayBody({ today, onDelete }: { today: TodayData; onDelete: (m: Meal) => void }) {
  const { totals, targets } = today
  const left = targets.calories - totals.calories

  return (
    <>
      <div className="mx-auto mt-3">
        <CalorieRing value={totals.calories} target={targets.calories}
          label={`${num(totals.calories)} of ${num(targets.calories)} kcal eaten`}>
          <div className="text-[42px] leading-none font-bold tracking-[-0.03em]">{num(Math.abs(left))}</div>
          <div className="mt-1 text-[13px] text-muted">{left < 0 ? 'kcal over' : 'kcal left'}</div>
        </CalorieRing>
      </div>
      <p className="mt-2.5 text-center text-[13px] text-muted">
        {num(totals.calories)} of {num(targets.calories)} kcal eaten
      </p>

      <div className="mt-[18px]"><MacroTiles totals={totals} targets={targets} /></div>

      <Link to="/suggest"
        className="mt-3 flex h-13 items-center justify-between gap-2 rounded-[14px] border border-line pr-2.5 pl-3.5 hover:bg-surface">
        <span className="text-sm font-semibold">Meal ideas for what's left</span>
        <ChevronIcon className="text-accent" />
      </Link>

      <section className="mt-5 flex flex-col gap-2">
        <SectionTitle>Meals</SectionTitle>
        {today.logs.length === 0 ? (
          <Empty>Nothing logged yet today. Tap + to log your first meal.</Empty>
        ) : (
          today.logs.map((meal) => (
            <div key={meal.id} className="flex h-15 items-center gap-2 rounded-[14px] bg-surface pr-1 pl-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="truncate text-sm font-semibold">{meal.description}</div>
                <div className="text-xs text-muted">{capitalize(meal.mealLabel)} · {pcf(meal)}</div>
              </div>
              <div className="text-[15px] font-bold">{num(meal.calories)}</div>
              <button type="button" onClick={() => onDelete(meal)} aria-label={`Delete ${meal.description}`}
                className="grid size-11 place-items-center rounded-full text-muted hover:text-danger">
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </section>
    </>
  )
}
