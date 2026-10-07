import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Macros, MealLabel } from '../api/client'
import { capitalize, MEAL_LABELS, num } from '../lib/format'
import { BackIcon } from './icons'
import { TabBar } from './TabBar'

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

/** Top-level pages (Today, Foods, Friends, Profile): content plus the tab bar. */
export function TabScreen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-[calc(84px+env(safe-area-inset-bottom))]">
      <main className="flex flex-col px-5 pt-4 pb-6">{children}</main>
      <TabBar />
    </div>
  )
}

/**
 * Focused flows (Log a meal, Edit food, ...): back arrow, no tab bar, actions pinned to the bottom.
 * `back` is a route, or a function for in-page steps.
 */
export function FlowScreen({ title, back, actions, children }: {
  title: string
  back: string | (() => void)
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <header className="-ml-3 flex h-11 items-center gap-1">
        <BackButton back={back} />
        <h1 className="text-xl font-bold tracking-[-0.02em]">{title}</h1>
      </header>
      {children}
      {actions && <div className="mt-auto flex flex-col gap-0.5 pt-6">{actions}</div>}
    </div>
  )
}

function BackButton({ back }: { back: string | (() => void) }) {
  const navigate = useNavigate()
  return (
    <button type="button" aria-label="Back" onClick={() => (typeof back === 'string' ? navigate(back) : back())}
      className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface">
      <BackIcon />
    </button>
  )
}

/** Title row for tab pages, with an optional subtitle and right-hand action. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex min-h-11 items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl leading-tight font-bold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-0.5 text-sm font-bold">{children}</h2>
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

const primary =
  'flex h-13 w-full items-center justify-center rounded-full bg-accent px-6 text-base font-bold text-on-accent ' +
  'transition hover:brightness-105 active:brightness-95 disabled:opacity-60'

/** 52px accent button. Renders a link when `to` is given. */
export function PrimaryButton({ to, busy, busyLabel, children, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: string; busy?: boolean; busyLabel?: string }) {
  if (to) return <Link to={to} className={primary}>{children}</Link>
  return (
    <button type="submit" disabled={busy || props.disabled} {...props} className={primary}>
      {busy ? busyLabel ?? 'Please wait…' : children}
    </button>
  )
}

/** 44px text-only secondary action under a primary button ("Start over", "Log out"). */
export function TextButton({ to, danger, children, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: string; danger?: boolean }) {
  const cls = `flex h-11 w-full items-center justify-center text-sm font-semibold ${danger ? 'text-danger' : 'text-ink-2'} hover:text-ink disabled:opacity-60`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  return <button type="button" {...props} className={cls}>{children}</button>
}

/**
 * 44px rounded pill ("Log", "Log this", "Add"). `filled` is surface-2 with accent text,
 * `outline` is an accent border.
 */
export function Pill({ to, variant = 'filled', children, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: string; variant?: 'filled' | 'outline' }) {
  const cls =
    'flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold text-accent disabled:opacity-60 ' +
    (variant === 'filled' ? 'bg-surface-2 hover:bg-line' : 'border border-accent text-sm hover:bg-accent/10')
  if (to) return <Link to={to} className={cls}>{children}</Link>
  return <button type="button" {...props} className={cls}>{children}</button>
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const inputCls =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-base text-ink outline-none ' +
  'placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25'

/** Labelled input. `numeric` uses the bold 17px style the design gives macro fields. */
export function Field({ label, hint, numeric, className, ...props }:
  InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; numeric?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-2">{label}</span>
      <input
        {...(numeric ? { type: 'number', inputMode: 'decimal' as const, min: 0 } : {})}
        {...props}
        className={`${inputCls} h-12 ${numeric ? 'text-[17px] font-bold' : 'font-medium'} ${className ?? ''}`}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function TextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-ink-2">{label}</span>
      <textarea {...props} className={`${inputCls} resize-none rounded-[14px] p-3.5 leading-snug`} />
    </label>
  )
}

export const selectCls = `${inputCls} h-12 font-medium`

/** Breakfast / Lunch / Dinner / Snack, selected one in accent. */
export function MealSegment({ value, onChange }: { value: MealLabel; onChange: (v: MealLabel) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[13px] font-semibold text-ink-2">Meal</div>
      <div className="grid grid-cols-4 gap-1.5">
        {MEAL_LABELS.map((l) => {
          const on = l === value
          return (
            <button key={l} type="button" aria-pressed={on} onClick={() => onChange(l)}
              className={`h-11 rounded-xl border text-[13px] ${on
                ? 'border-accent bg-accent font-bold text-on-accent'
                : 'border-line bg-surface font-semibold text-ink-2 hover:text-ink'}`}>
              {capitalize(l)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Accent-coloured native checkbox in a 48px row. */
export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex h-12 items-center gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="m-0 size-[22px] accent-accent" />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-[14px] bg-surface p-3.5 ${className ?? ''}`}>{children}</section>
}

/** Label, "value / target g" and a neutral 4px bar. */
export function MacroTile({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="flex flex-col gap-2 rounded-[14px] bg-surface px-3.5 py-3">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="flex items-baseline gap-1">
        <div className="text-[22px] leading-none font-bold tracking-[-0.02em]">{num(value)}</div>
        <div className="text-xs text-muted">/ {num(target)} g</div>
      </div>
      <div className="h-1 overflow-hidden rounded-sm bg-line">
        <div className="h-1 rounded-sm bg-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** The three macro tiles under a calorie ring. */
export function MacroTiles({ totals, targets }: { totals: Macros; targets: Macros }) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <MacroTile label="Protein" value={totals.protein} target={targets.protein} />
      <MacroTile label="Carbs" value={totals.carbs} target={targets.carbs} />
      <MacroTile label="Fat" value={totals.fat} target={targets.fat} />
    </section>
  )
}

/** kcal (accent) + protein/carbs/fat in a 4-column row: "Left today", "This adds". */
export function MacroStats({ macros }: { macros: Macros }) {
  const stats = [
    { value: num(macros.calories), unit: 'kcal', accent: true },
    { value: `${num(macros.protein)} g`, unit: 'protein' },
    { value: `${num(macros.carbs)} g`, unit: 'carbs' },
    { value: `${num(macros.fat)} g`, unit: 'fat' },
  ]
  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s) => (
        <div key={s.unit} className="flex flex-col gap-1">
          <div className={`text-xl leading-none font-bold ${s.accent ? 'text-accent' : ''}`}>{s.value}</div>
          <div className="text-xs text-muted">{s.unit}</div>
        </div>
      ))}
    </div>
  )
}

export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{message}</p>
}

/** Placeholder for empty lists and not-yet-loaded content. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[14px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  )
}
