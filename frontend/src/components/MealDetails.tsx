import { useEffect, useState } from 'react'
import { mealPhotoUrl, type MealItem } from '../api/client'
import { num } from '../lib/format'
import { t } from '../lib/i18n'

/** One line per food the AI found: "Rice (150 g) … 195 kcal". */
export function ItemRows({ items }: { items: MealItem[] }) {
  return items.map((item, i) => (
    <div key={i} className="flex justify-between gap-2 text-[13px]">
      <div>{item.name} {item.portion && <span className="text-muted">({item.portion})</span>}</div>
      <div className="shrink-0 text-ink-2">{num(item.calories)} kcal</div>
    </div>
  ))
}

/** The photo a meal was logged with; nothing while it loads or if it can't be loaded. */
export function MealPhoto({ id, className }: { id: string; className?: string }) {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null)

  useEffect(() => {
    let live = true
    mealPhotoUrl(id).then((url) => live && setLoaded({ id, url })).catch(() => {})
    return () => { live = false }
  }, [id])

  if (loaded?.id !== id) return null
  return <img src={loaded.url} alt={t('Meal photo')} className={`w-full rounded-xl object-cover ${className ?? 'h-48'}`} />
}

/** Whether a meal has anything to show in MealDetails. */
export const hasDetails = (m: { items: MealItem[] | null; hasPhoto: boolean }) => m.hasPhoto || !!m.items?.length

/** Photo and per-item breakdown of a logged meal (yours or a friend's). */
export function MealDetails({ meal }: { meal: { id: string; items: MealItem[] | null; hasPhoto: boolean } }) {
  return (
    <div className="flex flex-col gap-2.5">
      {meal.hasPhoto && <MealPhoto id={meal.id} />}
      {!!meal.items?.length && <div className="flex flex-col gap-2"><ItemRows items={meal.items} /></div>}
    </div>
  )
}
