# Restaurant Platform

A multi-tenant restaurant platform built as a TypeScript monorepo. The project is intended to give restaurants customer-facing storefronts and management tools backed by a shared API and PostgreSQL database.

> Project status: active development. The repository contains working application foundations and domain modules, but a complete production-ready multi-tenant ordering journey has not yet been verified end to end. Read the implementation status below before assuming a capability is production-ready.

## Contents

- [Overview](#overview)
- [Technology](#technology)
- [Repository structure](#repository-structure)
- [Implemented foundations](#implemented-foundations)
- [Important gaps](#important-gaps)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Development commands](#development-commands)
- [Architecture and security](#architecture-and-security)
- [Documentation](#documentation)
- [Development principles](#development-principles)

## Overview

The intended product includes:

- A public restaurant discovery experience.
- Restaurant-specific storefronts and menus.
- Restaurant staff and management workflows.
- Customer accounts, carts, checkout, orders, and reservations.
- Payment provider integration.
- A shared API and database with tenant-aware authorization.
- A reusable UI package and consistent design system.

These are product goals, not a statement that every flow is complete. Check the source, tests, and deployment configuration for the current implementation of each feature.

## Technology

- TypeScript
- pnpm workspaces and Turborepo
- Next.js and React for the web applications
- NestJS for the API
- PostgreSQL
- Prisma ORM, with schema files organized under `packages/database/prisma`
- Tailwind CSS v4
- TanStack Query in the customer web application
- WebSockets for supported realtime functionality
- Docker Compose configuration under `docker/`

Use the exact versions declared by the repository's package files and lockfile. Do not infer runtime compatibility from this list alone.

## Repository structure

```text
restaurant-platform/
├── apps/
│   ├── api/                 # NestJS API
│   ├── web/                 # Customer discovery and storefront
│   └── admin/               # Administration application
├── packages/
│   ├── database/            # Prisma schema, migrations, seeds, shared DB code
│   ├── auth/                # Shared authentication code, where applicable
│   ├── types/               # Shared types
│   ├── validation/          # Shared validation
│   ├── typescript-config/   # Shared TypeScript configuration
│   └── ui/                  # Shared React UI primitives
├── docs/
│   ├── architecture.md
│   ├── domain-routing.md
│   └── DESIGN.md
├── docker/
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

Some package responsibilities and application features may still be evolving. Inspect each package before adding a new one.

## Implemented foundations

The current source includes:

- A pnpm/Turborepo monorepo with API, customer web, admin, and shared packages.
- A NestJS API with modules for authentication, restaurants, catalog, menus, carts, orders, payments, reservations, profile, and health.
- A split Prisma schema containing restaurant, membership, address, opening-hours, settings, menu, cart, order, payment, reservation, and related domain models.
- Restaurant creation and membership-aware management endpoints with role and permission checks in restaurant-related API routes.
- Public restaurant catalog endpoints.
- Customer web restaurant discovery and storefront components.
- A hostname resolver in the customer web application, including development overrides and configured custom-domain mappings.
- Shared UI primitives such as buttons, badges, cards, inputs, dialogs, separators, skeletons, and text areas.
- API bootstrap configuration for request validation, CORS, security middleware, request IDs, compression, cookie parsing, shutdown hooks, and versioned API routes.
- A Stripe-related payment provider and webhook endpoint.

These observations are based on source inspection. They do not independently prove that the complete application builds, all services start, external integrations work, or the production deployment is secure.

## Important gaps

Treat these as explicit follow-up work, not completed capabilities:

1. **End-to-end tenant enforcement.** The frontend has hostname resolution logic, but the inspected database schema does not define the planned `RestaurantDomain` model. Several customer cart, checkout, delivery-quote, and reservation controller paths use `PrimaryRestaurantService`. This is not equivalent to resolving and enforcing the tenant from the incoming storefront domain.
2. **Domain lifecycle.** Custom domain verification, activation, uniqueness, ownership checks, canonical domain behavior, and API-side domain resolution need a complete implementation and tests before custom domains can be described as production-ready.
3. **Full customer journey.** Verify catalog, menu selection, cart, checkout, payment, order tracking, and reservation flows together against a live database and API.
4. **Admin completeness.** Inspect the actual routes, API integration, permission handling, and tests in `apps/admin` before claiming that all listed administration workflows are available.
5. **Operational verification.** A successful unit test or typecheck is not proof of successful migrations, database connectivity, payment webhook delivery, realtime behavior, or production deployment.

Prioritize tenant consistency and isolation before adding advanced features. See [Architecture](docs/architecture.md) and [Domain routing](docs/domain-routing.md).

## Getting started

Prerequisites:

- A Node.js version supported by the repository's `.node-version` and package configuration.
- The pnpm version declared by the root package configuration.
- Docker with Docker Compose, or a separately managed PostgreSQL instance.
- Environment variables required by the API and applications.

Clone the repository and install dependencies:

```bash
git clone https://github.com/romanshrestha20/restaurant-platform.git
cd restaurant-platform
pnpm install
```

Review each app's package scripts and environment validation before starting services. Start the database using the repository's current Docker Compose configuration, then configure the database connection and required secrets.

The root scripts delegate to Turborepo. Use the individual package scripts when you need to run one application in isolation. Exact commands and environment variables can change, so inspect the current `package.json` files and application configuration rather than copying an outdated command.

## Environment configuration

Do not commit secrets. Use local environment files that are ignored by Git and provide a separate secret-management mechanism in deployed environments.

Before starting an application, inspect its environment schema and example files. Configure, as applicable:

- PostgreSQL connection settings.
- API port and customer client origin.
- Authentication/JWT secrets and token settings.
- Frontend API base URL.
- Upload storage provider and local storage path, if local uploads are enabled.
- Payment provider credentials and webhook configuration.
- Realtime origins and any other integration-specific settings.

Do not invent placeholder values for required secrets and assume the app is ready. Use strong local-only secrets and the exact variable names required by the current source.

## Development commands

The root package currently defines these commands:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm clean
```

These commands delegate to workspace tasks through Turborepo. Check the relevant package's `package.json` to confirm which tasks it implements. Run the checks relevant to your change before opening a pull request.

For database changes, inspect the database package scripts and Prisma configuration first. Back up important data before migrations, never reset a shared database casually, and do not edit generated Prisma client files by hand.

## Architecture and security

- The API is the business logic and authorization boundary.
- The database package owns the shared Prisma schema, migrations, and database integration.
- The customer web and admin applications call the API. They must not access the database directly.
- Every tenant-owned read and write must be scoped to the authorized restaurant on the server.
- Never trust a client-provided restaurant ID, role, price, permission, or tenant identity without server-side validation.
- Tenant context must be consistent across catalog, cart, checkout, payment, orders, reservations, uploads, realtime subscriptions, and caching.
- Payment webhooks must verify signatures and handle retries safely.
- Validate external input and return consistent errors without exposing secrets or internal stack traces.
- Use tests to prove both allowed access and denied cross-tenant access.

Read [docs/architecture.md](docs/architecture.md), [docs/domain-routing.md](docs/domain-routing.md), [docs/DESIGN.md](docs/DESIGN.md), and [AGENTS.md](AGENTS.md) before making broad changes.

## Documentation

- [Architecture](docs/architecture.md): system boundaries, domain modules, tenant model, and current gaps.
- [Domain routing](docs/domain-routing.md): hostname normalization and the intended domain resolution lifecycle.
- [Design system](docs/DESIGN.md): tokens, component rules, accessibility, and UI implementation standards.
- [Agent instructions](AGENTS.md): repository-level instructions for coding agents.

## Development principles

- Inspect before implementing.
- Keep changes focused and preserve unrelated work.
- Reuse existing packages, components, validation, and API clients.
- Add tests for behavior changes and security boundaries.
- Update documentation when implementation or contracts change.
- Distinguish implemented behavior from proposed architecture.
- Do not call a feature complete until its real flow and failure cases have been verified.
