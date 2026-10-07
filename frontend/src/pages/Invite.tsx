import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api, type InvitePreview } from '../api/client'
import { Avatar } from '../components/Avatar'
import { ErrorMessage, FlowScreen, PrimaryButton, TextButton } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { pendingInvite } from '../lib/format'
import { t } from '../lib/i18n'

/** /invite/:code, the link a friend shares. Logged-out visitors log in or sign up first, then come back here. */
export default function Invite() {
  const { code = '' } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    pendingInvite.clear()
    api.invite(code).then(setInvite).catch((e) => setError(e.message))
  }, [user, code])

  if (loading) return null

  if (!user) {
    const go = (path: string) => {
      pendingInvite.set(code)
      navigate(path)
    }
    return (
      <FlowScreen title={t('Friend invite')} back="/login" actions={<>
        <PrimaryButton type="button" onClick={() => go('/signup')}>{t('Create an account')}</PrimaryButton>
        <TextButton onClick={() => go('/login')}>{t('I already have an account')}</TextButton>
      </>}>
        <p className="mt-6 text-[15px] leading-normal text-ink-2">
          {t('A friend invited you to MacroBridge. Log in or create an account to add them.')}
        </p>
      </FlowScreen>
    )
  }

  async function send() {
    setError(null)
    setBusy(true)
    try {
      const { relation } = await api.sendInvite(code)
      setInvite((i) => i && { ...i, relation })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the request')
    } finally {
      setBusy(false)
    }
  }

  const p = invite?.person
  const text = {
    none: t("{name} invited you to be friends. You'll see each other's day once they accept.", { name: p?.name ?? '' }),
    incoming: t('{name} already sent you a request. Accept it to become friends.', { name: p?.name ?? '' }),
    requested: t("Request sent. You'll be friends as soon as {name} accepts.", { name: p?.name ?? '' }),
    friends: t('You and {name} are friends.', { name: p?.name ?? '' }),
    self: t('This is your own invite link. Send it to a friend from the Friends tab.'),
  }

  return (
    <FlowScreen title={t('Friend invite')} back="/friends" actions={invite && (
      invite.relation === 'none' || invite.relation === 'incoming'
        ? <PrimaryButton type="button" onClick={send} busy={busy}>
            {t(invite.relation === 'incoming' ? 'Accept request' : 'Send friend request')}
          </PrimaryButton>
        : <PrimaryButton to={invite.relation === 'friends' ? `/friends/${p!.id}` : '/friends'}>
            {invite.relation === 'friends' ? t("See {name}'s day", { name: p!.name.split(' ')[0] }) : t('Go to Friends')}
          </PrimaryButton>
    )}>
      <ErrorMessage message={error} />
      {invite && p && (
        <section className="mt-10 flex flex-col items-center gap-4 text-center">
          <Avatar id={p.id} name={p.name} version={invite.relation === 'none' ? null : p.avatarVersion} size={96} />
          <h2 className="text-2xl font-bold tracking-[-0.02em]">{p.name}</h2>
          <p className="max-w-xs text-[15px] leading-normal text-ink-2">{text[invite.relation]}</p>
        </section>
      )}
    </FlowScreen>
  )
}
