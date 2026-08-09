# Feature architecture

Each domain owns its UI, business hooks, API services, state, and types. App
Router files only select a feature component.

```text
src/
├── app/                         # routing and layouts only
├── components/ui/               # shared design-system primitives
├── lib/
│   ├── api/                     # centralized fetch client and errors
│   └── store/                   # typed external-store utility
├── modules/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   └── user/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       └── types/
└── providers/                   # application-wide provider composition
```

## Data flow

```text
Component → feature hook → feature service → API client → backend
Backend response → feature hook → feature store → subscribed component
```

Components never import the API client or a feature service. Services contain
endpoint details, hooks coordinate validation and mutations, and stores expose
the last server-confirmed global state.

## Login example

`LoginPage` calls `useLoginForm().submit`. The form hook validates input and
calls `useAuth().login`; `useAuth` calls `authService.login`; the service uses
the shared `apiClient`; and the resulting user/token are committed to
`authStore` before subscribed UI rerenders.

## Profile update example

`ProfilePage` calls `useUser().updateProfile(changes)`. The hook calls
`userService.updateProfile`, stores the fresh API response in `userStore`, and
synchronizes the summary name and verification state in `authStore`.

## Session persistence

Access tokens remain in memory rather than local storage. `AuthProvider`
invokes the bootstrap hook once, which exchanges the existing HTTP-only refresh
cookie for a new access token. The API client performs one deduplicated refresh
and retry after an authenticated request receives `401`.

React Query is intentionally not installed because server data is currently
small and shared through the feature stores. If caching needs grow, add its
provider in `providers/app-providers.tsx` without changing component/service
boundaries.
