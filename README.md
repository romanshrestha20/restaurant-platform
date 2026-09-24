# Restaurant Platform

A multi-tenant SaaS platform for restaurants, built as a TypeScript monorepo.

The project provides the foundation for restaurant storefronts, restaurant administration, authentication, menus, carts, orders, payments, reservations, and tenant-aware domain routing.

## Current status

This project is under active development.

The repository already contains a working application architecture with:

- A Next.js customer storefront
- A NestJS API
- PostgreSQL and Prisma database infrastructure
- Restaurant and catalog APIs
- Menu management APIs
- Authentication and role-based authorization
- Cart, order, payment, and reservation modules
- Tenant-aware restaurant resolution
- Shared UI and database packages
- pnpm workspaces and Turborepo

Some product areas and production infrastructure are still being expanded.

## Architecture

The platform is organized as a monorepo:

```text
restaurant-platform/
├── apps/
│   ├── web/                 # Customer-facing Next.js application
│   ├── api/                 # NestJS backend API
│   └── admin/               # Restaurant/platform administration
│
├── packages/
│   ├── database/            # Prisma client and database infrastructure
│   ├── auth/                # Shared authentication package
│   ├── validation/          # Shared validation
│   ├── types/               # Shared TypeScript types
│   ├── typescript-config/   # Shared TypeScript configuration
│   └── ui/                  # Shared React UI components
│
├── docs/
│   ├── architecture.md
│   └── domain-routing.md
│
├── docker/
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Technology stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- React Hook Form
- Zod
- Axios
- Lucide React

### Backend

- NestJS 11
- TypeScript
- Express
- Prisma
- PostgreSQL
- JWT
- Passport
- Socket.IO
- Jest
- Supertest

### Platform infrastructure

- pnpm 12
- Turborepo
- Docker
- Cloudinary for configurable image storage
- Stripe provider integration
- SMTP email support

## Applications

### Customer web

`apps/web`

The web application is the customer-facing storefront.

The current architecture supports:

- Restaurant discovery
- Restaurant storefronts
- Restaurant information and branding
- Menu browsing
- Category navigation
- Cart functionality
- Checkout flows
- Customer authentication
- Customer account and order flows

The storefront is designed to be tenant-aware. Restaurant identity can be resolved from the request hostname rather than requiring the customer to supply a restaurant ID.

Example domains:

```text
pizza-house.yourplatform.com
www.pizzahouse.fi
```

### API

`apps/api`

The API is the central business-logic and security boundary.

Implemented NestJS modules include:

- Health
- Authentication
- Profile
- Restaurants
- Menu
- Catalog
- Cart
- Orders
- Payments
- Reservations
- Realtime/WebSockets

The API also includes:

- Request validation
- Global exception handling
- Rate limiting
- CORS configuration
- Same-origin protection
- Helmet security headers
- Compression
- Request IDs
- Cookie parsing
- Configurable file uploads

### Admin

`apps/admin`

The repository contains a separate Next.js admin application intended for restaurant and platform administration.

The admin application communicates with the API rather than accessing PostgreSQL directly.

The administration surface is still under development.

## Multi-tenant architecture

The core tenant is the restaurant.

Conceptually:

```text
Restaurant
├── Restaurant domains
├── Restaurant members
├── Menus
├── Categories
├── Menu items
├── Carts
├── Orders
└── Reservations
```

The domain is an entry point to a tenant. It is not the tenant itself.

The intended resolution flow is:

```text
Hostname
   ↓
Restaurant domain
   ↓
Restaurant
   ↓
Restaurant context
   ↓
Tenant-aware application request
```

This allows the same application to serve multiple restaurants while keeping restaurant-specific data isolated.

Detailed routing rules are documented in `docs/domain-routing.md`.

## Authentication and authorization

Authentication and authorization are handled by the API.

The authentication module currently includes:

- Access tokens
- Refresh tokens
- JWT strategies
- Password handling
- Account recovery
- Email verification/recovery support
- Authentication guards
- Platform permission checks
- Restaurant role checks

The architecture separates:

```text
Authentication
Who is the user?

Authorization
What can the user access or change?
```

Restaurant authorization is scoped to the restaurant membership rather than relying on frontend checks.

## Restaurant catalog and menus

The API contains separate restaurant, catalog, and menu modules.

The customer storefront can load restaurant-specific catalog data through the API.

Menu functionality includes support for:

- Menus
- Categories
- Menu items
- Menu availability
- Menu repositories and services
- Image uploads
- Realtime integration

The web application uses feature-oriented frontend code rather than putting restaurant business logic directly into page components.

## Cart, orders, payments, and reservations

The API contains dedicated modules for the customer ordering lifecycle.

```text
Restaurant
   ↓
