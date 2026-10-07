import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { FoodsIcon, FriendsIcon, PlusIcon, ProfileIcon, TodayIcon } from './icons'

function Tab({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink to={to} end={to === '/'}
      className={({ isActive }) =>
        `flex h-14 flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'font-bold text-accent' : 'font-semibold text-muted hover:text-ink-2'}`}>
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

/** Today, Foods, centre Log button, Friends, Profile. Fixed to the bottom, above the safe area. */
export function TabBar() {
  return (
    <nav aria-label="Main"
      className="fixed inset-x-0 bottom-0 mx-auto grid max-w-lg grid-cols-5 items-center border-t border-surface-2 bg-bg px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <Tab to="/" label="Today" icon={<TodayIcon />} />
      <Tab to="/foods" label="Foods" icon={<FoodsIcon />} />
      <Link to="/log" aria-label="Log a meal"
        className="grid size-13 place-items-center justify-self-center rounded-full bg-accent text-on-accent hover:brightness-105">
        <PlusIcon />
      </Link>
      <Tab to="/friends" label="Friends" icon={<FriendsIcon />} />
      <Tab to="/profile" label="Profile" icon={<ProfileIcon />} />
    </nav>
  )
}
