# Restaurant Domain Routing

## 1. Purpose

Restaurant Platform uses domain-based tenant resolution.

Each restaurant can have its own storefront domain.

A restaurant can use:

```text
Platform subdomain:
pizza-house.yourplatform.com

Custom domain:
www.pizzahouse.fi
```

Both domains identify the same restaurant tenant.

## 2. Core Principle

The domain is not the tenant.

The domain resolves to the tenant.

```text
Hostname
   ↓
RestaurantDomain
   ↓
Restaurant
   ↓
Restaurant Context
```

Never use the hostname directly as a database tenant identifier.

## 3. Domain Model

Conceptually:

```text
Restaurant
    │
    │ 1:N
    ▼
RestaurantDomain
```

A restaurant can have multiple domains.

Example:

```text
Restaurant
id: restaurant_123
name: Pizza House
slug: pizza-house
```

Domains:

```text
pizza-house.yourplatform.com
www.pizzahouse.fi
pizzahouse.fi
```

All domains resolve to:

```text
restaurantId = restaurant_123
```

## 4. RestaurantDomain

The domain model should support information similar to:

```text
RestaurantDomain

id
restaurantId
domain
type
isPrimary
isVerified
verificationToken
createdAt
updatedAt
```

Domain types:

```text
PLATFORM
CUSTOM
```

The exact Prisma model should follow the existing database schema conventions.

Do not introduce a duplicate domain model if one already exists.

## 5. Domain Resolution

The basic resolution flow is:

```text
HTTP Request
     ↓
Host Header
     ↓
Normalize Hostname
     ↓
Find RestaurantDomain
     ↓
Find Restaurant
     ↓
Validate Restaurant Status
     ↓
Create Restaurant Context
     ↓
Continue Request
```

Example:

```text
Request Host:
www.pizzahouse.fi

        ↓

RestaurantDomain:
www.pizzahouse.fi

        ↓

restaurantId:
restaurant_123

        ↓

Restaurant:
Pizza House

        ↓

Restaurant Context
```

## 6. Hostname Normalization

Before lookup, normalize the hostname.

The resolver should account for:

* Lowercase hostnames
* Optional `www`
* Development ports
* Platform domains
* Custom domains

Do not store inconsistent representations of the same domain.

The canonical storage format should be defined before implementing domain management.

## 7. Unknown Domains

If a hostname does not resolve to a restaurant:

```text
Unknown Domain
      ↓
404 / Platform Not Found
```

Do not guess a restaurant.

Do not fall back to a random restaurant.

Do not expose another restaurant's storefront.

## 8. Disabled Restaurants

A domain may resolve correctly while the restaurant is inactive.

Example:

```text
Domain
   ↓
Restaurant
   ↓
status = DISABLED
```

The storefront must not operate normally.

The API and storefront should use the restaurant status rules defined by the platform.

## 9. Primary Domain

Each restaurant should have one primary storefront domain.

Example:

```text
Pizza House

Primary:
www.pizzahouse.fi

Other:
pizzahouse.fi
pizza-house.yourplatform.com
```

The primary domain should be used for canonical URLs and SEO.

## 10. Domain Verification

Custom domains require verification before activation.

Expected lifecycle:

```text
PENDING
   ↓
VERIFYING
   ↓
VERIFIED
   ↓
ACTIVE
```

Failure states may include:

```text
FAILED
DISABLED
```

The platform should never activate an unverified custom domain.

## 11. DNS

The exact DNS configuration depends on the production infrastructure.

The admin portal should eventually provide restaurant owners with clear DNS instructions.

Example:

```text
Type: CNAME
Name: www
Value: domains.yourplatform.com
```

Do not hardcode DNS instructions in multiple frontend components.

Centralize domain configuration.

## 12. SSL

Production custom domains must use HTTPS.

SSL provisioning should be handled by the deployment or edge infrastructure.

The application should not implement TLS itself.

The application is responsible for recognizing the resolved hostname and restaurant.

## 13. Next.js Architecture

The customer web application should resolve the restaurant from the hostname before loading restaurant-specific content.

Conceptually:

