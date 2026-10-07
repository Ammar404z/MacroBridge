# MacroBridge

AI macro tracker for you and your friends: describe a meal or snap a photo, Gemini estimates the macros, you confirm, and it's logged against your daily targets. Friends can follow each other's day and copy each other's meals.

**Live:** https://macro-bridge.vercel.app. On iPhone, open it in Safari, then Share → Add to Home Screen.

## Features
- **Log meals** by text, photo, or both (the text can add or correct what the photo shows), by hand, or from your saved foods with servings
- **Today**: calorie ring and macro tiles; ‹ › to browse past days, add meals to them, and tap any meal to edit or move it
- **My foods**: your own library of meals you eat often, logged in two taps
- **Meal ideas**: three single-meal suggestions that fit what's left today
- **Friends**: invite link → request → accept; see friends' rings, their meals from the last 24 hours ("Log this" copies one), and their full day; a switch on Profile turns sharing off
- **Profile**: picture, name, timezone, daily targets, change password, log out
- Installable PWA with a full-screen iPhone layout

## Structure
- `backend/`: Spring Boot 4 API (Java 21): JWT auth, meals, foods, friends, Gemini calls
- `frontend/`: React 19 + Vite + Tailwind v4 PWA
- `supabase/migrations/`: Postgres schema (applied to the Supabase project)
- `design/`: the design handoff (`DESIGN.md`) and HTML mockups the UI follows
- [PLAN.md](PLAN.md): stack, API contract, decisions and what's next

## Setup
1. Install Docker and the Supabase CLI, then run `supabase start` in the repo root. It runs Postgres locally and applies `supabase/migrations/`.
2. Copy `.env.example` to `.env` and fill in a random `JWT_SECRET` and a Gemini key from https://aistudio.google.com/apikey. The DB values already point at the local database.

## Run locally
```bash
cd backend && ./mvnw spring-boot:run     # API on http://localhost:8080
cd frontend && npm install && npm run dev # app on http://localhost:5173 (Node 20.19+ or 22)
```
Both read their settings from the repo-root `.env`.

Local development uses the local database, never the live one. Browse it in Studio at http://127.0.0.1:54323. `supabase db reset` wipes it and re-applies all migrations. `supabase stop` shuts it down.

**Schema changes:** add a new file in `supabase/migrations/`, test it with `supabase db reset`, and apply it to the live database only after that (`supabase link --project-ref wkgohhlgqrfajqsbxkuy` once, then `supabase db push`). Push migrations **before** deploying backend code that needs them.

## Deploy
| Part | Where | How it updates |
|---|---|---|
| Frontend | Vercel (`frontend/` as root) | Automatically on every push to `main` |
| Backend | Google Cloud Run, service `macrobridge-api`, region `europe-west1` | Automatically on every push to `main` that touches `backend/` (GitHub Actions, `.github/workflows/deploy-backend.yml`). By hand: `gcloud run deploy macrobridge-api --source backend --region europe-west1 --quiet` |
| Database | Supabase (Frankfurt) | Migrations in `supabase/migrations/` |

- The GitHub Action logs in to Google without a stored key (Workload Identity Federation: pool `github`, provider `macrobridge`, service account `github-deployer`, only the `main` branch of this repo is allowed).
- Vercel needs one variable: `VITE_API_URL` = the Cloud Run URL + `/api` (type Config, not Secret; the browser needs it).
- The backend's settings (database, `GEMINI_API_KEY`, a production-only `JWT_SECRET`, `CORS_ALLOWED_ORIGINS=https://macro-bridge.vercel.app`) are stored only on Cloud Run. Change one with `gcloud run services update macrobridge-api --region europe-west1 --update-env-vars KEY=value`. Never commit them.
- Cloud Run runs at most one instance and sleeps when idle, so the first request after a quiet period takes about 6–9 s.

## Settings (`.env`)
| Variable | Purpose |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Postgres over JDBC: local Supabase in `.env`; the live Supabase pooler on Cloud Run |
| `JWT_SECRET` | At least 32 random bytes; signs logins |
| `JWT_EXPIRATION_HOURS` | Login lifetime, default 2160 (90 days) |
| `GEMINI_API_KEY` | Meal analysis and meal ideas |
| `GEMINI_MODEL` | Optional, default `gemini-3.5-flash-lite` |
| `AI_DAILY_LIMIT` | Optional, AI calls per user per day, default 50 |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `VITE_API_URL` | Where the frontend finds the API |

## AI limits
Everyone shares one Gemini key. On Google's free tier `gemini-3.5-flash-lite` allows about 500 requests a day for the whole app (`gemini-3.5-flash` only about 20), and the app caps each user at `AI_DAILY_LIMIT`. When Google's quota runs out, users see "The AI has hit its daily limit" and can still enter macros by hand. Turning on billing for the Gemini key's project lifts the limits (and stops Google using requests for training), but costs money per call.
