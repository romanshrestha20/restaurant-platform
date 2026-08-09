# Restaurant Platform API

NestJS API for the restaurant platform. Routes are served below `/api/v1`.

## Roadmap

1. Foundation: configuration, Prisma, validation, security middleware, health checks
2. Authentication: registration, login, refresh tokens, logout, current user
3. Restaurant tenancy and role-based access control
4. Menu catalog and public menu endpoints
5. Carts, pricing, checkout, and order workflows
6. Reservations, reviews, favorites, media, and production hardening

## Local development

From the repository root:

```bash
pnpm install
pnpm --filter @restaurant/database generate
pnpm --filter api dev
```

Required environment variables are loaded from `apps/api/.env` and then the
repository root `.env`:

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/restaurant_platform
PORT=3001
CLIENT_URL=http://localhost:3000
```

## Foundation endpoints

- `GET /api/v1/health` — process liveness; does not require the database
- `GET /api/v1/health/ready` — readiness; verifies a database query succeeds

## Verification

```bash
pnpm --filter api typecheck
pnpm --filter api test --runInBand
pnpm --filter api test:e2e
pnpm --filter api build
```
