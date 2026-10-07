import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api, type FriendDay } from '../api/client'
import { Avatar } from '../components/Avatar'
import { CalorieRing } from '../components/CalorieRing'
import { CheckIcon } from '../components/icons'
import { Card, Empty, ErrorMessage, Loading, MacroTiles, PageHeader, SectionTitle, TabScreen } from '../components/ui'
import { capitalize, num, pcf, shortName } from '../lib/format'

export default function FriendProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [friend, setFriend] = useState<FriendDay | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) api.friend(id).then(setFriend).catch((e) => setError(e.message))
  }, [id])

  async function unfriend() {
    if (!friend || !confirm(`Remove ${friend.name} as a friend? You'll stop seeing each other's meals.`)) return
    try {
      await api.removeFriend(friend.id)
      navigate('/friends', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove friend')
    }
  }

  const day = friend?.day
  const left = day ? day.targets.calories - day.totals.calories : 0

  return (
    <TabScreen>
      <PageHeader title={friend ? shortName(friend.name) : ''} back="/friends" />
      <ErrorMessage message={error} />
      {!friend && !error && <Loading />}
      {friend && (
        <>
          <section className="mt-4 flex items-center gap-5">
            {day ? (
              <CalorieRing value={day.totals.calories} target={day.targets.calories} size={120} radius={52} stroke={10}
                label={`${num(day.totals.calories)} of ${num(day.targets.calories)} kcal eaten`}>
                <div className="text-[28px] leading-none font-bold tracking-[-0.03em]">{num(Math.abs(left))}</div>
                <div className="mt-0.5 text-xs text-muted">{left < 0 ? 'kcal over' : 'kcal left'}</div>
              </CalorieRing>
            ) : (
              <Avatar id={friend.id} name={friend.name} version={friend.avatarVersion} size={120} />
            )}
            <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
              <div className="flex items-center gap-2.5">
                {day && <Avatar id={friend.id} name={friend.name} version={friend.avatarVersion} size={36} />}
                <div className="flex flex-col gap-0.5">
                  <div className="text-xs font-semibold text-muted">Today</div>
                  <div className="text-[15px] font-bold">
                    {day ? `${num(day.totals.calories)} of ${num(day.targets.calories)} kcal` : 'Not sharing'}
                  </div>
                </div>
              </div>
              <button type="button" onClick={unfriend} aria-label={`Friends with ${friend.name}. Tap to remove.`}
                className="flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface pr-4 pl-3 text-[13px] font-bold hover:border-danger/60">
                <CheckIcon className="text-accent" />
                <span>Friends</span>
              </button>
            </div>
          </section>

          {day ? (
            <>
              <div className="mt-5"><MacroTiles totals={day.totals} targets={day.targets} /></div>
              <section className="mt-[22px] flex flex-col gap-2">
                <SectionTitle>Today's meals</SectionTitle>
                {day.logs.length === 0 && <Empty>Nothing logged yet today.</Empty>}
                {day.logs.map((m) => (
                  <div key={m.id} className="flex h-14 items-center gap-3 rounded-[14px] bg-surface px-3.5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="truncate text-sm font-semibold">{m.description}</div>
                      <div className="text-xs text-muted">{capitalize(m.mealLabel)} · {pcf(m)}</div>
                    </div>
                    <div className="text-[15px] font-bold">{num(m.calories)}</div>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <Card className="mt-5 text-sm text-ink-2">{friend.name} has turned off meal sharing.</Card>
          )}
        </>
      )}
    </TabScreen>
  )
}
