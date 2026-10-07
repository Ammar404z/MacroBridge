# MacroBridge — Build Plan

## Stack
| Layer | Tech | Hosting |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Vercel (free) |
| Backend | Java Spring Boot | Railway (free) |
| Database | PostgreSQL | Supabase (free, new project) |
| AI | Gemini 3.5 Flash (vision) | Called from Spring Boot |
| Auth | Spring Security + JWT | Self-hosted in Spring Boot |
| PWA | Vite PWA plugin | — |

---

## Folder Structure
```
MacroBridge/
├── backend/          ← Spring Boot project
│   └── src/
│       └── main/
│           ├── java/com/macrobridge/
│           │   ├── auth/         ← JWT, login, signup
│           │   ├── food/         ← log meals, get daily totals
│           │   ├── gemini/       ← Gemini API integration
│           │   ├── profile/      ← user targets
│           │   └── config/       ← security, CORS
│           └── resources/
│               └── application.properties
└── frontend/         ← React + Vite project
    └── src/
        ├── pages/
        │   ├── Login.tsx
        │   ├── Signup.tsx
        │   ├── Dashboard.tsx    ← today's macros
        │   ├── Log.tsx          ← type or photo → AI → confirm
        │   └── Profile.tsx      ← edit targets
        ├── components/
        │   ├── MacroBar.tsx
        │   ├── MealCard.tsx
        │   └── PhotoUpload.tsx
        ├── api/
        │   └── client.ts        ← all fetch calls to Spring Boot
        └── hooks/
            └── useAuth.ts
```

---

## Database (fresh Supabase PostgreSQL schema)
Schema lives in `supabase/migrations/20261006000000_init.sql`.

- `users` — email + BCrypt password hash (our own auth, not Supabase Auth)
- `profiles` — one row per user: macro targets + timezone (defines "today")
- `meals` — confirmed log entries: macros, `log_date`, meal label, source, Gemini item breakdown (`jsonb`), confidence, notes
- `custom_foods` — personal food/recipe library, macros per serving
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
- [x] Profile API: GET/PUT /api/profile (page: frontend rework later)
- [x] Custom food library API: /api/foods CRUD + POST /api/foods/{id}/log with servings (UI later)
- [x] Meal suggestions API: POST /api/meals/suggest (UI later)
- [ ] PWA setup (installable on iPhone home screen)
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel

### Phase 4 — Scale (Future)
- [ ] Custom domain
- [ ] Pantry memory (receipt scanner)
- [ ] Training day vs rest day toggle
- [ ] Restaurant menu analyzer

---

## API Contract (Spring Boot endpoints)

### Auth
```
POST /api/auth/register   { email, password, timezone?, targetCalories?, targetProtein?, targetCarbs?, targetFat? } → { token, user }
POST /api/auth/login      { email, password } → { token, user }
GET  /api/me              → { id, email }   (requires token)
```

### Meals
```
POST /api/meals/analyze   { description?, imageBase64?, mimeType? } → { items, totals, title, confidence, notes }
                          (photo + text combine: text adds items the photo doesn't show and clarifies what it does)
POST /api/meals/log       { description, calories, protein, carbs, fat, mealLabel, confidence, aiNotes }
GET  /api/meals/today     → { date, logs[], totals, targets }
GET  /api/meals/day/{date} → same shape, for any day (YYYY-MM-DD)
GET  /api/meals/history?days=30 → { from, to, targets, days[{ date, meals, totals }] }  (days with meals only)
PUT  /api/meals/{id}      { description, calories, protein, carbs, fat, mealLabel?, logDate? }  (logDate can't be in the future)
DELETE /api/meals/{id}
```

### Profile
```
GET  /api/profile
PUT  /api/profile         { displayName?, timezone?, targetCalories?, targetProtein?, targetCarbs?, targetFat? }  (only sent fields change)
```

### My foods (macros per serving)
```
GET    /api/foods
POST   /api/foods            { name, servingLabel?, calories, protein, carbs, fat }   (409 on duplicate name)
PUT    /api/foods/{id}       same body
DELETE /api/foods/{id}       (past meals keep their macros)
POST   /api/foods/{id}/log   { servings, mealLabel? } → meal, macros scaled by servings
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

---

## Session 1 Goal
By end of this session:
✅ Spring Boot running locally
✅ Connected to Supabase Postgres
✅ Register + login working (Postman or frontend)
✅ React app running locally
✅ Login/signup UI working end-to-end
