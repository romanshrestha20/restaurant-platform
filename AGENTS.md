# AGENTS.md

## Project Overview

Restaurant Platform is a production-oriented multi-tenant restaurant management and ordering platform.

The repository is a TypeScript monorepo managed with pnpm workspaces and Turborepo.

Main applications:

```text
apps/
  api/       NestJS backend API
  web/       Customer-facing storefront
  admin/     Restaurant and platform administration
```

Shared packages:

```text
packages/
  database/
  auth/
  validation/
  types/
  typescript-config/
  ui/
```

Infrastructure:

```text
docker/
docs/
```

## Core Architecture

The platform follows this flow:

```text
Customer Web
      │
Admin Portal
      │
      ▼
NestJS API
      │
      ▼
Domain Modules
      │
      ▼
Database Package
      │
      ▼
PostgreSQL
```

The API is the central application boundary.

Web and admin applications must communicate with backend services through the API.

Do not access PostgreSQL directly from `apps/web` or `apps/admin`.

## Package Manager

Use pnpm only.

Do not use npm or yarn.

The repository uses pnpm workspaces and Turborepo.

Run commands from the repository root whenever possible.

Common commands:

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
```

For a specific workspace:

```bash
pnpm --filter web <command>
pnpm --filter admin <command>
pnpm --filter api <command>
```

Do not manually modify `pnpm-lock.yaml`.

## Applications

### apps/api

Backend API built with:

```text
NestJS
TypeScript
Prisma
PostgreSQL
JWT authentication
WebSockets
```

Main entry points:

```text
apps/api/src/main.ts
apps/api/src/app.module.ts
```

`main.ts` is responsible for application bootstrap and global infrastructure such as:

```text
/api prefix
API versioning
CORS
Helmet
Cookies
File uploads
WebSocket initialization
```

`app.module.ts` is the root NestJS module.

Domain functionality belongs in NestJS modules under:

```text
apps/api/src/modules/
```

Examples include:

```text
auth/
restaurants/
menu/
catalog/
cart/
orders/
payments/
reservations/
profile/
users/
health/
```

Follow NestJS conventions:

```text
controller
service
module
dto
guards
decorators
```

Controllers handle HTTP concerns.

Services contain business logic.

Guards handle authorization and access control.

DTOs define validated request boundaries.

Do not place large business logic blocks inside controllers.

### apps/web

Customer-facing Next.js application.

Technology:

```text
Next.js 16
React 19
TypeScript
Tailwind CSS
TanStack Query
```

Main application directory:

```text
apps/web/src/app/
```

Feature-specific code belongs under:

```text
apps/web/src/features/
```

Shared UI belongs under the existing component/shared directories.

API infrastructure belongs under:

```text
apps/web/src/lib/api/
```

The storefront should remain focused on customer workflows such as:

```text
restaurant discovery
restaurant menus
menu item browsing
cart
checkout
orders
customer account
```

Do not place backend business logic in the web application.

### apps/admin

Administration application for platform and restaurant operations.

Technology:

```text
Next.js 16
React 19
TypeScript
Tailwind CSS
```

Main entry points:

```text
apps/admin/src/app/layout.tsx
apps/admin/src/app/page.tsx
apps/admin/src/app/dashboard/page.tsx
```

The root page redirects to the dashboard.

Major areas include:

```text
dashboard
restaurants
catalog
orders
customers
reservations
reports
auth
```

Admin API communication belongs in:

```text
apps/admin/src/lib/admin-api/
```

Do not duplicate backend business logic in the admin application.

## Multi-Tenancy

Restaurant is the tenant boundary.

Restaurant-owned resources must be associated with the appropriate restaurant.

Examples:

```text
menus
categories
menu items
variants
add-ons
carts
orders
reservations
```

Use `restaurantId` or the existing tenant identifier consistently.

Never hardcode restaurant IDs or restaurant names to implement tenant-specific behavior.

### Authorization

The platform has two authorization levels:

```text
Platform role
    ↓
UserRole

Restaurant role
    ↓
RestaurantMember
```

Restaurant-specific permissions must be enforced at the API boundary.

Existing authorization infrastructure includes:

```text
apps/api/src/common/guards/
apps/api/src/common/decorators/
```

In particular, follow the existing restaurant role guard implementation.

Frontend route protection is not a replacement for API authorization.

## Database

Database functionality belongs in:

```text
packages/database/
```

Prisma configuration is managed by:

```text
packages/database/prisma.config.ts
```

Prisma schema definitions are under:

```text
packages/database/prisma/
```

The database package owns Prisma client creation and database access.

Use the existing Prisma client from:

```text
packages/database/src/client.ts
```

Do not create independent Prisma clients inside applications.

Do not access PostgreSQL directly from frontend applications.

## Shared Packages

Before creating duplicate functionality, check shared packages.

### database

Database schema, Prisma client, migrations, and seed functionality.

### auth

Shared authentication functionality.

### validation

Shared validation schemas and validation utilities.

### types

Shared TypeScript types.

### typescript-config

Shared TypeScript configurations.

### ui

Reusable UI components and design primitives.

Prefer existing shared components before creating new versions.

## Web Request Flow

Customer-facing data should generally follow:

```text
Next.js Page
    ↓
