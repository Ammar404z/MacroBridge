import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { api } from '../api/client'
import { FoodsIcon, FriendsIcon, PlusIcon, ProfileIcon, TodayIcon } from './icons'

function Tab({ to, label, icon, badge = 0 }: { to: string; label: string; icon: ReactNode; badge?: number }) {
  return (
    <NavLink to={to} end={to === '/'} aria-label={badge ? `${label}, ${badge} new` : undefined}
      className={({ isActive }) =>
        `flex h-14 flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'font-bold text-accent' : 'font-semibold text-muted hover:text-ink-2'}`}>
      <span className="relative">
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-on-accent">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </NavLink>
  )
}

/** Fired after accepting or declining a request, so the badge updates without a page change. */
export const FRIENDS_CHANGED = 'macrobridge:friends-changed'

/** Incoming friend requests, refreshed on every page change and on FRIENDS_CHANGED. */
function useRequestCount() {
  const { pathname } = useLocation()
  const [count, setCount] = useState(0)
  useEffect(() => {
    const load = () => api.friendRequestCount().then((r) => setCount(r.incoming)).catch(() => {})
    load()
    window.addEventListener(FRIENDS_CHANGED, load)
    return () => window.removeEventListener(FRIENDS_CHANGED, load)
  }, [pathname])
  return count
}

/** Today, Foods, centre Log button, Friends, Profile. Fixed to the bottom, above the safe area. */
export function TabBar() {
  const requests = useRequestCount()
  return (
    <nav aria-label="Main"
      className="fixed inset-x-0 bottom-0 mx-auto grid max-w-lg grid-cols-5 items-center border-t border-surface-2 bg-bg px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <Tab to="/" label="Today" icon={<TodayIcon />} />
      <Tab to="/foods" label="Foods" icon={<FoodsIcon />} />
      <Link to="/log" aria-label="Log a meal"
        className="grid size-13 place-items-center justify-self-center rounded-full bg-accent text-on-accent hover:brightness-105">
        <PlusIcon />
      </Link>
      <Tab to="/friends" label="Friends" icon={<FriendsIcon />} badge={requests} />
      <Tab to="/profile" label="Profile" icon={<ProfileIcon />} />
    </nav>
  )
}