Menu
   ↓
Cart
   ↓
Checkout
   ↓
Order
   ↓
Payment
```

Orders integrate with menu availability, restaurants, payments, and realtime functionality.

The payment layer supports a provider abstraction. A no-op provider is available when Stripe credentials are not configured, while the Stripe provider can be selected when a Stripe secret key is present.

Reservations are implemented as a separate API module.

## Database

PostgreSQL is the primary database.

Prisma is used for database access through:

```text
packages/database/
```

The database package provides:

- Prisma client
- PostgreSQL adapter
- Database migration commands
- Database deployment commands
- Seed commands
- Prisma Studio support

Applications should access the database through the shared database package and the API boundary.

## Security

Security is enforced primarily at the API boundary.

The current API bootstrap includes:

- Global request validation
- Whitelisted DTO properties
- Rejection of non-whitelisted properties
- CORS with credentials
- Same-origin middleware
- Helmet
- Request throttling
- Secure authentication guards
- Global exception handling

Tenant isolation is a core architectural requirement.

Client-provided restaurant identifiers and frontend authorization decisions must not be treated as security boundaries.

## Realtime

The backend includes Socket.IO and a custom NestJS realtime adapter.

Realtime functionality is integrated into the application architecture for areas such as menu and order workflows.

## File uploads

The API supports configurable upload storage.

Supported providers are:

- Cloudinary
- Local filesystem storage

Cloudinary is the default storage provider outside test environments when the required credentials are configured.

## Project commands

Install dependencies:

```bash
pnpm install
```

Run the monorepo in development:

```bash
pnpm dev
```

Build all applications and packages:

```bash
pnpm build
```

Run linting:

```bash
pnpm lint
```

Run type checking:

```bash
pnpm typecheck
```

Run tests:

```bash
pnpm test
```

Clean build outputs:

```bash
pnpm clean
```

Run an individual application:

```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter admin dev
```

## Database commands

Database commands are provided by `@restaurant/database`.

Generate the Prisma client:

```bash
pnpm --filter @restaurant/database generate
```

Create and apply a development migration:

```bash
pnpm --filter @restaurant/database migrate
```

Deploy migrations:

```bash
pnpm --filter @restaurant/database deploy
```

Seed the database:

```bash
pnpm --filter @restaurant/database seed
```

Open Prisma Studio:

```bash
pnpm --filter @restaurant/database studio
```

## Environment configuration

The API validates its environment configuration at startup.

Core configuration includes:

```text
NODE_ENV
PORT
DATABASE_URL
CLIENT_URL

JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_TTL_SECONDS
JWT_REFRESH_TTL_SECONDS

MAIL_MODE
MAIL_FROM
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD

UPLOAD_STORAGE_PROVIDER
UPLOAD_LOCAL_DIR
UPLOAD_PUBLIC_URL

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

Database access and JWT secrets are required.

Cloudinary, SMTP, and Stripe configuration depends on the features and environment being used.

Do not commit real secrets to Git.

## Development architecture

The intended request flow is:

```text
Browser
   ↓
Restaurant/domain resolution
   ↓
Next.js feature
   ↓
API client
   ↓
NestJS controller
   ↓
Guards and validation
   ↓
NestJS service
   ↓
Database package
   ↓
Prisma
   ↓
PostgreSQL
```

The API remains the main business-logic and authorization boundary.

## Documentation

Architecture documentation:

`docs/architecture.md`

Domain and tenant routing:

`docs/domain-routing.md`

Frontend development rules:

`AGENTS.md`

These documents describe architectural boundaries and development conventions in more detail.

## Roadmap

The architecture is being developed toward a complete restaurant SaaS platform.

Planned and expanding areas include:

- Complete restaurant administration
- Restaurant domain management
- Custom domain verification
- Restaurant branding and settings
- Complete ordering and checkout experience
- Production payment flows
- Reservation management
- Restaurant analytics
- SEO and restaurant-specific metadata
- Production deployment and infrastructure
- Expanded automated test coverage

These items represent the development direction. They should not be interpreted as already implemented features.

## License

This project is currently under development. License and distribution terms will be defined before a public production release.
