# AGENTS.md

## Purpose

These are repository-wide instructions for coding agents working in Restaurant Platform. Read the nearest application-level `AGENTS.md` as well, if one exists. More specific instructions may add constraints but must not weaken security requirements here.

## Before changing code

1. Inspect the current implementation, tests, package scripts, and relevant configuration.
2. Read `docs/architecture.md`, `docs/domain-routing.md`, and `docs/DESIGN.md` when the task touches architecture, tenancy, routing, or UI.
3. Identify which behavior is implemented, incomplete, or only planned.
4. Check the working tree and preserve unrelated changes.
5. Make the smallest maintainable change that solves the stated problem.
6. Run relevant checks and report exactly which commands passed or failed.

Do not assume documentation proves that a feature works. Source code, tests, migrations, and runtime verification determine implementation status.

## Repository structure

- `apps/api`: NestJS API, business rules, authentication, authorization, integrations, and realtime behavior.
- `apps/web`: customer discovery and storefront application.
- `apps/admin`: administration application. Verify feature completeness from source.
- `packages/database`: Prisma schema, migrations, seed data, and database integration.
- `packages/ui`: shared UI primitives.
- `packages/auth`, `packages/types`, `packages/validation`, and configuration packages: reuse where implemented.
- `docs`: architecture, domain routing, and design standards.

Use pnpm and the existing Turborepo tasks. Do not introduce a new framework, ORM, state manager, UI library, or validation library without a clear technical reason.

## Architecture rules

- Keep business rules and authorization in the API.
- Frontend applications must not access PostgreSQL directly.
- Reuse existing API clients, DTOs, validation, shared types, and UI components.
- Keep modules cohesive and dependencies flowing toward shared, stable packages.
- Avoid duplicate utilities and parallel abstractions.
- Do not edit generated Prisma output manually.
- Keep API response contracts, frontend types, and tests aligned.
- Do not add dependencies merely to save a small amount of code.

## Multi-tenant security

The Restaurant entity is the intended tenant root. Every tenant-owned read and write must be scoped to the resolved restaurant and authorized on the server.

Never trust a client-supplied restaurant ID, slug, hostname, role, price, permission, or ownership claim as proof of authorization. Frontend checks improve usability but do not secure API endpoints.

The current web app includes hostname resolution, but the inspected database schema does not define the planned `RestaurantDomain` model. Some customer cart, checkout, delivery-quote, and reservation routes use a primary-restaurant fallback. Do not describe this as completed hostname-based tenancy.

Tenant consistency must eventually cover catalog reads, menu details, cart creation and updates, checkout, delivery quotes, orders, reservations, media, realtime subscriptions, caches, background jobs, exports, and administration.

For tenant-scoped features, add tests that prove:
- A correctly authorized user can access their own restaurant data.
- A user cannot access another restaurant by swapping an ID.
- Child resources belong to the expected parent and restaurant.
- Unknown or inactive tenant domains do not fall back to a different restaurant.
- Public endpoints expose only intentionally public fields.

## Domain routing

Read `docs/domain-routing.md` before modifying hostname or custom-domain behavior.

- Normalize hostnames consistently.
- Trust forwarded host headers only when the proxy configuration is known and validated.
- Resolve domain mappings on the server for security-sensitive operations.
- Verify custom-domain ownership before activation.
- Enforce hostname uniqueness in the database.
- Keep development-only slug overrides out of production.
- Do not use an arbitrary primary restaurant as the fallback for an unresolved tenant.

## Database and migrations

- Inspect every relevant split Prisma schema file before changing models.
- Follow current migration and Prisma generation scripts.
- Keep schema, migration history, seeds, generated-client expectations, and tests consistent.
- Back up important data before risky migrations.
- Never casually reset a shared or production database.
- Do not rewrite applied migration history to make a local issue disappear.
- Use transactions for multi-step state changes that must remain consistent.
- Add indexes and constraints to support actual query and integrity requirements.

## Authentication, payments, and uploads

- Enforce authorization on the server for every protected operation.
- Never log secrets, tokens, payment credentials, or unnecessary personal data.
- Verify payment webhooks using the provider's required signature verification method and raw body.
- Make webhook processing idempotent and safe under retries.
- Do not trust browser redirects as proof of payment.
- Validate upload size, content type, ownership, and storage permissions.
- Rate-limit sensitive operations and protect against cross-site request forgery where the authentication model requires it.
- Return safe error messages without stack traces or sensitive internals.

## UI and design system

Read `docs/DESIGN.md`.

- Use semantic CSS tokens and Tailwind theme mappings.
- Reuse `packages/ui` before adding duplicate components.
- Keep restaurant branding data-driven.
- Use semantic HTML and keyboard-accessible interactions.
- Provide visible focus states, accessible labels, useful error messages, and loading, empty, and success states.
- Do not rely on color or hover alone to communicate meaning.
- Avoid arbitrary raw colors and one-off spacing when a token or established pattern exists.
- Keep visual components separate from domain and business logic.

## Testing and verification

Choose checks based on the change. Inspect package scripts before assuming a command exists.

At minimum, consider:
- Type checking and linting.
- Unit tests for changed service and validation logic.
- API integration tests for persistence and authorization.
- Cross-tenant negative tests.
- Frontend tests for all relevant UI states.
- End-to-end tests for affected customer and admin flows.
- Migration verification for schema changes.
- Payment webhook tests for invalid signatures, duplicate events, retries, and state transitions.

Never claim tests passed if they were not run. Distinguish static inspection from live database/API verification.

## Documentation and completion

Update documentation when behavior, API contracts, architecture, setup, or design tokens change. Keep README claims conservative and verifiable.

Before finishing:
1. Review the diff.
2. Confirm no secrets or unrelated changes were added.
3. Run relevant checks.
4. Summarize files changed, behavior changed, tests run, and known limitations.
5. Identify any manual runtime verification still required.

## Project priority

Prioritize tenant consistency and isolation before advanced features. The key architectural milestone is a verified customer journey from domain resolution through menu, cart, checkout, payment, and order state, with strict server-side restaurant scoping.
