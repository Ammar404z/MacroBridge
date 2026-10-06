# MacroBridge

AI macro tracker: describe a meal or snap a photo, Gemini estimates the macros, you confirm, and it's logged against your daily targets.

- `backend/` — Spring Boot API (JWT auth, Gemini integration)
- `frontend/` — React + Vite + Tailwind PWA
- `supabase/migrations/` — Postgres schema

See [PLAN.md](PLAN.md) for the stack, API contract and build order.

## Setup
1. Create a Supabase project and run `supabase/migrations/*.sql` in the SQL editor
   (or `supabase link` + `supabase db push`).
2. Copy `.env.example` to `.env` and fill in the values.

## Run locally
```bash
cd backend && ./mvnw spring-boot:run     # API on http://localhost:8080
cd frontend && npm install && npm run dev # app on http://localhost:5173 (Node 20.19+ or 22)
```
Both read their settings from the repo-root `.env`.
