import type { Macros, MealLabel } from '../api/client'

export const MEAL_LABELS: MealLabel[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function labelForNow(): MealLabel {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h >= 17 && h < 22) return 'dinner'
  return 'snack'
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** 1290 → "1,290"; grams keep at most one decimal. */
export const num = (n: number) => Math.round(n * 10) / 10 === Math.round(n)
  ? Math.round(n).toLocaleString('en-US')
  : (Math.round(n * 10) / 10).toLocaleString('en-US')

/** "P 22 · C 34 · F 22" */
export const pcf = (m: Macros) => `P ${num(m.protein)} · C ${num(m.carbs)} · F ${num(m.fat)}`

/** Calories implied by the macros (4/4/9 kcal per gram). */
export const kcalFromMacros = (m: Pick<Macros, 'protein' | 'carbs' | 'fat'>) =>
  Math.round(m.protein * 4 + m.carbs * 4 + m.fat * 9)

export const scale = (m: Macros, factor: number): Macros => ({
  calories: Math.round(m.calories * factor),
  protein: Math.round(m.protein * factor * 10) / 10,
  carbs: Math.round(m.carbs * factor * 10) / 10,
  fat: Math.round(m.fat * factor * 10) / 10,
})

/** First letters of the first two words: "Jonas Klein" → "JK". */
export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
