import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, type Food } from '../api/client'
import { PlusIcon, SearchIcon } from '../components/icons'
import { Empty, ErrorMessage, PageHeader, Pill, TabScreen } from '../components/ui'
import { num, pcf } from '../lib/format'

export default function Foods() {
  const [foods, setFoods] = useState<Food[] | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.foods().then(setFoods).catch((e) => setError(e.message))
  }, [])

  // No search endpoint; the list is small enough to filter here
  const q = query.trim().toLowerCase()
  const shown = foods?.filter((f) => f.name.toLowerCase().includes(q)) ?? []

  return (
    <TabScreen>
      <PageHeader title="My foods" action={
        <Pill to="/foods/new" variant="outline"><PlusIcon size={18} /><span>Add</span></Pill>
      } />

      <label className="relative mt-3 flex items-center">
        <SearchIcon className="pointer-events-none absolute left-3.5 text-muted" />
        <input type="search" aria-label="Search my foods" placeholder="Search my foods" value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-line bg-surface pr-3.5 pl-10.5 text-base outline-none placeholder:text-muted/70 focus:border-accent" />
      </label>

      <section className="mt-3.5 flex flex-col gap-2">
        <ErrorMessage message={error} />
        {foods && foods.length === 0 && (
          <Empty>Save the meals you eat often, then log them again in two taps.</Empty>
        )}
        {foods && foods.length > 0 && shown.length === 0 && <Empty>No foods match "{query}".</Empty>}
        {shown.map((f) => (
          <div key={f.id} className="flex h-16 items-center gap-2 rounded-[14px] bg-surface pr-2.5 pl-3.5">
            <Link to={`/foods/${f.id}`} className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-sm font-semibold">{f.name}</span>
              <span className="truncate text-xs text-muted">{f.servingLabel} · {num(f.calories)} kcal · {pcf(f)}</span>
            </Link>
            <Pill to={`/foods/${f.id}/log`}>Log</Pill>
          </div>
        ))}
      </section>
    </TabScreen>
  )
}
