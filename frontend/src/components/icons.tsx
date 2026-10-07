import type { SVGProps } from 'react'

/** Stroke icons from the design mockups; they inherit color via currentColor. */
function Icon({ size = 22, strokeWidth = 1.8, children, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

type P = SVGProps<SVGSVGElement> & { size?: number }

export const BackIcon = (p: P) => <Icon strokeWidth={2} {...p}><path d="M15 5l-7 7 7 7" /></Icon>
export const ChevronIcon = (p: P) => <Icon size={20} strokeWidth={2} {...p}><path d="M9 5l7 7-7 7" /></Icon>
export const PlusIcon = (p: P) => <Icon size={24} strokeWidth={2.2} {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const MinusIcon = (p: P) => <Icon size={24} strokeWidth={2.2} {...p}><path d="M5 12h14" /></Icon>
export const CheckIcon = (p: P) => <Icon size={16} strokeWidth={2.4} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>
export const SearchIcon = (p: P) => <Icon size={18} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></Icon>
export const CameraIcon = (p: P) => (
  <Icon size={28} strokeWidth={1.6} {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Icon>
)
export const TrashIcon = (p: P) => (
  <Icon size={18} strokeWidth={1.6} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
  </Icon>
)
export const TodayIcon = (p: P) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Icon>
export const FoodsIcon = (p: P) => <Icon {...p}><path d="M7 4h10v16l-5-3.5L7 20z" /></Icon>
export const FriendsIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
    <circle cx="17" cy="9.5" r="2.5" /><path d="M16.5 14.5c2.2.2 3.6 1.6 4 4" />
  </Icon>
)
export const ProfileIcon = (p: P) => (
  <Icon {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></Icon>
)
