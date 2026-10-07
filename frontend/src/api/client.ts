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

export type Macros = { calories: number; protein: number; carbs: number; fat: number }
export type MealLabel = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Confidence = 'low' | 'medium' | 'high'
export type MealItem = Macros & { name: string; portion: string }

export type AnalyzeInput = { description?: string; imageBase64?: string; mimeType?: string }
export type Analysis = { items: MealItem[]; totals: Macros; title: string; confidence: Confidence; notes: string }

export type LogInput = Macros & {
  description: string
  mealLabel: MealLabel
  source: 'text' | 'photo' | 'manual'
  items?: MealItem[]
  confidence?: Confidence
  aiNotes?: string
}

export type Meal = Macros & {
  id: string
  mealLabel: MealLabel
  description: string
  source: string
  servings: number
  customFoodId: string | null
  confidence: Confidence | null
  aiNotes: string | null
  loggedAt: string
}

export type Today = { date: string; logs: Meal[]; totals: Macros; targets: Macros }

/** logDate (YYYY-MM-DD) is optional and moves the meal to another day. */
export type EditMealInput = Macros & { description: string; mealLabel?: MealLabel; logDate?: string }
export type DaySummary = { date: string; meals: number; totals: Macros }
export type History = { from: string; to: string; targets: Macros; days: DaySummary[] }

export type Profile = {
  displayName: string | null
  timezone: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
}

/** Macros are per serving. */
export type Food = Macros & { id: string; name: string; servingLabel: string }
export type FoodInput = Macros & { name: string; servingLabel?: string }

export type Suggestion = Macros & { name: string; description: string }
export type Suggestions = { remaining: Macros; suggestions: Suggestion[] }

export const api = {
  register: (input: RegisterInput) => request<AuthResponse>('POST', '/auth/register', input),
  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { email, password }),
  me: () => request<User>('GET', '/me'),
  analyzeMeal: (input: AnalyzeInput) => request<Analysis>('POST', '/meals/analyze', input),
  logMeal: (input: LogInput) => request<Meal>('POST', '/meals/log', input),
  today: () => request<Today>('GET', '/meals/today'),
  day: (date: string) => request<Today>('GET', `/meals/day/${date}`),
  history: (days = 30) => request<History>('GET', `/meals/history?days=${days}`),
  editMeal: (id: string, input: EditMealInput) => request<Meal>('PUT', `/meals/${id}`, input),
  deleteMeal: (id: string) => request<null>('DELETE', `/meals/${id}`),
  suggestMeals: (ask?: string) => request<Suggestions>('POST', '/meals/suggest', { request: ask }),

  profile: () => request<Profile>('GET', '/profile'),
  updateProfile: (input: Partial<Profile>) => request<Profile>('PUT', '/profile', input),

  foods: () => request<Food[]>('GET', '/foods'),
  createFood: (input: FoodInput) => request<Food>('POST', '/foods', input),
  updateFood: (id: string, input: FoodInput) => request<Food>('PUT', `/foods/${id}`, input),
  deleteFood: (id: string) => request<null>('DELETE', `/foods/${id}`),
  logFood: (id: string, servings: number, mealLabel?: MealLabel) =>
    request<Meal>('POST', `/foods/${id}/log`, { servings, mealLabel }),
}