```text
Incoming Request
      ↓
Next.js
      ↓
Hostname Resolver
      ↓
Restaurant Context
      ↓
Storefront
```

The implementation may use middleware, server-side request handling, or the hosting provider's routing capabilities.

Choose the implementation based on the actual production deployment environment.

Do not duplicate domain resolution logic across pages.

## 14. API Architecture

The API must also enforce tenant context.

The API should not trust a restaurant ID supplied by an unauthenticated customer request.

Restaurant-specific resources should be resolved using the appropriate tenant context.

For protected admin operations:

```text
Authenticated User
        ↓
Restaurant Membership
        ↓
Restaurant Role
        ↓
Authorization
        ↓
Restaurant Resource
```

## 15. Customer Access

A customer can reach a restaurant in two ways.

### Platform Discovery

```text
yourplatform.com/restaurants
        ↓
Pizza House
        ↓
pizza-house.yourplatform.com
```

### Direct Domain

```text
www.pizzahouse.fi
        ↓
Pizza House storefront
```

The customer does not need to enter a restaurant ID.

## 16. Storefront URL Structure

The preferred customer experience is:

```text
www.pizzahouse.fi/
www.pizzahouse.fi/menu
www.pizzahouse.fi/cart
www.pizzahouse.fi/checkout
www.pizzahouse.fi/orders
```

The restaurant context comes from the hostname.

Avoid:

```text
yourplatform.com/restaurants/pizza-house/menu
```

as the primary production storefront URL.

A platform discovery route may still exist for discovering restaurants.

## 17. Domain Aliases

Multiple domains may point to one restaurant.

Example:

```text
pizza-house.yourplatform.com
www.pizzahouse.fi
pizzahouse.fi
order.pizzahouse.fi
```

All should resolve to the same restaurant.

One domain should be marked as primary.

Non-primary domains may redirect to the primary domain.

## 18. Security Requirements

Domain routing must never allow cross-tenant access.

The following must not be possible:

```text
Restaurant A domain
        ↓
Restaurant B menu
```

or:

```text
Restaurant A domain
        ↓
Change restaurantId
        ↓
Access Restaurant B
```

Tenant identity must be resolved and validated server-side.

## 19. Caching

Tenant-specific responses must not be cached across restaurants.

For example:

```text
Pizza House
```

data must never be served to:

```text
Burger House
```

Cache keys should include the relevant tenant identity where tenant-specific data is cached.

CDN and Next.js caching must be configured with domain-based tenant separation in mind.

## 20. SEO

Each restaurant should eventually have its own:

* Metadata
* Title
* Description
* Open Graph information
* Sitemap
* Robots configuration
* Canonical URL

The primary domain should be used as the canonical storefront URL.

## 21. Development

Local development must support testing multiple restaurants.

Possible development domains include:

```text
pizza-house.localhost
burger-house.localhost
```

or another development-domain strategy supported by the local environment.

The development implementation should mimic production hostname resolution as closely as practical.

Do not build a development-only architecture that cannot support production custom domains.

## 22. Admin Domain Management

Restaurant owners should eventually manage domains through:

```text
Admin
  ↓
Restaurant
  ↓
Settings
  ↓
Domains
```

The domain management interface should support:

```text
Add domain
Verify domain
Set primary
Remove domain
View status
View DNS instructions
```

## 23. Domain Lifecycle

The expected lifecycle is:

```text
Restaurant Created
       ↓
Platform Domain Generated
       ↓
Storefront Available
       ↓
Owner Adds Custom Domain
       ↓
DNS Configuration
       ↓
Verification
       ↓
SSL
       ↓
Domain Active
       ↓
Set Primary
```

The platform domain should remain available as a fallback unless explicitly disabled by future product rules.

## 24. Future Extensions

The architecture should allow:

* Custom domains
* Multiple domains
* Subdomains
* Domain aliases
* Domain verification
* SSL
* Canonical redirects
* Restaurant-specific SEO
* Restaurant branding
* Restaurant analytics
* Domain transfer
* Domain removal

Do not implement all future capabilities at once.

The current implementation should establish a clean tenant-resolution boundary that supports these capabilities later.
