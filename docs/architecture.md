# Restaurant Platform Architecture

## 1. Overview

Restaurant Platform is a multi-tenant SaaS platform for restaurants.

The platform provides:

* Customer-facing restaurant storefronts
* Restaurant administration
* Platform administration
* Menu and catalog management
* Cart and checkout
* Orders
* Payments
* Reservations
* Customer accounts
* Restaurant-specific domains

The architecture is based on a central NestJS API, shared packages, PostgreSQL, and separate Next.js applications for customers and administrators.

## 2. Monorepo

The repository is managed with pnpm workspaces and Turborepo.

```text
restaurant-platform/
│
├── apps/
│   ├── api/
│   ├── web/
│   └── admin/
│
├── packages/
│   ├── database/
│   ├── auth/
│   ├── validation/
│   ├── types/
│   ├── typescript-config/
│   └── ui/
│
├── docs/
├── docker/
│
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 3. Applications

### 3.1 API

Location:

```text
apps/api/
```

Technology:

* NestJS
* TypeScript
* Prisma
* PostgreSQL
* JWT authentication
* WebSockets

Entry points:

```text
apps/api/src/main.ts
apps/api/src/app.module.ts
```

The API is the central application and business logic boundary.

The API provides REST endpoints and WebSocket functionality for the web and admin applications.

Main domain modules include:

```text
auth
users
profile
restaurants
catalog
menu
cart
orders
payments
reservations
health
```

### 3.2 Customer Web

Location:

```text
apps/web/
```

Technology:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* TanStack Query

The web application is the customer-facing storefront.

Customers use it to:

* Discover restaurants
* Visit restaurant storefronts
* Browse menus
* Select menu items
* Manage carts
* Checkout
* View orders
* Manage their account

The customer storefront is tenant-aware.

A restaurant is identified primarily through the request hostname.

Examples:

```text
pizza-house.yourplatform.com
www.pizzahouse.fi
```

The web application must not contain restaurant-specific hardcoded configuration.

### 3.3 Admin

Location:

```text
apps/admin/
```

Technology:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4

The admin application is used by:

* Platform administrators
* Restaurant owners
* Restaurant managers
* Restaurant staff

Main areas include:

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

The admin application communicates with the API.

It must not access the database directly.

## 4. High-Level Architecture

```text
                         INTERNET
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      Platform Website              Restaurant Storefront
     yourplatform.com              restaurant.yourplatform.com
             │                             │
             │                      www.restaurant.fi
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                    Domain Resolution
                            │
                            ▼
                   Restaurant Context
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
        Customer Web                  Admin Portal
        apps/web                    apps/admin
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                       NestJS API
                       apps/api
                            │
                            ▼
                   Database Package
                   packages/database
                            │
                            ▼
                       PostgreSQL
```

## 5. Tenant Model

The Restaurant entity is the tenant root.

Restaurant-owned resources must belong to a restaurant.

Conceptually:

```text
Restaurant
│
├── RestaurantDomain
├── RestaurantMember
├── Settings
├── Menus
├── Categories
├── MenuItems
├── Variants
├── AddOns
├── Carts
├── Orders
└── Reservations
```

Restaurant isolation must be maintained across all tenant-owned resources.

Do not use hardcoded restaurant IDs or restaurant names.

## 6. Domain Based Restaurant Access

A restaurant is accessed through a domain.

Platform-provided domain:

```text
pizza-house.yourplatform.com
```

Custom domain:

```text
www.pizzahouse.fi
```

Both resolve to the same restaurant.

```text
Domain
   ↓
RestaurantDomain
   ↓
Restaurant
   ↓
Restaurant Context
```

The domain is an entry point to the tenant. It is not the tenant itself.

Detailed domain behavior is documented in:

```text
docs/domain-routing.md
```

## 7. Tenant Context

After resolving the hostname, the application establishes a restaurant context.

Conceptually:

```text
RestaurantContext {
    restaurantId
    restaurantSlug
    restaurantName
    domain
    status
}
```

Restaurant-specific operations should use this context.

The customer should not need to provide a restaurant ID manually.

Avoid URLs such as:

```text
/restaurants/pizza-house?restaurantId=123
```

when the restaurant can be identified from the hostname.

## 8. Customer Request Flow

The normal customer data flow is:

```text
Browser
   ↓
Restaurant Domain
   ↓
Domain Resolver
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
NestJS Controller
   ↓
Guards / Validation
   ↓
NestJS Service
   ↓
Database Package
   ↓
Prisma
   ↓
PostgreSQL
```

Each layer should have a clear responsibility.

## 9. Admin Request Flow

```text
Admin Page
   ↓
Admin Feature
   ↓
Admin API Client
   ↓
NestJS Controller
   ↓
Authentication
   ↓
Authorization
   ↓
NestJS Service
   ↓
Database Package
   ↓
Prisma
   ↓
