# AGENTS.md

## Purpose

`apps/web` is the customer-facing storefront for the Restaurant Platform.

It provides the customer experience for restaurant discovery, restaurant storefronts, menus, carts, checkout, orders, and customer accounts.

The application is multi-tenant.

The restaurant is resolved from the request hostname.

## Technology

Use the technologies already configured in this workspace:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* TanStack Query
* pnpm

Do not replace the existing framework or introduce another frontend framework.

## Application Architecture

Follow:

```text
Browser
   ↓
Hostname
   ↓
Restaurant Resolver
   ↓
Restaurant Context
   ↓
Next.js Page
   ↓
Feature
   ↓
Hook
   ↓
API Service
   ↓
API Client
   ↓
NestJS API
```

Pages should compose features.

Features contain customer functionality.

API infrastructure belongs in the API layer.

Do not put backend business logic in the web application.

## Restaurant Context

Restaurant identity comes from the hostname.

Examples:

```text
pizza-house.yourplatform.com
www.pizzahouse.fi
```

The hostname resolves to a restaurant.

Conceptually:

```text
Hostname
   ↓
RestaurantDomain
   ↓
Restaurant
   ↓
RestaurantContext
```

Do not hardcode restaurant IDs.

Do not hardcode restaurant names.

Do not require customers to provide `restaurantId` manually when the domain already identifies the restaurant.

## Domain Architecture

Read and follow:

```text
docs/architecture.md
docs/domain-routing.md
```

Do not implement domain resolution independently in multiple pages or features.

Create one reusable restaurant-resolution mechanism.

The implementation should support platform subdomains first and remain compatible with future custom domains.

## Routing

Restaurant storefronts should be accessible through the restaurant hostname.

Preferred production URLs:

```text
https://pizza-house.yourplatform.com/
https://www.pizzahouse.fi/
```

Restaurant-specific pages can use paths:

```text
/menu
/cart
/checkout
/orders
/account
```

The hostname provides restaurant identity.

Do not make this the primary architecture:

```text
/restaurants/[slug]
```

A platform-level discovery page may still exist:

```text
yourplatform.com/restaurants
```

Selecting a restaurant should lead to its restaurant storefront domain.

## Directory Structure

Use feature-oriented organization.

```text
src/
│
├── app/
│
├── features/
│   ├── restaurant/
│   ├── menu/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── account/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── navigation/
│
├── lib/
│   ├── api/
│   ├── auth/
│   └── restaurant/
│
└── providers/
```

Follow existing directories before creating new ones.

Do not create duplicate folders for the same responsibility.

## App Directory

Use `src/app/` for:

* Routes
* Layouts
* Loading states
* Error boundaries
* Route-level composition

Do not put large business logic directly inside page components.

Example:

```text
app/
├── layout.tsx
├── page.tsx
├── cart/
│   └── page.tsx
├── checkout/
│   └── page.tsx
├── orders/
│   └── page.tsx
└── account/
    └── page.tsx
```

## Features

Customer functionality belongs under:

```text
src/features/
```

Example:

```text
features/menu/
├── components/
├── hooks/
├── services/
├── types/
└── utils/
```

Use the same structure only when the feature actually needs those layers.

Do not create empty directories without a purpose.

## Restaurant Feature

The restaurant feature owns restaurant storefront concerns such as:

* Restaurant information
* Restaurant branding
* Restaurant status
* Restaurant settings exposed to customers
* Restaurant context helpers

It must not contain database access.

## Menu Feature

The menu feature owns:

* Menus
* Categories
* Menu items
* Variants
* Add-ons
* Menu presentation

Menu data must come from the API.

Do not create hardcoded production menu data.

## Cart Feature

The cart feature owns:

* Cart state
* Cart items
* Quantity changes
* Item removal
* Cart totals
* Cart validation

Do not mix cart state with restaurant discovery logic.

The cart must remain associated with the correct restaurant.

## Checkout Feature

The checkout feature owns:

* Checkout UI
* Customer information
* Delivery or pickup information
* Order confirmation
* Payment initiation

Payment processing must be handled by the API and payment infrastructure.

Never implement secret payment credentials in the frontend.

## Orders Feature

The orders feature owns:

* Order history
* Order details
* Order status
* Customer-facing order tracking

Restaurant and customer authorization must be enforced by the API.

## API Layer

