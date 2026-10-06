import type { ReactNode } from 'react'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">
            M
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
      />
    </label>
  )
}

export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
    >
      {busy ? 'Please wait…' : children}
    </button>
  )
}
