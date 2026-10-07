import type { ReactNode } from 'react'

/**
 * Progress ring: surface-2 track, accent arc with round caps, starting at 12 o'clock.
 * The arc is capped at 100% when over target. Sizes from the design: Today 180/78/12,
 * friend profile 120/52/10, friend avatar 56/24/5.
 */
export function CalorieRing({ value, target, size = 180, radius = 78, stroke = 12, label, children }: {
  value: number
  target: number
  size?: number
  radius?: number
  stroke?: number
  label?: string
  children?: ReactNode
}) {
  const c = size / 2
  const circumference = 2 * Math.PI * radius
  const fraction = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
        role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <circle cx={c} cy={c} r={radius} stroke="var(--color-surface-2)" strokeWidth={stroke} />
        {fraction > 0 && (
          <circle cx={c} cy={c} r={radius} stroke="var(--color-accent)" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${fraction * circumference} ${circumference}`} transform={`rotate(-90 ${c} ${c})`} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
