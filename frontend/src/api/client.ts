import { lang } from '../lib/i18n'

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

/** Fired when a saved login stops working (expired or account gone); useAuth logs out. */
export const LOGGED_OUT = 'macrobridge:logged-out'

/** Calls the backend and unwraps its { data, error } envelope. */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // The AI writes meal names and notes in this language
  const headers: Record<string, string> = { 'Accept-Language': lang }
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
  if (res.status === 401 && token) {
    setToken(null)
    window.dispatchEvent(new Event(LOGGED_OUT))
  }
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
  displayName?: string
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
  /** YYYY-MM-DD; omit for today */
  logDate?: string
  /** JPEG, see toJpegBase64(file, 800) */
  photoBase64?: string
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
  /** YYYY-MM-DD, the day it counts towards */
  logDate: string
  /** What the AI saw in it; null for manual entries and saved foods */
  items: MealItem[] | null
  hasPhoto: boolean
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
  shareMeals: boolean
  /** null without a picture; changes on every upload */
  avatarVersion: number | null
}
export type ProfileUpdate = Partial<Omit<Profile, 'avatarVersion'>>

/** Macros are per serving. */
export type Food = Macros & { id: string; name: string; servingLabel: string }
export type FoodInput = Macros & { name: string; servingLabel?: string }

export type Person = { id: string; name: string; avatarVersion: number | null }
/** totals/targets are null when the friend has turned sharing off */
export type Friend = Person & { sharing: boolean; totals: Macros | null; targets: Macros | null }
export type FeedMeal = Macros & {
  mealId: string
  userId: string
  name: string
  avatarVersion: number | null
  mealLabel: MealLabel
  description: string
  loggedAt: string
  items: MealItem[] | null
  hasPhoto: boolean
}
export type FriendsOverview = {
  inviteCode: string
  friends: Friend[]
  incoming: Person[]
  outgoing: Person[]
  feed: FeedMeal[]
}
export type FriendDay = Person & { sharing: boolean; day: Today | null }
export type Relation = 'self' | 'none' | 'requested' | 'incoming' | 'friends'
export type InvitePreview = { person: Person; relation: Relation }

export type Suggestion = Macros & { name: string; description: string }
export type Suggestions = { remaining: Macros; suggestions: Suggestion[] }

const imageCache = new Map<string, Promise<string>>()

/** Object URL for an image the API serves. <img> can't send the auth header, so it's fetched here and cached. */
function imageUrl(path: string): Promise<string> {
  let url = imageCache.get(path)
  if (!url) {
    url = fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => {
        if (!res.ok) throw new ApiError('No picture', res.status)
        return res.blob()
      })
      .then((blob) => URL.createObjectURL(blob))
    url.catch(() => imageCache.delete(path))
    imageCache.set(path, url)
  }
  return url
}

/** A user's picture, cached per version (a new upload gets a new version). */
export const avatarUrl = (userId: string, version: number) => imageUrl(`/avatars/${userId}?v=${version}`)

/** The photo a meal was logged with (it never changes). */
export const mealPhotoUrl = (mealId: string) => imageUrl(`/meals/${mealId}/photo`)

export const api = {
  register: (input: RegisterInput) => request<AuthResponse>('POST', '/auth/register', input),
  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { email, password }),
  me: () => request<User>('GET', '/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<null>('PUT', '/me/password', { currentPassword, newPassword }),
  analyzeMeal: (input: AnalyzeInput) => request<Analysis>('POST', '/meals/analyze', input),
  logMeal: (input: LogInput) => request<Meal>('POST', '/meals/log', input),
  today: () => request<Today>('GET', '/meals/today'),
  day: (date: string) => request<Today>('GET', `/meals/day/${date}`),
  history: (days = 30) => request<History>('GET', `/meals/history?days=${days}`),
  meal: (id: string) => request<Meal>('GET', `/meals/${id}`),
  editMeal: (id: string, input: EditMealInput) => request<Meal>('PUT', `/meals/${id}`, input),
  deleteMeal: (id: string) => request<null>('DELETE', `/meals/${id}`),
  suggestMeals: (ask?: string) => request<Suggestions>('POST', '/meals/suggest', { request: ask }),

  profile: () => request<Profile>('GET', '/profile'),
  updateProfile: (input: ProfileUpdate) => request<Profile>('PUT', '/profile', input),
  uploadAvatar: (imageBase64: string) => request<Profile>('PUT', '/profile/avatar', { imageBase64 }),
  deleteAvatar: () => request<Profile>('DELETE', '/profile/avatar'),

  friends: () => request<FriendsOverview>('GET', '/friends'),
  friendRequestCount: () => request<{ incoming: number }>('GET', '/friends/requests'),
  friend: (id: string) => request<FriendDay>('GET', `/friends/${id}`),
  acceptFriend: (id: string) => request<null>('POST', `/friends/${id}/accept`),
  removeFriend: (id: string) => request<null>('DELETE', `/friends/${id}`),
  invite: (code: string) => request<InvitePreview>('GET', `/invites/${code}`),
  sendInvite: (code: string) => request<{ relation: Relation }>('POST', `/invites/${code}`),

  foods: () => request<Food[]>('GET', '/foods'),
  createFood: (input: FoodInput) => request<Food>('POST', '/foods', input),
  updateFood: (id: string, input: FoodInput) => request<Food>('PUT', `/foods/${id}`, input),
  deleteFood: (id: string) => request<null>('DELETE', `/foods/${id}`),
  logFood: (id: string, servings: number, mealLabel?: MealLabel, logDate?: string) =>
    request<Meal>('POST', `/foods/${id}/log`, { servings, mealLabel, logDate }),
}