All backend requests must use the centralized API infrastructure.

Use:

```text
src/lib/api/
```

Do not create random `fetch()` calls throughout components.

Before creating a new API service:

1. Check the existing API client.
2. Check existing error handling.
3. Check existing types.
4. Check whether the endpoint is already implemented.

## Data Fetching

Use TanStack Query for server state where appropriate.

Do not create a second caching or server-state system.

Keep query keys predictable and tenant-aware where necessary.

Tenant-specific data must never leak between restaurants through client or server caching.

## Error Handling

Use the existing API error normalization.

Handle relevant states:

```text
Loading
Error
Empty
Success
```

Do not expose internal API, database, or stack-trace information to customers.

## Authentication

Use the existing authentication architecture.

Do not implement a separate authentication mechanism inside a feature.

Authentication determines the user identity.

Restaurant authorization remains a backend responsibility.

Never assume that hiding a UI element provides authorization.

## UI

Use existing shared UI components where possible.

Check:

```text
packages/ui/
```

before creating reusable components.

Do not introduce a new UI library without explicit approval.

Keep components focused.

Prefer:

```text
Page
  ↓
Feature Component
  ↓
Feature Hook
  ↓
Service
```

instead of placing everything in a single page component.

## Styling

Use the existing Tailwind CSS v4 configuration.

Do not introduce another CSS framework.

Follow the existing design system and shared UI patterns.

Do not introduce arbitrary global styles when a component-level solution is appropriate.

## Types

Use TypeScript strictly.

Avoid `any`.

Reuse shared types from:

```text
packages/types/
```

when appropriate.

Do not duplicate API response types unnecessarily.

If the API contract changes, update all affected consumers.

## API Contract Changes

When a frontend feature requires an API contract change:

1. Inspect the existing API implementation.
2. Confirm that the existing API cannot satisfy the requirement.
3. Update the API contract.
4. Update API types.
5. Update the web client.
6. Update affected tests.
7. Run validation.

Do not silently invent frontend assumptions about API responses.

## Caching and Tenant Isolation

Tenant-specific data must remain isolated.

Never allow:

```text
Pizza House data
      ↓
Burger House storefront
```

through:

* React Query cache
* Next.js cache
* Server cache
* CDN cache
* Browser state

Include restaurant context in cache/query identity where required.

## Customer Experience

The customer flow should follow:

```text
Restaurant Storefront
       ↓
Menu
       ↓
Menu Item
       ↓
Cart
       ↓
Checkout
       ↓
Order
       ↓
Order History
```

Keep the flow consistent across restaurant domains.

## Development

Use pnpm.

Examples:

```bash
pnpm --filter web dev
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web test
pnpm --filter web build
```

Do not use npm or yarn.

## Testing

Use the testing framework already configured in the workspace.

Before adding tests:

1. Inspect the existing test setup.
2. Follow existing conventions.
3. Reuse existing test utilities.
4. Add tests for new business logic.

Important areas include:

* Domain resolution
* Restaurant context
* API client
* Menu fetching
* Cart behavior
* Checkout behavior
* Authentication
* Error states

Do not remove tests to make implementation pass.

## Protected Operations

Do not modify these for unrelated frontend tasks:

```text
apps/api/
packages/database/prisma/
docker/
.env
.env.*
```

Do not modify database schema or API behavior unless the requested feature genuinely requires it.

Never modify real secrets.

## Dependencies

Do not add dependencies without checking whether the repository already provides the required functionality.

Do not replace existing libraries unnecessarily.

Do not upgrade major framework dependencies as part of a feature task.

## Agent Workflow

Before implementing a feature:

1. Read the root `AGENTS.md`.
2. Read this file.
3. Read `docs/architecture.md`.
4. Read `docs/domain-routing.md`.
5. Inspect the existing web application.
6. Inspect the relevant API endpoint.
7. Inspect shared packages.
8. Search for existing implementations.
9. Implement the smallest appropriate change.
10. Run relevant validation.
11. Review the final diff.

Do not guess when the repository can answer the question.

Do not refactor unrelated code.

Do not create parallel implementations of existing functionality.

## Completion Report

After completing a task, report:

```text
Changed:
- files created
- files modified

Architecture:
- relevant architectural decisions

Validation:
- commands executed
- results

Remaining:
- unfinished work
- known limitations
```

Never claim validation passed unless the command was actually executed.
