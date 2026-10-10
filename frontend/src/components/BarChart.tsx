import { useState } from 'react'
import { num, shortDate } from '../lib/format'
import { t } from '../lib/i18n'

/**
 * One bar per day against a dashed target line. Plain HTML so bars stay crisp at any width;
 * tap or hover a day to read its value in the header.
 */
export function BarChart({ title, unit, target, days }: {
  title: string
  unit: string
  target: number
  days: { date: string; value: number | null }[]
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const max = Math.max(target * 1.25, ...days.map((d) => d.value ?? 0)) || 1
  const shown = picked == null ? null : days[picked]
  const pct = (v: number) => `${(v / max) * 100}%`

  return (
    <section className="flex flex-col gap-3 rounded-[14px] bg-surface p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">{title}</h2>
        <div role="status" className="text-xs text-muted">
          {shown
            ? <><span className="font-semibold text-ink">{shown.value == null ? t('Nothing logged') : `${num(shown.value)} ${unit}`}</span> · {shortDate(shown.date)}</>
            : t('Target {n}', { n: `${num(target)} ${unit}` })}
        </div>
      </div>

      <div className="relative h-32" onPointerLeave={() => setPicked(null)}>
        {target > 0 && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted/70"
            style={{ bottom: pct(target) }} />
        )}
        <div className="flex h-full items-end gap-[2px]">
          {days.map((d, i) => (
            <button key={d.date} type="button"
              aria-label={`${shortDate(d.date)}: ${d.value == null ? t('Nothing logged') : `${num(d.value)} ${unit}`}`}
              onPointerEnter={() => setPicked(i)} onFocus={() => setPicked(i)} onClick={() => setPicked(i)}
              className="flex h-full min-w-0 flex-1 items-end rounded-sm outline-accent focus-visible:outline-2">
              {d.value != null && d.value > 0 && (
                <span className={`w-full rounded-t-[4px] bg-accent transition-opacity ${picked != null && picked !== i ? 'opacity-40' : ''}`}
                  style={{ height: pct(d.value) }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div aria-hidden className="flex justify-between text-xs text-muted">
        <span>{shortDate(days[0].date)}</span>
        <span>{t('Today')}</span>
      </div>
    </section>
  )
}