Feature Component
    ↓
Feature Hook
    ↓
API Service
    ↓
Shared API Client
    ↓
HTTP Request
    ↓
NestJS Controller
    ↓
Guard / Validation
    ↓
NestJS Service
    ↓
Database Package
    ↓
Prisma
    ↓
PostgreSQL
```

Keep each layer responsible for one concern.

Do not bypass the API.

## Admin Request Flow

Admin operations should generally follow:

```text
Admin Page
    ↓
Admin Feature
    ↓
Admin API Client
    ↓
HTTP Request
    ↓
NestJS Controller
    ↓
Authentication
    ↓
Restaurant / Platform Authorization
    ↓
NestJS Service
    ↓
Database Package
    ↓
Prisma
    ↓
PostgreSQL
```

Authorization must ultimately be enforced by the API.

## File Organization

Before creating a new file:

1. Inspect the existing feature.
2. Search for an existing implementation.
3. Reuse existing shared utilities.
4. Follow the local directory convention.
5. Create the smallest appropriate file.

Prefer feature-oriented organization.

For web features:

```text
features/
  restaurants/
    components/
    hooks/
    services/
    types/
    utils/
```

For API modules:

```text
modules/
  restaurants/
    restaurants.controller.ts
    restaurants.service.ts
    restaurants.module.ts
    dto/
```

Do not create generic dumping-ground directories such as:

```text
misc/
stuff/
helpers/
random/
```

unless an established project convention requires them.

## Testing

Use the testing framework already configured for each workspace.

Do not replace the existing testing framework.

Before adding tests:

1. Inspect the workspace configuration.
2. Find existing tests.
3. Follow the existing test naming and organization.
4. Reuse existing mocks and fixtures where possible.

New business logic should have appropriate tests.

API behavior should have integration/API coverage where appropriate.

Never remove tests simply to make a change pass.

## Validation

After changes, run relevant validation.

API:

```bash
pnpm --filter api typecheck
pnpm --filter api lint
pnpm --filter api test
```

Web:

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web test
```

Admin:

```bash
pnpm --filter admin typecheck
pnpm --filter admin lint
pnpm --filter admin test
```

For cross-workspace changes:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Never claim that a command passed unless it was actually executed.

## Dependency Rules

Do not add a dependency before checking whether the repository already provides equivalent functionality.

Do not introduce duplicate libraries.

Do not upgrade framework or major dependency versions as part of an unrelated task.

Major dependency changes require explicit user approval.

## Environment Variables

Never commit secrets.

Do not expose:

```text
passwords
JWT secrets
database credentials
API keys
private tokens
```

Do not modify real `.env` files unless the task explicitly requires it.

Use `.env.example` for documenting required configuration.

Never print credentials in terminal output.

## Database Safety

Never perform destructive database operations without explicit confirmation.

Do not:

```text
drop databases
reset production databases
truncate production tables
delete production data
rewrite migration history
```

Do not use destructive Prisma commands against production.

When working on migrations, inspect the current schema and migration history first.

## Git Safety

Do not run destructive Git operations without explicit confirmation.

Never run:

```bash
git reset --hard
git clean -fd
git push --force
git push --force-with-lease
```

Do not delete branches.

Do not rewrite commit history.

Do not discard existing user changes.

Preserve unrelated modifications.

## Protected Files

Do not modify these files for unrelated reasons:

```text
pnpm-lock.yaml
package.json
pnpm-workspace.yaml
tsconfig.json
next.config.*
prisma.config.ts
packages/database/prisma/**
docker/**
.env
.env.*
.github/**
```

If a requested task requires modifying one of these files, make only the required change.

Never modify real credentials.

## API Contract Rules

When changing an API contract:

1. Update the NestJS controller or DTO.
2. Update the service if required.
3. Update affected frontend API clients.
4. Update shared types or validation schemas where applicable.
5. Update tests.
6. Run relevant type checks and tests.

Do not silently break existing consumers.

## UI Rules

Use existing shared UI components and design patterns.

Do not introduce a new UI library without explicit approval.

Pages should compose features.

Components should focus on presentation and interaction.

Business logic should live in appropriate hooks/services.

Handle relevant:

```text
loading
error
empty
success
```

states.

Keep customer and admin interfaces responsive.

## Error Handling

Use the existing API error-handling and normalization mechanisms.

Do not silently ignore errors.

Do not expose internal stack traces, database errors, or implementation details to users.

Return clear user-facing error states.

## Documentation

Important architectural decisions should be documented under:

```text
docs/
```

The primary architecture reference is:

```text
docs/architecture.md
```

When changing architecture, update the relevant documentation if the change is intended to become the new project convention.

## Agent Workflow

For every task:

1. Inspect the existing implementation.
2. Identify the affected application or package.
3. Identify the existing architectural pattern.
4. Search for related implementations.
5. Make the smallest appropriate change.
6. Avoid unrelated refactoring.
7. Run relevant validation.
8. Inspect the final diff.
9. Report changed files and verification results.

Do not guess when the repository can answer the question.

Do not introduce a new pattern when an existing pattern already solves the problem.

Do not claim work was completed or verified unless it actually was.
