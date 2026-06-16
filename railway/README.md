# Railway Deployment

## Services

- **web** - Next.js frontend (apps/web)
- **api** - Backend API (apps/api)
- **worker** - BullMQ worker (apps/worker)
- **postgres** - Railway PostgreSQL plugin
- **redis** - Railway Redis plugin

## Setup

1. Create Railway project
2. Add PostgreSQL plugin
3. Add Redis plugin
4. Add API service: root dir `apps/api`, start cmd `pnpm start:prod`
5. Add worker service: root dir `apps/worker`, start cmd `pnpm start:prod`
6. Add web service: root dir `apps/web`, start cmd `pnpm start`
7. Set environment variables per service (see .env.example)
8. Run `pnpm prisma migrate deploy` before first API start
9. Run `pnpm db:seed` to seed sample data

## Environment variables per service

### api + worker
DATABASE_URL, REDIS_URL, JWT_SECRET, APP_URL, API_URL, OPENAI_API_KEY, REALTIME_MODEL, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET

### web
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_API_URL
