# Restaurant Platform Architecture

## Phase 0: platform and tenancy

The system has two customer-facing surfaces backed by one API and one
PostgreSQL database:

```text
Platform application (owner/admin)
        | authenticated user + restaurant membership
        v
NestJS API  ----  PostgreSQL
        ^
        | resolved restaurant tenant
        |
Restaurant website (customer)
```

### Platform

The platform application is the owner surface (`app.<platform-domain>`). It
handles authentication, restaurant selection, dashboards, catalog management,
orders, reservations, settings, and platform-level administration.

Platform roles are global `UserRole` records. Restaurant roles are scoped by a
`RestaurantMember` record. A user must have an active membership for the
restaurant named by a management request; a platform role must not be used as a
substitute for tenant membership unless the endpoint explicitly grants that
capability.

### Restaurant tenant

`Restaurant` is the tenant root. Tenant-owned records must reference it through
`restaurantId`, including menus, categories, menu items, carts, orders,
reservations, reviews, addresses, settings, media, and activity logs.

`slug` is the stable platform/public identifier and is unique. A custom domain
is a separate deployment concern and should be resolved to a restaurant before
calling tenant-scoped services. When custom domains are implemented, prefer a
separate `RestaurantDomain` model so one restaurant can have a primary domain,
aliases, verification state, and safe domain ownership transitions. Do not use
the request `Host` value directly in database queries.

### Restaurant owner

The ownership relationship is:

```text
User -> RestaurantMember -> Restaurant
                  |
                  +-> Role (restaurant scope, e.g. OWNER, MANAGER, STAFF)
```

The existing membership and permission system remains the authorization
boundary. Restaurant management routes should carry an explicit
`restaurantId` (or a server-resolved tenant context) and enforce membership
before the service reads or writes data.

### Customer

Customers enter through a restaurant slug or resolved custom domain. The public
flow is:

```text
restaurant identity -> public menu -> cart -> checkout -> order
```

Customer authentication is optional for browsing and ordering. Guest identity,
when supported, must be represented by a server-issued checkout/session token
or an equivalent persisted identity; it must not be inferred from a fabricated
user id or localStorage-only success state. Every cart and order remains tied to
the resolved `restaurantId`.

## Request invariants

1. Resolve the restaurant once at the API boundary from an explicit restaurant
   identifier or a verified domain mapping.
2. Pass the resolved tenant context into services; do not trust a client-supplied
   restaurant id after resolving a domain.
3. Scope every tenant-owned read, write, and authorization check by
   `restaurantId`.
4. Keep platform authorization (`UserRole`) separate from restaurant
   authorization (`RestaurantMember`).
5. Public customer endpoints may omit authentication, but they may not omit
   restaurant context.

## Implementation order

1. Add a reusable API tenant-resolution contract and restaurant context.
2. Add verified custom-domain storage and lookup when custom websites are ready.
3. Expose public restaurant/menu endpoints using slug or resolved domain.
4. Keep owner dashboards on explicit membership-protected restaurant routes.
5. Validate cross-tenant isolation, guest checkout, stale carts, and duplicate
   checkout before calling the platform production-ready.
