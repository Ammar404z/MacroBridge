import type { ReactNode } from 'react'

function LogoMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" role="img" aria-label="MacroBridge">
      <rect width="64" height="64" rx="18" fill="var(--color-surface)" />
      <circle cx="32" cy="32" r="17" stroke="var(--color-line)" strokeWidth="7" />
      <circle cx="32" cy="32" r="17" stroke="var(--color-accent)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray="74.77 106.81" transform="rotate(-90 32 32)" />
    </svg>
  )
}

/** Login and signup: logo, title, form, and a switch link pinned to the bottom. */
export function AuthLayout({ title, subtitle, footer, children }: {
  title: string
  subtitle: ReactNode
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
      <section className="mt-[max(48px,12vh)] flex flex-col items-start gap-5">
        <LogoMark />
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.03em]">{title}</h1>
          <p className="text-[15px] leading-normal text-muted">{subtitle}</p>
        </div>
      </section>
      <div className="mt-10">{children}</div>
      <div className="mt-auto flex h-11 items-center justify-center gap-1.5 pt-8 text-sm text-muted">{footer}</div>
    </div>
  )
}
