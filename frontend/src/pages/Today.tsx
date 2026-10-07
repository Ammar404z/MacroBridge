import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api, type Meal, type Today as TodayData } from '../api/client'
import { CalorieRing } from '../components/CalorieRing'
import { BackIcon, ChevronIcon, PlusIcon, TrashIcon } from '../components/icons'
import { Empty, ErrorMessage, Loading, MacroTiles, Pill, SectionTitle, TabScreen } from '../components/ui'
import { addDays, capitalize, dateQuery, localToday, longDate, num, pcf } from '../lib/format'

/** Today, or any past day via ?date=YYYY-MM-DD (the ‹ › arrows). */
export default function Today() {
  const [params, setParams] = useSearchParams()
  const today = localToday()
  const requested = params.get('date')
  // null means "today"; anything at or after today is treated as today
  const date = requested && requested < today ? requested : null
  const shown = date ?? today

  const [loaded, setLoaded] = useState<{ date: string | null; data: TodayData } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = (d: string | null) => (d ? api.day(d) : api.today())

  useEffect(() => {
    load(date).then((data) => setLoaded({ date, data })).catch((e) => setError(e.message))
  }, [date])

  const go = (d: string) => setParams(d >= today ? {} : { date: d }, { replace: true })

  async function remove(meal: Meal) {
    if (!confirm(`Delete "${meal.description}"?`)) return
    try {
      await api.deleteMeal(meal.id)
      setLoaded({ date, data: await load(date) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const title = !date ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : longDate(date).split(',')[0]
  // Keep showing the previous day until the new one arrives, so the arrows don't flash
  const data = loaded?.data

  return (
    <TabScreen>
      <header className="flex min-h-11 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-xl leading-tight font-bold tracking-[-0.02em]">{title}</h1>
          <p className="text-[13px] text-muted">{longDate(shown)}</p>
        </div>
        <div className="flex items-center">
          {date && <Pill variant="outline" onClick={() => go(today)}>Today</Pill>}
          <button type="button" aria-label="Previous day" onClick={() => go(addDays(shown, -1))}
            className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface">
            <BackIcon />
          </button>
          <button type="button" aria-label="Next day" onClick={() => go(addDays(shown, 1))} disabled={!date}
            className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface disabled:text-line disabled:hover:bg-transparent">
            <ChevronIcon size={22} />
          </button>
        </div>
      </header>
      <ErrorMessage message={error} />
      {!data && !error && <Loading />}
      {data && <DayBody day={data} past={date} onDelete={remove} />}
    </TabScreen>
  )
}

function DayBody({ day, past, onDelete }: { day: TodayData; past: string | null; onDelete: (m: Meal) => void }) {
  const { totals, targets } = day
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

      {past ? (
        <Link to={`/log${dateQuery(past)}`}
          className="mt-3 flex h-13 items-center justify-between gap-2 rounded-[14px] border border-line pr-2.5 pl-3.5 hover:bg-surface">
          <span className="text-sm font-semibold">Add a meal to this day</span>
          <PlusIcon size={20} className="text-accent" />
        </Link>
      ) : (
        <Link to="/suggest"
          className="mt-3 flex h-13 items-center justify-between gap-2 rounded-[14px] border border-line pr-2.5 pl-3.5 hover:bg-surface">
          <span className="text-sm font-semibold">Meal ideas for what's left</span>
          <ChevronIcon className="text-accent" />
        </Link>
      )}

      <section className="mt-5 flex flex-col gap-2">
        <SectionTitle>Meals</SectionTitle>
        {day.logs.length === 0 ? (
          <Empty>{past ? 'Nothing logged on this day.' : 'Nothing logged yet today. Tap + to log your first meal.'}</Empty>
        ) : (
          day.logs.map((meal) => (
            <div key={meal.id} className="flex h-15 items-center gap-2 rounded-[14px] bg-surface pr-1 pl-3.5">
              <Link to={`/meals/${meal.id}`} aria-label={`Edit ${meal.description}`}
                className="flex min-w-0 flex-1 items-center gap-2 self-stretch">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="truncate text-sm font-semibold">{meal.description}</div>
                  <div className="text-xs text-muted">{capitalize(meal.mealLabel)} · {pcf(meal)}</div>
                </div>
                <div className="text-[15px] font-bold">{num(meal.calories)}</div>
              </Link>
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
