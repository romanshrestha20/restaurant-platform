# Design System

## 1. Purpose

This document defines the shared UI design system for Restaurant Platform. It follows the token-first, reusable-component approach used in JobPilot: semantic design tokens, a small set of consistent primitives, explicit interaction states, and documented extension rules.

The goal is a coherent product across customer storefronts and administration screens without forcing every restaurant to look identical. Platform UI has a stable product identity. Restaurant storefronts can apply restaurant-specific brand data through controlled theme values.

## 2. Current implementation

The customer web application currently defines CSS custom properties in `apps/web/src/app/globals.css` and maps them into Tailwind CSS v4 theme tokens. The shared `packages/ui` package contains primitives including buttons, badges, cards, inputs, text areas, separators, skeletons, and dialogs.

Current base colors include a warm off-white background, dark green-gray foreground, terracotta primary, muted neutral surfaces, and a golden accent. A dark color scheme is also present in the web stylesheet.

This document standardizes how those existing foundations should be used. It does not claim every token or component listed as a target is already implemented in every application.

## 3. Design principles

1. Token first. Use named semantic tokens instead of scattering raw colors, spacing values, radii, or shadows through components.
2. Reuse before creating. Extend `packages/ui` before building a second version of a shared primitive.
3. Semantic over decorative. Use color and typography to communicate hierarchy and state, not as decoration alone.
4. Accessible by default. Support keyboard navigation, visible focus, meaningful labels, readable contrast, and reduced motion.
5. Responsive by default. Build from small screens upward and test touch, keyboard, and pointer use.
6. Data-driven storefronts. Restaurant name, logo, cover image, menu, currency, and customer-facing settings must come from tenant data.
7. Consistent, not rigid. Shared layout and interaction patterns remain consistent while restaurants can supply controlled brand colors and assets.
8. Explicit states. Every data-driven feature must define loading, empty, error, disabled, and success behavior where relevant.

## 4. Token architecture

Use CSS custom properties as the source of truth. Components should consume semantic tokens, not brand-specific hex values.

### Core semantic tokens

| Token | Purpose |
|---|---|
| `--background` | Main page background |
| `--foreground` | Main text and icon color |
| `--card` | Card and raised surface background |
| `--card-foreground` | Text on card surfaces |
| `--popover` | Popover and menu surface |
| `--popover-foreground` | Text inside popovers |
| `--primary` | Main action and brand emphasis |
| `--primary-foreground` | Text or icon on primary |
| `--secondary` | Secondary surface |
| `--secondary-foreground` | Content on secondary surfaces |
| `--muted` | Low-emphasis surface |
| `--muted-foreground` | Supporting text |
| `--accent` | Accent surface or highlight |
| `--accent-foreground` | Content on accent |
| `--destructive` | Dangerous action and error emphasis |
| `--destructive-foreground` | Content on destructive surface |
| `--border` | Default border |
| `--input` | Input border or input-specific surface |
| `--ring` | Keyboard focus ring |
| `--radius` | Base corner radius |

Map these tokens through the Tailwind theme in `globals.css`. If a new semantic role is needed, define it once and use it consistently. Avoid creating near-duplicate tokens such as multiple slightly different grays for the same role.

### Color usage

- Primary: main calls to action and selected key actions.
- Secondary: less prominent actions and supporting surfaces.
- Accent: limited emphasis, such as highlights or featured labels.
- Muted: secondary content and low-emphasis backgrounds.
- Destructive: delete, irreversible action, validation error, and failure states.
- Success and warning: add semantic tokens when these states are needed. Do not reuse primary or destructive colors as an ambiguous substitute.
- Borders: separate related content without adding unnecessary visual noise.

Do not rely on color alone to communicate state. Pair color with text, iconography, or another clear cue.

### Dark mode

The current customer stylesheet includes a `prefers-color-scheme: dark` rule. Keep dark-mode token values semantic. Verify contrast and component states in both themes. If a user-controlled theme switch is added, centralize theme state instead of layering ad hoc per-component overrides.

### Restaurant brand theming

Restaurant branding should be data-driven and constrained to approved theme variables. A restaurant must not be able to inject arbitrary CSS or markup through its settings.

Target pattern:

- Platform semantic tokens provide safe defaults.
- A validated restaurant theme may override a limited set of brand tokens.
- Text, border, surface, and focus colors must remain legible after overrides.
- Missing or invalid brand settings fall back to platform defaults.
- Do not let tenant branding override destructive-state semantics or hide focus indicators.

## 5. Typography

Use the existing system sans-serif stack defined in `globals.css` unless a deliberate, documented font change is approved.

Use a consistent hierarchy:
- Page title: one clear primary heading per page.
- Section heading: labels a meaningful group of content.
- Card title: concise and visually subordinate to the page heading.
- Body: comfortable reading size and line height.
- Supporting text: lower emphasis but still readable.
- Label: clearly associated with its input.
- Metadata: compact and secondary, never essential information that becomes unreadable.

Prefer semantic HTML headings in the correct order. Do not choose heading tags only for their default visual size. Avoid long paragraphs in management interfaces when short labels, grouped fields, or concise help text work better.

## 6. Spacing and layout

Use a consistent spacing scale. Prefer Tailwind spacing utilities and existing component patterns over arbitrary values.

Recommended rhythm:
- Tight spacing for icon-label pairs and closely related controls.
- Small spacing between a field label and its input.
- Medium spacing between fields in the same group.
- Larger spacing between sections.
- Generous spacing around page titles and major content groups.

Use responsive max-width containers for readable content. Keep forms and management tables aligned to a predictable grid. Do not use spacing to compensate for unclear information hierarchy.

