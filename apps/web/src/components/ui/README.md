# Tablefolk UI

Reusable presentation primitives for the customer web app. Components expose
semantic variants and keep feature-specific data and behavior in route code.

```tsx
import { Alert, Button, FormField, StatusBadge } from '@/components/ui';

<FormField label="Email" htmlFor="email" error={errors.email}>
  <input id="email" aria-invalid={Boolean(errors.email)} />
</FormField>

<StatusBadge verified={user.emailVerified} />
<Alert tone="success">Changes saved.</Alert>
<Button type="submit">Save changes</Button>
```

Design tokens live in `src/styles/tokens.css`. Prefer semantic roles such as
`--color-accent` and `--color-surface` over raw color values in new UI.
