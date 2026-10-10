import type { LogInput, Macros, Meal, MealLabel } from '../api/client'
import { locale, t } from './i18n'

export const MEAL_LABELS: MealLabel[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function labelForNow(): MealLabel {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h >= 17 && h < 22) return 'dinner'
  return 'snack'
}

/** A logged meal as a new log entry (items and all), for the current time of day. */
export const relogInput = (m: Meal, logDate?: string): LogInput => ({
  description: m.description, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat,
  mealLabel: labelForNow(), source: m.source as LogInput['source'], items: m.items ?? undefined,
  confidence: m.confidence ?? undefined, aiNotes: m.aiNotes ?? undefined, logDate,
})

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** 1290 → "1,290"; grams keep at most one decimal. */
export const num = (n: number) => Math.round(n * 10) / 10 === Math.round(n)
  ? Math.round(n).toLocaleString(locale)
  : (Math.round(n * 10) / 10).toLocaleString(locale)

/** "P 22 · C 34 · F 22" */
export const pcf = (m: Macros) => t('P {p} · C {c} · F {f}', { p: num(m.protein), c: num(m.carbs), f: num(m.fat) })

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

/** "Jonas Klein" → "Jonas K."; single names stay as they are. */
export function shortName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/)
  return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first
}

const INVITE_KEY = 'macrobridge.invite'

/** An invite link opened while logged out; the invite page clears it once a logged-in user sees it. */
export const pendingInvite = {
  set: (code: string) => localStorage.setItem(INVITE_KEY, code),
  get: () => localStorage.getItem(INVITE_KEY),
  clear: () => localStorage.removeItem(INVITE_KEY),
}

/** The device's local date as YYYY-MM-DD. */
export const localToday = () => new Date().toLocaleDateString('en-CA')

/** "2026-10-07" + -1 → "2026-10-06" (calendar days, no timezone drift). */
export function addDays(date: string, days: number) {
  const d = new Date(date + 'T12:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

/** "Wednesday, Oct 7" */
export const longDate = (date: string) =>
  new Date(date + 'T12:00').toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })

/** "Tue, Oct 6" */
export const shortDate = (date: string) =>
  new Date(date + 'T12:00').toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })

/** "?date=2026-10-06" for a past day, "" for today, so links carry the day being viewed. */
export const dateQuery = (date: string | null) => (date ? `?date=${date}` : '')