PostgreSQL
```

The API is responsible for enforcing authorization.

Frontend protection is not a security boundary.

## 10. Authentication

Authentication answers:

```text
Who is the user?
```

Authorization answers:

```text
What can the user do?
Which restaurant can the user access?
```

The platform supports global user roles and restaurant-scoped membership.

Conceptually:

```text
User
│
├── Platform Role
│
└── Restaurant Memberships
    │
    ├── Restaurant A → OWNER
    ├── Restaurant B → MANAGER
    └── Restaurant C → STAFF
```

Restaurant-level authorization must be enforced by the API.

Existing authorization infrastructure is located under:

```text
apps/api/src/common/guards/
apps/api/src/common/decorators/
```

## 11. Backend Architecture

The API follows NestJS module architecture.

```text
apps/api/src/
│
├── main.ts
├── app.module.ts
│
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   └── middleware/
│
└── modules/
    ├── auth/
    ├── users/
    ├── profile/
    ├── restaurants/
    ├── catalog/
    ├── menu/
    ├── cart/
    ├── orders/
    ├── payments/
    ├── reservations/
    └── health/
```

A typical module contains:

```text
restaurants/
├── restaurants.module.ts
├── restaurants.controller.ts
├── restaurants.service.ts
├── dto/
└── ...
```

Controllers handle HTTP concerns.

Services contain business logic.

Guards handle authorization.

DTOs define request boundaries.

## 12. Frontend Architecture

The customer application uses feature-oriented organization.

```text
apps/web/src/
│
├── app/
├── features/
│   ├── restaurant/
│   ├── menu/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── account/
│
├── components/
├── lib/
└── providers/
```

Responsibilities:

```text
app/
    Routing and page composition

features/
    Feature-specific functionality

components/
    Reusable UI

lib/
    Infrastructure and shared utilities

providers/
    Application-level providers
```

## 13. Shared Packages

### database

Owns:

* Prisma client
* Database schema
* Migrations
* Seeds
* Database adapters

Location:

```text
packages/database/
```

### auth

Contains shared authentication primitives.

### validation

Contains shared validation schemas and utilities.

### types

Contains shared TypeScript types.

### ui

Contains reusable UI components and design primitives.

### typescript-config

Contains shared TypeScript configurations.

## 14. Database Architecture

PostgreSQL is the primary database.

Prisma is used as the ORM.

Database access belongs to:

```text
packages/database/
```

Applications must not create independent Prisma clients.

Applications must not access PostgreSQL directly.

The normal flow is:

```text
Application
   ↓
NestJS API
   ↓
Database Package
   ↓
Prisma
   ↓
PostgreSQL
```

## 15. Security Boundaries

Security boundaries exist at the API.

The API must enforce:

* Authentication
* Restaurant authorization
* Platform authorization
* Input validation
* Tenant isolation
* Rate limiting
* Secure error handling

Never trust:

* Restaurant IDs supplied by clients
* User roles supplied by clients
* Tenant identifiers supplied in request bodies
* Frontend authorization decisions

## 16. Customer URL Architecture

Platform-level pages may use the platform domain:

```text
yourplatform.com
yourplatform.com/restaurants
```

Restaurant storefronts use restaurant-specific domains:

```text
pizza-house.yourplatform.com
www.pizzahouse.fi
```

The restaurant domain should represent the storefront.

The application should avoid making the restaurant slug the primary customer-facing identity.

## 17. Production Architecture

The target production architecture is:

```text
                         DNS
                          │
             ┌────────────┴────────────┐
             │                         │
      Platform Domain           Restaurant Domains
             │                         │
             └────────────┬────────────┘
                          │
                    CDN / Edge
                          │
                  Domain Resolution
                          │
             ┌────────────┴────────────┐
             │                         │
          Next.js                  NestJS API
          Web App                     │
             │                 ┌───────┼───────┐
             │                 │       │       │
             │               Auth   Business WebSocket
             │                         │
             └────────────┬────────────┘
                          │
                        Prisma
                          │
                     PostgreSQL
```

## 18. Architectural Principles

The project should follow these principles:

1. Restaurant is the tenant.
2. Domain resolves the tenant.
3. API is the business logic boundary.
4. Database access belongs to the database package.
5. Authentication and authorization are separate concerns.
6. Tenant isolation must be enforced server-side.
7. Web and admin applications communicate through the API.
8. Features should remain modular.
9. Shared functionality belongs in shared packages.
10. Restaurant-specific behavior must be data-driven.
11. Avoid unnecessary coupling between applications.
12. Prefer existing project patterns over introducing new patterns.

## 19. Evolution

The architecture should support future capabilities such as:

* Custom domains
* Multiple domains per restaurant
* Restaurant branding
* Restaurant-specific SEO
* Restaurant-specific analytics
* Multiple restaurant memberships
* Online ordering
* Reservations
* Delivery integrations
* Payment providers
* Notifications
* Restaurant-specific configuration

Future features should extend the existing architecture instead of introducing parallel systems.
