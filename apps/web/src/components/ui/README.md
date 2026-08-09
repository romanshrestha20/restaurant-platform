# Tablefolk UI

Reusable presentation primitives for the customer web app. Components expose
semantic variants and keep feature-specific data and behavior in route code.

Components are grouped by responsibility:

- `primitives` — foundational controls and visual elements
- `form` — form composition and validation presentation
- `feedback` — alerts, loading, empty, and transient states
- `data-display` — cards, avatars, and badges
- `overlay` — modal, drawer, and dropdown surfaces
- `navigation` — tabs, breadcrumbs, and pagination
- `layout` — page-level composition without feature logic
- `brand` — shared brand presentation

```tsx
import { Button, Form, FormField, Input } from '@/components/ui';

<Form onSubmit={handleSubmit}>
  <FormField label="Email" htmlFor="email" error={errors.email}>
    <Input id="email" type="email" aria-invalid={Boolean(errors.email)} />
  </FormField>
  <Button type="submit">Save changes</Button>
</Form>
```

Focused imports are also supported when useful:

```tsx
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/primitives/input';
```

Design tokens live in `src/styles/tokens.css`. Prefer semantic roles such as
`--color-accent` and `--color-surface` over raw color values in new UI.

`components/ui` must stay data-source agnostic: no API clients, stores, feature
validation, or routing workflows. Pass values and callbacks into primitives;
keep auth and profile behavior in their respective modules.
