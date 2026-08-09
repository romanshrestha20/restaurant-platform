# Multi-brand architecture

Brand and theme are separate axes:

- `data-brand` selects identity primitives: accent colors, branded surfaces,
  typography, and shape.
- `data-theme` selects light or dark neutral and feedback roles.
- Components consume semantic or component tokens and never branch on either.

The active brand is resolved on the server and written to `<html>` before paint.
`BrandProvider` exposes non-visual identity such as the name, mark, and home URL.
It is intentionally not stored in local storage because tenant selection belongs
to routing, domain, or authenticated organization context—not user preference.

To add a brand:

1. Add its identity to `brandRegistry`.
2. Add a matching `[data-brand='…']` block to `styles/tokens/brands.css`.
3. Supply light and dark brand primitives from the contract documented there.

The token integrity check fails when a registered brand has no CSS primitives.
