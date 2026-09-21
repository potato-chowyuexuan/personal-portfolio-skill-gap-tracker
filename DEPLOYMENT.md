# Deployment Guide

This app deploys as two pieces:

- **Database** — [Neon](https://neon.tech) (managed Postgres, free tier)
- **App** — [Render](https://render.com) (one web service running the Express API, which also serves the built React frontend as static files — no separate frontend host needed)

Do these in order — each step needs a value produced by the previous one.

---

## 1. Create the database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (GitHub login is fine).
2. Create a new project. Any region close to where Render will run is fine (Render defaults to Oregon, US).
3. Once the project is created, go to the project's **Dashboard → Connection Details**.
4. Copy the connection string. It looks like:
   ```
   postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
   ```
5. Save it somewhere — you'll paste it into two places: your local `.env` (to run the migration) and Render's environment variables (step 3).

## 2. Run the migration against Neon

This creates the tables. Run it from your own machine, once, before deploying.

```bash
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to the connection string from step 1. Then:

```bash
npm install
npm run migrate
```

You should see:
```
Applying 001_init.sql...
Migrations applied successfully.
```

To double check, in the Neon dashboard open **Tables** — you should see `skills`, `projects`, `project_skills`, `roles`, `role_required_skills`.

> The migration is idempotent (safe to re-run) — every statement uses `IF NOT EXISTS`. If you add more tables later, drop a new `server/migrations/00N_*.sql` file in and re-run `npm run migrate`; it'll only apply what's new... actually right now it re-runs every file every time, which is harmless since they're all idempotent, but worth knowing if a future migration does something non-idempotent (like an `ALTER TABLE`) — track applied migrations before adding one of those.

## 3. Deploy (Render)

1. Push this repo to GitHub (you're handling this part).
2. In the [Render dashboard](https://dashboard.render.com), click **New → Web Service**.
3. Connect your GitHub account and pick this repository.
4. Configure the service:
   | Setting | Value |
   |---|---|
   | **Name** | anything, e.g. `portfolio-tracker` |
   | **Region** | anywhere near your Neon region |
   | **Branch** | `main` (or whatever you push) |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from step 1 |
   | `NODE_ENV` | `production` |
   | `ANTHROPIC_API_KEY` | your Claude API key (optional — omit if you don't have one, the app falls back gracefully) |

   Don't set `PORT` — Render provides it automatically and the app already reads `process.env.PORT`.
   Don't set `FRONTEND_URL` or `VITE_API_BASE_URL` — those only matter if frontend and backend are on different origins, which isn't the case here (one service serves both).
6. Click **Create Web Service**. Watch the deploy logs. On success you'll get a URL like `https://portfolio-tracker.onrender.com`.
7. Sanity check: open `https://<your-render-url>/api/health`. You should see:
   ```json
   {"status":"ok","database":"connected"}
   ```
   If you see `"database":"unreachable"`, double-check `DATABASE_URL` was pasted correctly (including `?sslmode=require`).
8. Open `https://<your-render-url>/` — you should see the actual app (Projects tab, sample data), not just JSON.

> **Free tier note:** Render's free web services spin down after ~15 minutes idle and take 30–60s to wake back up on the next request — including loading the page itself, since frontend and backend are the same process here. That's expected, not a bug. If that's ever annoying, Render's cheapest paid tier removes it.

## 4. Verify the deployed app works end to end

1. Open your Render URL in a browser.
2. Add a test project, then delete it — confirms the app can write to the backend.
3. **Confirm data persists on Neon**: in Render's dashboard, trigger a manual redeploy (Manual Deploy → Deploy latest commit). Once it's back up, reload the app — your data should still be there. This proves it's reading from Neon (a durable database) and not some in-memory store that would reset on redeploy.
4. Optionally, check Neon's **SQL Editor** and run `SELECT * FROM projects;` to see your rows directly.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `/api/health` returns `database: unreachable` | `DATABASE_URL` missing/wrong on Render, or the Neon project is paused/deleted |
| Build fails on Render | Check the build logs — usually a missing env var caught at build/start time, or a Node version mismatch |
| First request after idle takes 30–60s | Expected on Render's free tier (cold start) |
| AI features show `"source": "fallback"` instead of `"source": "claude"` | `ANTHROPIC_API_KEY` missing or invalid on Render — check the Environment tab |

## If you later want to split the frontend onto Vercel

Not needed for now, but if page-load speed or PR previews become important later: the app already supports it via `VITE_API_BASE_URL` (frontend) and `FRONTEND_URL` (backend CORS) — both are already wired up in the code, just unused while everything runs from one Render service. Just ask if you want the Vercel walkthrough added back.
