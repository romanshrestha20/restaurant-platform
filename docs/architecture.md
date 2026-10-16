# Architecture

## 1. Purpose and status

Restaurant Platform is being developed as a multi-tenant restaurant SaaS product. The intended system provides customer storefronts and restaurant management workflows through separate web applications backed by a central NestJS API and PostgreSQL database.

This document describes the current repository structure and the intended target architecture. A section marked **Target** is a design requirement, not proof that the capability is implemented. Revisit this document whenever code, package boundaries, or API contracts change.

## 2. System overview

```text
Customer browser                 Restaurant staff browser
       |                                  |
       v                                  v
 apps/web storefront                 apps/admin
       |                                  |
       +---------------+------------------+
                       |
                       v
                 apps/api
                NestJS REST
               and WebSockets
                       |
                       v
              packages/database
                 Prisma ORM
                       |
                       v
                  PostgreSQL
```

The frontend applications must communicate with backend capabilities through the API. They must not import database internals or connect to PostgreSQL directly.

## 3. Monorepo boundaries

### `apps/api`

The central backend application. It contains HTTP controllers, services, repositories, guards, decorators, validation DTOs, security middleware, integrations, and realtime infrastructure.

Source modules include authentication, profile, restaurants, catalog, menu, cart, orders, payments, reservations, and health. Confirm current module names and behavior in source before relying on this list.

Responsibilities:
- Validate requests and authenticate callers.
- Authorize user and restaurant membership permissions.
- Enforce tenant boundaries for every tenant-owned resource.
- Own business rules and transactional workflows.
- Integrate with payment and upload providers.
- Return stable API contracts and consistent errors.

### `apps/web`

The customer-facing Next.js application. Its source includes restaurant discovery, restaurant storefront components, restaurant context, menu and cart feature areas, API client infrastructure, and shared providers.

Responsibilities:
- Render platform discovery and customer storefront interfaces.
- Fetch server-owned data through the API.
- Present loading, empty, error, and success states.
- Resolve a candidate tenant from the browser hostname for storefront presentation.
- Keep client-side state and UI concerns out of backend business logic.

The browser-side hostname resolver is not a security boundary. The API must independently resolve and enforce tenant identity.

### `apps/admin`

The separate Next.js administration application. It is intended for restaurant operators and platform administrators.

Responsibilities:
- Present administrative workflows.
- Call API endpoints.
- Display only data the current caller is authorized to access.
- Apply permission-aware UI behavior for usability.

Do not assume that a screen or workflow is complete until its route, API integration, permission checks, and tests have been inspected.

### Shared packages

- `packages/database`: split Prisma schema, migrations, seed scripts, generated-client integration, and database utilities.
- `packages/ui`: shared React primitives. Extend these rather than building duplicate components.
- `packages/auth`, `packages/types`, `packages/validation`, and `packages/typescript-config`: shared concerns where currently implemented.

The root workspace uses pnpm and Turborepo. Keep dependency direction clear. Shared packages should not import application-specific modules.

## 4. Backend request flow

The intended request flow is:

```text
HTTP request
    |
    v
Request ID and security middleware
    |
    v
Routing and request validation
    |
    v
Authentication
    |
    v
Tenant resolution, when the route is tenant-scoped
    |
    v
Authorization and membership permissions
    |
    v
Controller
    |
    v
Service and transaction
    |
    v
Repository / Prisma
    |
    v
PostgreSQL
```

The exact order of middleware, guards, and interceptors depends on NestJS execution semantics. Verify the actual request pipeline when changing security-sensitive behavior.

Controllers should remain thin. Services should own business rules. Repositories should encapsulate database operations where the module uses that pattern.

## 5. Domain model

The `Restaurant` entity is the intended tenant root. The inspected schema includes restaurant data and relationships to members, media, addresses, settings, opening hours, menus, categories, menu items, add-on groups, carts, orders, reservations, reviews, and activity logs.

The intended ownership graph is:

```text
Restaurant
├── Domains                  (target, model needs verification)
├── Members and roles
├── Settings and opening hours
├── Addresses and media
├── Menus
│   ├── Categories
│   ├── Menu items
│   ├── Variants
│   └── Add-ons
├── Carts
├── Orders
│   └── Payments
├── Reservations
├── Reviews
└── Activity logs
```

Use the actual Prisma schema as the source of truth for fields, relations, and constraints. The diagram is conceptual and does not replace schema inspection.

## 6. Multi-tenancy and authorization

### Core invariant

Every tenant-owned operation must act on the restaurant identified by trusted server-side context and must verify the caller's authorization for that restaurant.

Never rely only on:
- A restaurant ID from the browser.
- A slug or hostname supplied in a body or query string.
- A frontend provider or route guard.
- A user's membership in some other restaurant.
- A default or primary restaurant fallback.

### Current implementation gap

The customer web application has a hostname resolver and restaurant context. The inspected Prisma schema does not include the planned `RestaurantDomain` model. Some customer cart, checkout, delivery-quote, and reservation controller paths use `PrimaryRestaurantService`. That behavior does not satisfy hostname-derived tenant isolation for storefront requests.

Do not claim production-ready domain tenancy until tenant resolution is implemented at the API boundary and verified end to end.

### Target tenant resolution

```text
Incoming request
    |
    v
Trusted, normalized host
    |
    v
Verified domain mapping
    |
    v
Restaurant ID
    |
    v
Restaurant status check
    |
    v
Authenticated caller / public route policy
    |
    v
Tenant-scoped service operation
```

