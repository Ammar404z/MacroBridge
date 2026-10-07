import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { api, type Suggestion, type Suggestions } from '../api/client'
import { Card, Empty, ErrorMessage, FlowScreen, MacroStats, Pill, SectionTitle } from '../components/ui'
import { labelForNow, num, pcf } from '../lib/format'

export default function Suggest() {
  const navigate = useNavigate()
  const [ask, setAsk] = useState('')
  const [data, setData] = useState<Suggestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load(request?: string) {
    setError(null)
    setLoading(true)
    try {
      setData(await api.suggestMeals(request))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load ideas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.suggestMeals()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function refresh(e: FormEvent) {
    e.preventDefault()
    load(ask.trim() || undefined)
  }

  async function logIdea(s: Suggestion) {
    setLogging(s.name)
    try {
      await api.logMeal({
        description: s.name, calories: s.calories, protein: s.protein, carbs: s.carbs, fat: s.fat,
        mealLabel: labelForNow(), source: 'text',
      })
      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not log this')
      setLogging(null)
    }
  }

  return (
    <FlowScreen title="Meal ideas" back="/">
      {data && (
        <Card className="mt-3 flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-muted">Left today</div>
          <MacroStats macros={data.remaining} />
        </Card>
      )}

      <form onSubmit={refresh} className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="ask" className="text-[13px] font-semibold text-ink-2">Anything in mind? (optional)</label>
        <div className="flex gap-2">
          <input id="ask" type="text" maxLength={300} value={ask} onChange={(e) => setAsk(e.target.value)}
            placeholder="e.g. quick, no cooking"
            className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 text-base outline-none placeholder:text-muted/70 focus:border-accent" />
          <button type="submit" disabled={loading}
            className="h-12 rounded-xl border border-accent px-4 text-sm font-bold text-accent hover:bg-accent/10 disabled:opacity-60">
            New ideas
          </button>
        </div>
      </form>

      <section className="mt-5 flex flex-col gap-2">
        <ErrorMessage message={error} />
        {loading ? (
          <Empty>Thinking up meals that fit… this takes a few seconds.</Empty>
        ) : data && (
          <>
            <SectionTitle>{data.suggestions.length} ideas that fit</SectionTitle>
            {data.suggestions.map((s) => (
              <div key={s.name} className="flex flex-col gap-1 rounded-[14px] bg-surface pt-3.5 pr-2.5 pb-2.5 pl-3.5">
                <div className="text-[15px] font-bold">{s.name}</div>
                <div className="text-[13px] text-muted">{s.description}</div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <div className="text-[13px] text-ink-2">
                    <span className="font-bold text-ink">{num(s.calories)} kcal</span> · {pcf(s)}
                  </div>
                  <Pill onClick={() => logIdea(s)} disabled={logging !== null}>
                    {logging === s.name ? 'Logging…' : 'Log this'}
                  </Pill>
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </FlowScreen>
  )
}