## 7. Shape, borders, and elevation

The current stylesheet uses a compact base radius. Continue using shared radius tokens unless the design system is deliberately revised.

- Buttons and inputs should share a consistent height, radius, and focus behavior.
- Cards should use consistent padding and border treatment.
- Use shadows sparingly to indicate elevation or interactive emphasis.
- Prefer border and surface contrast to heavy shadows.
- Avoid mixing unrelated corner radii within the same component family.

## 8. Component standards

Implement or extend reusable primitives in `packages/ui` when they are used by multiple features or applications.

### Button

Required behaviors:
- Clear primary, secondary, outline, ghost, and destructive variants as justified by product use.
- Consistent size variants.
- Disabled state that prevents interaction and communicates unavailability.
- Visible focus ring.
- Loading state when an action is pending, with duplicate submission prevented.
- Accessible name and correct button type.

Use links for navigation and buttons for actions. Do not use clickable `div` elements as button substitutes.

### Input and textarea

- Every field has a visible, programmatically associated label.
- Help and error text are associated with the relevant control.
- Invalid state is communicated in text, not only by border color.
- Preserve entered values when a recoverable request fails.
- Use appropriate input types and browser autocomplete where applicable.

### Card

Use cards to group related content, not to wrap every single element. Keep padding and border treatment consistent. If a whole card is interactive, make the interaction keyboard accessible and avoid nested interactive elements.

### Badge

Use badges for concise status or category labels. Keep text short. Do not rely on badge color alone for status. Avoid using badges as decorative headings.

### Dialog

- Move focus into the dialog when opened.
- Keep keyboard focus within the modal while it is open.
- Support Escape when the action and context allow it.
- Provide a visible title and accessible description.
- Return focus to the triggering element when closed.
- Make destructive confirmation explicit.

### Skeleton and loading state

Use skeletons when the expected content structure is known. Keep layout dimensions close to the final content to reduce layout shift. For short actions, use a button-level loading state rather than replacing an entire page.

### Feedback and empty states

Every asynchronous feature should provide:
- Loading feedback.
- A useful empty state with a next action when appropriate.
- An error message that explains what failed and how to recover.
- Success feedback for meaningful completed actions.
- Retry where retry is safe.

Do not expose raw stack traces or internal API messages directly to users.

## 9. Customer storefront rules

- The restaurant name, description, logo, cover, menu, currency, opening hours, and customer-facing settings should come from the API.
- Do not hardcode a specific restaurant's branding into shared components.
- Make menu item name, price, availability, selected variants, and add-ons easy to scan.
- Keep cart quantity controls usable on touch screens.
- Show currency and totals consistently.
- Clearly distinguish unavailable items and closed ordering states.
- Do not imply an order or payment succeeded until the API confirms the state.
- Provide an explicit tenant-unavailable or unknown-storefront state rather than displaying a different restaurant.

## 10. Administration rules

- Optimize for task clarity and reliable operation rather than promotional visuals.
- Keep navigation, page titles, primary actions, filters, and data tables consistent.
- Show the active restaurant context clearly wherever restaurant-scoped actions occur.
- Reflect permissions in the UI, while enforcing all permissions again in the API.
- Confirm destructive actions and explain their scope.
- Use tables for dense comparable data and cards for summary or mobile layouts.
- Provide useful empty states for new restaurants without implying that data exists.

## 11. Accessibility requirements

Target WCAG 2.2 AA practices.

- Use semantic landmarks, headings, forms, buttons, and links.
- Ensure keyboard access for all interactions.
- Provide a visible focus indicator with adequate contrast.
- Maintain readable text and control contrast in light and dark themes.
- Associate labels, help text, and validation messages with form controls.
- Announce asynchronous status changes when appropriate.
- Do not rely on hover-only information.
- Provide useful alternative text for meaningful images and empty alternative text for decorative images.
- Respect reduced-motion preferences.
- Make touch targets sufficiently large and separated.
- Test common flows using only a keyboard and at narrow viewport widths.

## 12. Motion and interaction

Keep animation brief and functional. Use it to show state changes or maintain spatial continuity, not to delay work. Avoid large animated transitions in forms, checkout, or admin tables. Respect `prefers-reduced-motion`.

Interactive elements should have clear hover, focus, active, disabled, loading, and error states where applicable. Hover must never be the only way to discover an action or important content.

## 13. File organization and implementation

- Shared primitives: `packages/ui/src/`.
- Customer global tokens and Tailwind theme: `apps/web/src/app/globals.css`.
- Feature-specific components: the owning feature under `apps/web/src/features/` or the relevant admin feature.
- Shared application layout: the appropriate app's layout and component folders.
- API data access: use the existing API client and feature service patterns.

Before adding a component:
1. Search `packages/ui` and the relevant app for an existing equivalent.
2. Check whether the component is genuinely shared.
3. Add a variant or prop to an existing primitive if that preserves a clean API.
4. Add a new primitive only when it represents a reusable, coherent behavior.
5. Add tests or usage examples for non-trivial interaction behavior.
6. Update this document when introducing new tokens or component conventions.

Do not place business logic in visual primitives. Do not make a shared component depend on one specific restaurant or route.

## 14. Definition of done for UI work

A UI change is ready when:
- It follows semantic tokens and existing component patterns.
- It works at mobile and desktop widths.
- Keyboard navigation and focus are usable.
- Labels, errors, and status updates are accessible.
- Loading, empty, failure, and success states are considered.
- Restaurant-specific content remains data-driven.
- Existing checks and relevant tests pass.
- Documentation is updated if the design system or component contract changed.
