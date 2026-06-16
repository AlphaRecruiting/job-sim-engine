# Job Sim Engine

A modular job simulation platform. Admins create job postings with multi-step work simulations; candidates complete them and get scored by AI and deterministic engines.

## Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL + Prisma
- **Queue**: BullMQ + Redis
- **AI**: OpenAI GPT-4o (scoring + recommendations) + Realtime API (voice call)
- **Infra**: Railway

## Monorepo structure

```
apps/
  web/      Next.js frontend (admin + candidate UI)
  api/      Express REST API
  worker/   BullMQ async worker (scoring, AI recs, analytics)
packages/
  shared/             TypeScript types, Zod schemas, constants
  simulation-modules/ All 6 simulation modules (registry pattern)
  scoring/            AI rubric scorer + aggregation logic
prisma/
  schema.prisma       Full database schema
  seed.ts             Sample org, job, and simulation
```

## Simulation modules

| Module | Type | Scoring |
|---|---|---|
| Multiple Choice | Knowledge check | Deterministic |
| Free Text | Open answer | AI rubric |
| CRM Prioritization | Rank leads/accounts | Hybrid |
| Notification Reaction | Handle incoming messages | Hybrid |
| Email Response | Write professional reply | AI rubric |
| Simulated Call | Voice call with AI buyer | AI rubric (transcript) |

## Local development

### Prerequisites
- Node.js 22+
- pnpm (`npm install -g pnpm`)
- Docker (for Postgres + Redis)

### Setup

```bash
git clone https://github.com/nicoganza/job-sim-engine
cd job-sim-engine

pnpm install

cp .env.example .env
# Add your OPENAI_API_KEY to .env

docker-compose up postgres redis -d

pnpm db:migrate
pnpm db:seed

pnpm dev
```

Services run at:
- Web: http://localhost:3000
- API: http://localhost:4000

### Dev login
The seed creates `admin@acme.com`. Call `POST /api/login` with `{ "email": "admin@acme.com" }` to get a JWT token, then include it as `Authorization: Bearer <token>` on admin API calls.

## Railway deployment

See `railway/README.md` for the full runbook.

1. Create Railway project
2. Add PostgreSQL and Redis plugins
3. Add services: `api` (root dir `apps/api`), `worker` (root dir `apps/worker`), `web` (root dir `apps/web`)
4. Set env vars per service (see `.env.example`)
5. Run `prisma migrate deploy` on first API deploy
6. Seed with `tsx prisma/seed.ts`

## Key design rules

- Hidden scoring config is **never** sent to candidate clients — each module implements `getPublicCandidateConfig()` to strip it
- Published simulation versions are **immutable** — candidates always run against the version they started with
- AI buyer hidden objections stay **server-side** — system prompt is constructed at call start, never returned to the frontend
- AI scoring traces stored in `ai_evaluation_traces` for audit
- Red flags trigger manual review, not automatic rejection
