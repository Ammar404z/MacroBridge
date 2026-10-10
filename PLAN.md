# MacroBridge — Build Plan

## Stack
| Layer | Tech | Hosting |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 | Vercel (free), https://macro-bridge.vercel.app |
| Backend | Java 21, Spring Boot 4 | Google Cloud Run (free trial / free tier), `europe-west1` |
| Database | PostgreSQL | Supabase (free, Frankfurt) |
| AI | Gemini 3.5 Flash-Lite (vision) | Called from Spring Boot |
| Auth | Spring Security + JWT | Self-hosted in Spring Boot |
| PWA | Static manifest + icons in `frontend/public` (no plugin) | — |

---

## Folder Structure
```
MacroBridge/
├── backend/                 ← Spring Boot API (Dockerfile for Cloud Run)
│   └── src/main/java/com/macrobridge/
│       ├── auth/            ← register, login, JWT, change password
│       ├── meal/            ← analyze, log, day/history, edit, suggest
│       ├── food/            ← my foods + logging them by servings
│       ├── friend/          ← invites, requests, friends' days, feed, avatars endpoint
│       ├── profile/         ← targets, timezone, sharing switch, profile pictures
│       ├── gemini/          ← Gemini client + per-user daily AI cap
│       ├── config/          ← security, CORS
│       └── common/          ← { data, error } envelope, errors, timezones
├── frontend/                ← React + Vite PWA (vercel.json, manifest + icons in public/)
│   └── src/
│       ├── pages/           ← Today, LogMeal, EditMeal, Suggest, Foods, FoodLog, FoodEdit,
│       │                      Friends, FriendProfile, Invite, Profile, ChangePassword, Login, Signup
│       ├── components/      ← ui.tsx (shared pieces), TabBar, CalorieRing, Avatar, icons
│       ├── api/client.ts    ← all calls to the backend
│       ├── hooks/useAuth.tsx
│       └── lib/             ← formatting, dates, image resizing
├── supabase/migrations/     ← schema, applied in order
└── design/                  ← DESIGN.md + HTML mockups
```

---

## Database (fresh Supabase PostgreSQL schema)
Schema lives in `supabase/migrations/` (init, hardening, friends_and_avatars, ai_usage).

- `users` — email + BCrypt password hash (our own auth, not Supabase Auth)
- `profiles` — one row per user: macro targets + timezone (defines "today")
- `meals` — confirmed log entries: macros, `log_date`, meal label, source, Gemini item breakdown (`jsonb`), confidence, notes
- `custom_foods` — personal food/recipe library, macros per serving
- `friendships` — one row per pair, `pending` until the addressee accepts (deleting = decline/cancel/unfriend)
- `avatars` — profile pictures as small JPEGs (`bytea`)
- `ai_usage` — AI calls per user per day, for the daily cap
- `profiles` also holds `share_meals` and the personal `invite_code`
- `pantry_items` — deferred to Phase 4, added in its own migration then

Spring Boot connects via JDBC as the `postgres` role (no Supabase SDK needed — just plain Postgres).
RLS is enabled with no policies on every table, so the public Supabase Data API can't touch the data.

---

## Build Order

### Phase 1 — Foundation (Session 1)
- [x] Scaffold Spring Boot project (Maven)
- [x] Connect to Supabase PostgreSQL via JDBC
- [x] Auth endpoints: POST /auth/register, POST /auth/login → returns JWT
- [x] JWT filter (validates token on every request)
- [x] Scaffold React + Vite + Tailwind frontend
- [x] Login + Signup pages wired to backend
- [x] Protected route logic (redirect to login if no token)

