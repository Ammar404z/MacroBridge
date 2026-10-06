import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, getToken, setToken, type RegisterInput, type User } from '../api/client'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // True until we've checked whether a saved token is still valid
  const [loading, setLoading] = useState(() => getToken() !== null)

  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then(setUser)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    async login(email, password) {
      const res = await api.login(email, password)
      setToken(res.token)
      setUser(res.user)
    },
    async register(input) {
      const res = await api.register(input)
      setToken(res.token)
      setUser(res.user)
    },
    logout() {
      setToken(null)
      setUser(null)
    },
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
