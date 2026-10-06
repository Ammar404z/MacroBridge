const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const TOKEN_KEY = 'macrobridge.token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Calls the backend and unwraps its { data, error } envelope. */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0)
  }

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(json?.error ?? `Request failed (${res.status})`, res.status)
  }
  return json.data as T
}

export type User = { id: string; email: string }
export type AuthResponse = { token: string; user: User }

export type RegisterInput = {
  email: string
  password: string
  timezone?: string
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
}

export const api = {
  register: (input: RegisterInput) => request<AuthResponse>('POST', '/auth/register', input),
  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { email, password }),
  me: () => request<User>('GET', '/me'),
}