The backend must define how it trusts proxy headers. Do not accept arbitrary forwarded host values from untrusted clients. Platform subdomains and custom domains should map through one domain-resolution service.

### Authorization requirements

- Enforce restaurant membership and permission checks server-side.
- Scope reads and writes to the authorized restaurant.
- Use the same not-found behavior where appropriate to avoid disclosing cross-tenant resources.
- Validate the relationship between a parent resource and child IDs. For example, a menu item must belong to the menu and restaurant in the current context.
- Cover realtime subscriptions, caches, uploads, exports, search, and background tasks with the same tenant boundary.
- Add negative tests for cross-tenant ID substitution.

## 7. Domain model and lifecycle

**Target:** introduce a domain mapping model only after confirming the final product requirements and checking for existing equivalents. A candidate model may contain:
- Unique normalized hostname.
- Restaurant relation.
- Domain type, such as platform subdomain or custom domain.
- Primary/canonical flag.
- Verification and activation state.
- Verification metadata and timestamps.

Enforce uniqueness in the database. Custom domain activation must require ownership verification. Prevent one hostname from being assigned to multiple restaurants. Define behavior for inactive restaurants, unknown hosts, redirects, and canonical URLs.

See [domain-routing.md](domain-routing.md) for detailed routing requirements.

## 8. Customer and management flows

The intended customer flow is:

```text
Discover restaurant
    -> Open restaurant storefront
    -> Browse menus
    -> Select item and options
    -> Create/update cart
    -> Revalidate price and availability
    -> Checkout
    -> Create order
    -> Start payment, when required
    -> Verify provider webhook
    -> Update payment and order state
    -> Show order status
```

The intended reservation flow is:

```text
Choose restaurant
    -> Check availability
    -> Submit reservation
    -> Validate restaurant and customer
    -> Persist reservation
    -> Show status and cancellation options
```

These are target flows. Verify each transition, authorization rule, persistence step, failure state, and external integration before describing the journey as complete.

## 9. Payments and transactional consistency

- The server calculates authoritative prices, taxes, fees, discounts, and totals.
- Revalidate item availability and price at checkout.
- Prevent duplicate orders and duplicate payment effects on retries.
- Verify payment provider webhook signatures using the raw request body where required by the provider.
- Persist provider event identifiers and handle repeated delivery idempotently.
- Define legal order and payment state transitions.
- Do not mark an order paid solely because the browser reports success.
- Keep secrets server-side and redact sensitive fields from logs.

## 10. API conventions

The API bootstrap configures a global `api` prefix and URI versioning with version 1 as the default. Confirm the exact route shape and any exceptions in the running application.

- Use DTO validation for untrusted input.
- Keep request and response contracts explicit.
- Use consistent HTTP status codes and error shapes.
- Add pagination and bounded filters to list endpoints where needed.
- Rate-limit sensitive and abuse-prone operations.
- Avoid exposing internal exception details.
- Keep frontend API services aligned with backend DTOs and response types.

## 11. Database and migrations

- Treat `packages/database/prisma` as the schema source.
- Inspect all split schema files before changing models.
- Generate Prisma artifacts using the repository's configured scripts.
- Commit reviewed migrations with schema changes.
- Preserve migration history.
- Test migrations against a disposable database before applying them to important data.
- Back up data before destructive operations.
- Avoid unbounded queries and N+1 loading patterns.
- Add indexes based on actual query patterns and constraints.

## 12. UI architecture and design system

Use `docs/DESIGN.md` as the source of truth for design tokens, typography, spacing, components, interaction states, and accessibility.

- Reuse `packages/ui` primitives across applications when framework and styling boundaries permit.
- Use CSS custom properties for semantic colors and shared visual decisions.
- Keep restaurant branding data-driven.
- Keep platform administration UI distinct from restaurant storefront branding while sharing core tokens and primitives.
- Avoid one-off component styles when an existing token or primitive solves the problem.
- Ensure keyboard access, visible focus, semantic markup, and clear error feedback.

## 13. Testing strategy

For meaningful changes, add or update tests at the relevant level:

- Unit tests for services, validation, permission logic, domain normalization, and state transitions.
- API integration tests for persistence and authorization.
- Cross-tenant negative tests for every tenant-scoped operation.
- Frontend tests for loading, empty, error, and successful states.
- End-to-end tests for sign-in, restaurant resolution, menu browsing, cart, checkout, payment status, and reservations as those flows become available.
- Webhook tests for invalid signatures, retries, duplicates, and unexpected event ordering.
- Migration and seed checks where schema changes occur.

Run the actual package scripts. Do not report a check as passing unless it was run and passed.

## 14. Observability and operations

- Use request IDs to connect logs to requests.
- Log useful operational events without secrets, payment details, or unnecessary personal data.
- Add health checks for service availability and dependencies where appropriate.
- Configure production secrets outside the repository.
- Restrict CORS and realtime origins to expected deployments.
- Review upload limits, storage permissions, file types, and public access rules.
- Define backup, restore, migration, and rollback procedures before production use.

## 15. Architecture decision order

When making a change, follow this order:

1. Preserve security and tenant isolation.
2. Preserve existing API and database contracts unless the task intentionally changes them.
3. Reuse current modules and packages.
4. Keep the smallest maintainable implementation.
5. Add tests that prove the behavior.
6. Update docs to match what the code now does.

Do not add advanced features to compensate for a broken tenant boundary. Fix and verify the core tenant-aware customer journey first.
