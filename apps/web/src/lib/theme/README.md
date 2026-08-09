# Theme architecture

Tablefolk uses semantic CSS tokens and a single runtime theme preference.
Components consume roles such as `--color-background`, `--color-foreground`,
and `--color-control-border`; raw colors live only in `styles/tokens.css`.

## Load sequence

1. `ThemeScript` runs in the document head before hydration.
2. It reads `tablefolk-theme` from local storage, resolves `system`, and applies
   `data-theme`, `data-theme-mode`, the `.dark` class, and `color-scheme`.
3. `ThemeProvider` hydrates from those document attributes without changing the
   initial visual theme.
4. In system mode, OS preference changes update the app immediately. Storage
   events keep multiple tabs synchronized.

## Component API

```tsx
const { theme, resolvedTheme, setTheme } = useTheme();

setTheme('system');
setTheme('light');
setTheme('dark');
```

Components must not branch on `resolvedTheme` for presentation. Add or adjust a
semantic role in `tokens.css` so every component and state changes consistently.
The `.dark` class is also exposed through Tailwind's class-based `dark` variant.
