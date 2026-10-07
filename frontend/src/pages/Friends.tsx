import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, type FeedMeal, type Friend, type FriendsOverview, type Person } from '../api/client'
import { Avatar } from '../components/Avatar'
import { CalorieRing } from '../components/CalorieRing'
import { FRIENDS_CHANGED } from '../components/TabBar'
import { PlusIcon } from '../components/icons'
import { Card, Empty, ErrorMessage, Loading, PageHeader, Pill, SectionTitle, TabScreen } from '../components/ui'
import { capitalize, labelForNow, num, pcf, shortName } from '../lib/format'

const share = (f: Friend) => (f.totals && f.targets && f.targets.calories > 0 ? f.totals.calories / f.targets.calories : null)

export default function Friends() {
  const [data, setData] = useState<FriendsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [logged, setLogged] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.friends().then(setData).catch((e) => setError(e.message))
  }, [])

  async function act(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      setData(await api.friends())
      window.dispatchEvent(new Event(FRIENDS_CHANGED))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  async function invite() {
    if (!data) return
    const url = `${window.location.origin}/invite/${data.inviteCode}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MacroBridge', text: 'Add me as a friend on MacroBridge', url })
      } else {
        await navigator.clipboard.writeText(url)
        setNotice('Invite link copied. Send it to a friend.')
      }
    } catch {
      // Share sheet dismissed
    }
  }

  async function logThis(m: FeedMeal) {
    setError(null)
    try {
      await api.logMeal({
        description: m.description, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat,
        mealLabel: labelForNow(), source: 'text',
      })
      setLogged((s) => new Set(s).add(m.mealId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not log this')
    }
  }

  const friends = data ? [...data.friends].sort((a, b) => (share(b) ?? -1) - (share(a) ?? -1)) : []

  return (
    <TabScreen>
      <PageHeader title="Friends" action={
        <Pill variant="outline" onClick={invite} disabled={!data}><PlusIcon size={18} /><span>Add</span></Pill>
      } />
      {notice && <p role="status" className="mt-2 text-[13px] text-accent">{notice}</p>}
      <ErrorMessage message={error} />
      {!data && !error && <Loading />}

      {data && data.incoming.length > 0 && (
        <section className="mt-4 flex flex-col gap-2">
          <SectionTitle>Friend requests</SectionTitle>
          {data.incoming.map((p) => (
            <PersonRow key={p.id} person={p} caption="Wants to be friends">
              <button type="button" onClick={() => act(() => api.removeFriend(p.id))}
                className="h-11 px-2 text-[13px] font-semibold text-muted hover:text-ink">Decline</button>
              <Pill onClick={() => act(() => api.acceptFriend(p.id))}>Accept</Pill>
            </PersonRow>
          ))}
        </section>
      )}

      {data && data.friends.length === 0 && (
        <Card className="mt-4 flex flex-col gap-3">
          <p className="text-sm leading-normal text-ink-2">
            Send your invite link to a friend. Once you're friends you'll see each other's day: calories, macros and meals.
          </p>
          <Pill onClick={invite}>Share my invite link</Pill>
        </Card>
      )}

      {friends.length > 0 && (
        <section className="mt-4 flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-muted">Today, share of calorie target eaten</div>
          <div className="grid grid-cols-4 gap-2">
            {friends.map((f) => {
              const pct = share(f)
              return (
                <Link key={f.id} to={`/friends/${f.id}`} className="flex min-w-0 flex-col items-center gap-1.5">
                  <CalorieRing value={f.totals?.calories ?? 0} target={f.targets?.calories ?? 0} size={56} radius={24} stroke={5}>
                    <Avatar id={f.id} name={f.name} version={f.avatarVersion} size={40} />
                  </CalorieRing>
                  <span className="max-w-full truncate text-[13px] font-semibold">{f.name.split(' ')[0]}</span>
                  <span className="text-xs text-muted">{pct == null ? 'Private' : `${Math.round(pct * 100)}%`}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {data && data.outgoing.length > 0 && (
        <section className="mt-5 flex flex-col gap-2">
          <SectionTitle>Sent requests</SectionTitle>
          {data.outgoing.map((p) => (
            <PersonRow key={p.id} person={p} caption="Waiting for them to accept">
              <button type="button" onClick={() => act(() => api.removeFriend(p.id))}
                className="h-11 px-2 text-[13px] font-semibold text-muted hover:text-ink">Cancel</button>
            </PersonRow>
          ))}
        </section>
      )}

      {data && data.friends.length > 0 && (
        <section className="mt-[22px] flex flex-col gap-2">
          <SectionTitle>Latest meals</SectionTitle>
          {data.feed.length === 0 && <Empty>No meals from friends in the last 24 hours.</Empty>}
          {data.feed.map((m) => (
            <div key={m.mealId} className="flex flex-col gap-1.5 rounded-[14px] bg-surface pt-3 pr-2.5 pb-3.5 pl-3.5">
              <div className="flex items-center gap-2.5">
                <Link to={`/friends/${m.userId}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar id={m.userId} name={m.name} version={m.avatarVersion} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-bold">{shortName(m.name)}</span>
                    <span className="text-xs text-muted">
                      {capitalize(m.mealLabel)} · {new Date(m.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </Link>
                <Pill onClick={() => logThis(m)} disabled={logged.has(m.mealId)}>
                  {logged.has(m.mealId) ? 'Logged' : 'Log this'}
                </Pill>
              </div>
              <div className="text-sm font-semibold">{m.description}</div>
              <div className="text-[13px] text-ink-2">
                <span className="font-bold text-ink">{num(m.calories)} kcal</span> · {pcf(m)}
              </div>
            </div>
          ))}
        </section>
      )}
    </TabScreen>
  )
}

function PersonRow({ person, caption, children }: { person: Person; caption: string; children: React.ReactNode }) {
  return (
    <div className="flex h-16 items-center gap-2.5 rounded-[14px] bg-surface pr-2.5 pl-3.5">
      <Avatar id={person.id} name={person.name} version={person.avatarVersion} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold">{person.name}</span>
        <span className="truncate text-xs text-muted">{caption}</span>
      </div>
      {children}
    </div>
  )
}
