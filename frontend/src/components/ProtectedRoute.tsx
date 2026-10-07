import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { pendingInvite } from '../lib/format'

/** Shows the page only when logged in; otherwise sends the user to /login. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

/**
 * The opposite: login/signup pages bounce logged-in users to Today, or back to the
 * friend invite they opened before logging in.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    const invite = pendingInvite.get()
    return <Navigate to={invite ? `/invite/${invite}` : '/'} replace />
  }
  return children
}
