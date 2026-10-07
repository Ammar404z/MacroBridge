import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { api, type Food, type MealLabel, type Today } from '../api/client'
import { MinusIcon, PlusIcon } from '../components/icons'
import { Card, ErrorMessage, FlowScreen, Loading, MacroStats, MealSegment, PastDayNote, PrimaryButton, TextButton } from '../components/ui'
import { dateQuery, labelForNow, num, pcf, scale } from '../lib/format'
import { t } from '../lib/i18n'

const STEP = 0.5

export default function FoodLog() {
  const { id } = useParams()
  const navigate = useNavigate()
  const date = useSearchParams()[0].get('date')
  const [food, setFood] = useState<Food | null>(null)
  const [today, setToday] = useState<Today | null>(null)
  const [servings, setServings] = useState(1)
  const [mealLabel, setMealLabel] = useState<MealLabel>(labelForNow)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // No single-food endpoint; the list is small
    api.foods()
      .then((all) => {
        const f = all.find((x) => x.id === id)
        if (f) setFood(f)
        else setError('Food not found')
      })
      .catch((e) => setError(e.message))
    ;(date ? api.day(date) : api.today()).then(setToday).catch(() => {})
  }, [id, date])

  async function log() {
    if (!food) return
    setError(null)
    setBusy(true)
    try {
      await api.logFood(food.id, servings, mealLabel, date ?? undefined)
      navigate(`/${dateQuery(date)}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not log this')
      setBusy(false)
    }
  }

  const adds = food && scale(food, servings)
  const leftAfter = today && adds && today.targets.calories - today.totals.calories - adds.calories
  const servingsText = num(servings)

  return (
    <FlowScreen
      title={t('Log a food')}
      back={`/foods${dateQuery(date)}`}
      actions={food && <>
        <PrimaryButton type="button" onClick={log} busy={busy}>
          {t(servings === 1 ? 'Log {n} serving' : 'Log {n} servings', { n: servingsText })}
        </PrimaryButton>
        <TextButton to={`/foods/${food.id}`}>{t('Edit this food')}</TextButton>
      </>}
    >
      {date && <PastDayNote date={date} />}
      <ErrorMessage message={error} />
      {!food && !error && <Loading />}
      {food && adds && (
        <>
          <Card className="mt-3 flex flex-col gap-1.5 py-4">
            <div className="text-lg font-bold tracking-[-0.01em]">{food.name}</div>
            <div className="text-[13px] text-muted">
              {t('Per serving ({serving}): {kcal} kcal · {pcf}', { serving: food.servingLabel, kcal: num(food.calories), pcf: pcf(food) })}
            </div>
          </Card>

          <section className="mt-6 flex flex-col gap-2.5">
            <div className="text-[13px] font-semibold text-ink-2">{t('Servings')}</div>
            <div className="flex items-center justify-between gap-3">
              <StepButton label={t('Fewer servings')} disabled={servings <= STEP}
                onClick={() => setServings((s) => Math.max(STEP, s - STEP))}><MinusIcon /></StepButton>
              <div className="text-[56px] leading-none font-bold tracking-[-0.03em]" aria-live="polite">{servingsText}</div>
              <StepButton label={t('More servings')} disabled={servings >= 20}
                onClick={() => setServings((s) => Math.min(20, s + STEP))}><PlusIcon /></StepButton>
            </div>
          </section>

          <div className="mt-6"><MealSegment value={mealLabel} onChange={setMealLabel} /></div>

          <section className="mt-6 flex flex-col gap-2.5 rounded-[14px] border border-line p-3.5">
            <div className="text-xs font-semibold text-muted">{t('This adds')}</div>
            <MacroStats macros={adds} />
            {leftAfter != null && (
              <div className="border-t border-line pt-2.5 text-[13px] text-muted">
                {leftAfter >= 0
                  ? t(date ? 'Leaves you {n} kcal for that day.' : 'Leaves you {n} kcal for today.', { n: num(leftAfter) })
                  : t(date ? "Puts you {n} kcal over that day's target." : "Puts you {n} kcal over today's target.", { n: num(-leftAfter) })}
              </div>
            )}
          </section>
        </>
      )}
    </FlowScreen>
  )
}

function StepButton({ label, onClick, disabled, children }: {
  label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className="grid size-16 place-items-center rounded-full border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-40">
      {children}
    </button>
  )
}
