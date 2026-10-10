import type { History, Macros } from '../api/client'
import { addDays } from './format'

export type DayTotals = { date: string; totals: Macros | null }

/** Every day of the history, oldest first; days without meals have null totals. */
export function everyDay(h: History): DayTotals[] {
  const byDate = new Map(h.days.map((d) => [d.date, d.totals]))
  const out: DayTotals[] = []
  for (let d = h.from; d <= h.to; d = addDays(d, 1)) out.push({ date: d, totals: byDate.get(d) ?? null })
  return out
}

/** Days in a row with at least one meal, ending today. Today without meals yet doesn't break it. */
export function streak(days: DayTotals[]) {
  let i = days.length - 1
  if (i >= 0 && !days[i].totals) i--
  let n = 0
  while (i >= 0 && days[i].totals) {
    n++
    i--
  }
  return n
}

/** Within 10% of the calorie target, either way. */
export const onTarget = (calories: number, target: number) => target > 0 && Math.abs(calories - target) <= target * 0.1