### Phase 2 — Core Loop (Session 2)
- [x] POST /meals/analyze — takes text or image, calls Gemini, returns macros
- [x] POST /meals/log — saves confirmed meal to DB
- [x] GET /meals/today — returns today's logs + totals
- [x] DELETE /meals/{id} — remove a log entry
- [x] Dashboard page (macro bars, today's log list)
- [x] Log Meal page (type or photo → AI result → confirm/edit → save)

### Phase 3 — Polish (Session 3)
- [x] Profile API: GET/PUT /api/profile
- [x] Custom food library API: /api/foods CRUD + POST /api/foods/{id}/log with servings
- [x] Meal suggestions API: POST /api/meals/suggest
- [x] PWA setup (installable on iPhone home screen: manifest, icons, full-screen status bar)
- [x] Deploy backend (Google Cloud Run instead of Railway: Railway no longer has a usable free tier for Java)
- [x] Deploy frontend to Vercel

### Phase 3.5 — Design + real use (done)
- [x] "Instrument" dark design from `design/` on every screen, with the 5-tab bar
- [x] My foods, Log a food (servings), Edit food, Meal ideas, Profile screens
- [x] Photo + text analysis combine; AI meal title as the default description
- [x] Friends: invite links, mutual requests, rings, 24h feed with "Log this", friend day view, sharing switch, request badge
- [x] Profile pictures, display name at signup, change password, logout confirmation
- [x] Past days (‹ › on Today), adding to a past day, editing/moving a logged meal
- [x] 90-day logins, automatic logout when a login stops working, loading states
- [x] Per-user daily AI cap; Gemini Flash-Lite for the free tier's ~500 requests/day

### Next up
- [x] **Test environment**: local Supabase (`supabase start`) for development, so testing doesn't touch live data
- [x] Automatic backend deploys on push (GitHub Actions)
- [ ] History chart (calories per day over 30 days; `GET /api/meals/history` already exists)
- [ ] Delete account
- [ ] Forgot password by email (needs an email service)
- [ ] Meal type on past days defaults to the current time of day; pick a smarter default

### Phase 4 — Scale (Future)
- [ ] Custom domain
- [ ] Pantry memory (receipt scanner)
- [ ] Training day vs rest day toggle
- [ ] Restaurant menu analyzer

---

## API Contract (Spring Boot endpoints)

### Auth
```
POST /api/auth/register   { email, password, displayName?, timezone?, targetCalories?, targetProtein?, targetCarbs?, targetFat? } → { token, user }
POST /api/auth/login      { email, password } → { token, user }
GET  /api/me              → { id, email }   (requires token)
PUT  /api/me/password     { currentPassword, newPassword }
```

### Meals
```
POST /api/meals/analyze   { description?, imageBase64?, mimeType? } → { items, totals, title, confidence, notes }
                          (analyze + suggest share a per-user daily cap, AI_DAILY_LIMIT, default 50 → 429)
                          (photo + text combine: text adds items the photo doesn't show and clarifies what it does)
POST /api/meals/log       { description, calories, protein, carbs, fat, mealLabel, confidence, aiNotes, items?, logDate?, photoBase64? }  (logDate: a past day; default today; photo: JPEG ≤ 800 px)
GET  /api/meals/today     → { date, logs[], totals, targets }
GET  /api/meals/day/{date} → same shape, for any day (YYYY-MM-DD)
GET  /api/meals/history?days=30 → { from, to, targets, days[{ date, meals, totals }] }  (days with meals only)
GET  /api/meals/{id}      → meal (incl. logDate, items, hasPhoto)
GET  /api/meals/{id}/photo → image/jpeg   (yours, or a friend's who shares meals)
PUT  /api/meals/{id}      { description, calories, protein, carbs, fat, mealLabel?, logDate? }  (logDate can't be in the future)
DELETE /api/meals/{id}
```

### Profile
```
GET  /api/profile
PUT  /api/profile         { displayName?, timezone?, targetCalories?, targetProtein?, targetCarbs?, targetFat?, shareMeals? }  (only sent fields change)
```

### My foods (macros per serving)
```
GET    /api/foods
POST   /api/foods            { name, servingLabel?, calories, protein, carbs, fat }   (409 on duplicate name)
PUT    /api/foods/{id}       same body
DELETE /api/foods/{id}       (past meals keep their macros)
POST   /api/foods/{id}/log   { servings, mealLabel?, logDate? } → meal, macros scaled by servings
```

### Friends (mutual: request via invite link, then accept)
```
GET    /api/friends            → { inviteCode, friends[{ id, name, avatarVersion, sharing, totals, targets }],
                                   incoming[], outgoing[], feed[last 24h of friends' meals] }
GET    /api/friends/requests   → { incoming }   (badge count on the Friends tab)
GET    /api/friends/{id}       → { id, name, avatarVersion, sharing, day }   (accepted friends only)
POST   /api/friends/{id}/accept
DELETE /api/friends/{id}       (decline, cancel, or unfriend)
GET    /api/invites/{code}     → { person, relation: self|none|requested|incoming|friends }
POST   /api/invites/{code}     → send a request (accepts instead if they already asked you)
```
Invite links look like `/invite/<code>`. Friends see each other's whole day unless `shareMeals` is off.

### Profile pictures
```
PUT    /api/profile/avatar   { imageBase64 }   (256 px square JPEG, made by the frontend)
DELETE /api/profile/avatar
GET    /api/avatars/{userId}?v=<avatarVersion>  → image/jpeg   (yourself, friends, and pending requests only)
```

### Suggestions
```
POST /api/meals/suggest   { request? } → { remaining, suggestions[{ name, description, calories, protein, carbs, fat }] }
```

---

## Key Decisions
- JWT stored in localStorage on frontend, sent as `Authorization: Bearer <token>` header
- Gemini called server-side only — API key never touches the frontend
- CORS configured in Spring Boot to allow requests from the Vercel domain
- Images sent as base64 strings in the request body (no file upload server needed)
- All responses use standard `{ data, error }` envelope
- Logins last 90 days; any 401 from the API logs the app out
- Friends are mutual and opt-in (invite link → request → accept); sharing is on by default and can be turned off
- Profile pictures live in Postgres (no file storage service) and are only served to yourself, friends and pending requests
- Meal ideas are single meals sized to roughly a third to a half of what's left, not a plan for the rest of the day
- Secrets only in `.env` locally and in Cloud Run settings in production; the live app has its own `JWT_SECRET`

---

## Deployment
See the README's "Deploy" section: Vercel redeploys the frontend on every push; the backend is redeployed with
`gcloud run deploy macrobridge-api --source backend --region europe-west1 --quiet`.
