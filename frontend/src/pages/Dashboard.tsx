import { useAuth } from '../hooks/useAuth'

/** Placeholder until Phase 2 adds macro bars and the meal log. */
export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 font-bold text-white">M</div>
          <span className="text-lg font-semibold">MacroBridge</span>
        </div>
        <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-200">
          Log out
        </button>
      </header>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">Logged in as</p>
        <p className="text-lg font-medium">{user?.email}</p>
        <p className="mt-4 text-sm text-stone-500">
          Your dashboard with today's macros and meal logging arrives in Phase 2.
        </p>
      </div>
    </div>
  )
}
