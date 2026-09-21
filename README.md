# Personal Portfolio & Skill Gap Tracker

**Live app:** https://portfolio-tracker-oq07.onrender.com/

## The problem

When you're applying to roles, it's hard to answer "do I actually have the skills this job wants?" from memory. Project details, the specific tech you used, and how deeply you used it (just touched it vs. built the architecture) get fuzzy over time — and every application means re-mining old projects for evidence.

## What it does

- **Log projects** — timeframe, context (coursework / internship / personal / hackathon / team), your role, raw notes, and the tech stack involved.
- **Tag demonstrated skills per project** with a depth level (`Used` / `Implemented` / `Architected`), pulled from one shared skill pool so tagging stays consistent across projects.
- **Define target roles** with their required skills, and optionally track the application itself (company, status, date applied, resume version used).
- **Get a gap analysis** per role: which required skills are Covered, Partial, or Missing, backed by which specific projects, computed server-side.
- **Optional AI assist** (Claude) — generate a 2–3 sentence project summary, or auto-classify role/tech/skills from free-form notes. Falls back to a deterministic rule-based generator when no API key is configured, so the app is fully usable without it.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast dev loop, full type safety, component-driven UI |
| Styling | Tailwind CSS | Utility-first styling for a dense dashboard layout |
| Backend | Express (Node.js) | REST API in the same language as the frontend |
| Database | PostgreSQL (hosted on [Neon](https://neon.tech)) | Real relational schema — foreign keys, cascading deletes, indexes — with a managed, scale-to-zero free tier |
| AI | Claude API (Anthropic) | Optional project-summary generation and notes classification |
| Hosting | Render (single web service — serves the API and the built frontend) | Free tier, simple git-based deploys, one dashboard |

## Architecture

Three-tier: the React SPA talks to the backend only through a REST API (`/api/...`); the Express router delegates to repository modules that own all SQL; a dedicated `server/gapAnalysis.ts` module computes readiness scoring server-side so the client never has to duplicate that logic. Skills typed into a project or role are deduplicated case-insensitively into one shared pool.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full deployment setup and [Personal Portfolio & Skill Gap Tracker.pdf](<Personal Portfolio & Skill Gap Tracker.pdf>) for a deeper write-up of the architecture and build process.

## Running locally

**Prerequisites:** Node.js, a Postgres database (a free [Neon](https://neon.tech) project works well, or any local Postgres).

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL (and optionally ANTHROPIC_API_KEY)
npm run migrate        # creates the schema
npm run dev            # http://localhost:3000
```

## Project structure

```
src/                  React frontend
server/               Express API, repositories, gap-analysis logic
server/migrations/    SQL schema migrations
scripts/migrate.ts    Migration runner (npm run migrate)
```
