import { useEffect, useState } from 'react'
import { api, type History } from '../api/client'
import { BarChart } from '../components/BarChart'
import { ErrorMessage, Loading, PageHeader, TabScreen } from '../components/ui'
import { num } from '../lib/format'
import { t } from '../lib/i18n'
import { everyDay, onTarget, streak } from '../lib/progress'

const DAYS = 30

/** /progress, from Today: the last 30 days of calories and protein against the targets. */
export default function Progress() {
  const [history, setHistory] = useState<History | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.history(DAYS).then(setHistory).catch((e) => setError(e.message))
  }, [])

  const days = history ? everyDay(history) : []
  const logged = history?.days ?? []
  const target = history?.targets
  const hits = target ? logged.filter((d) => onTarget(d.totals.calories, target.calories)).length : 0
  const average = logged.length ? logged.reduce((sum, d) => sum + d.totals.calories, 0) / logged.length : 0

  return (
    <TabScreen>
      <PageHeader title={t('Progress')} subtitle={t('Last {n} days', { n: DAYS })} back="/" />
      <ErrorMessage message={error} />
      {!history && !error && <Loading />}
      {history && target && (
        <>
          <section className="mt-4 grid grid-cols-3 gap-2">
            <Stat value={num(streak(days))} label={t('day streak')} />
            <Stat value={`${hits}/${DAYS}`} label={t('days on target')} />
            <Stat value={num(Math.round(average))} label={t('kcal a day')} />
          </section>
          <p className="mt-2 text-xs leading-normal text-muted">
            {t('Streak: days in a row with a meal logged. On target: within 10% of your calorie target.')}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <BarChart title={t('Calories')} unit="kcal" target={target.calories}
              days={days.map((d) => ({ date: d.date, value: d.totals?.calories ?? null }))} />
            <BarChart title={t('Protein')} unit="g" target={target.protein}
              days={days.map((d) => ({ date: d.date, value: d.totals?.protein ?? null }))} />
          </div>
        </>
      )}
    </TabScreen>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] bg-surface px-3.5 py-3">
      <div className="text-[22px] leading-none font-bold tracking-[-0.02em]">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
