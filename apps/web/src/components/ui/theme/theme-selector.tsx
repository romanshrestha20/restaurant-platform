'use client';

import { useTheme, type ThemeMode } from '@/lib/theme';

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { setTheme, theme } = useTheme();

  return (
    <label className={compact ? 'theme-selector theme-selector--compact' : 'theme-selector'}>
      <span className="theme-selector__label">Theme</span>
      <span className="theme-selector__control">
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M10 2.5v1.3M10 16.2v1.3M2.5 10h1.3M16.2 10h1.3M4.7 4.7l.9.9M14.4 14.4l.9.9M15.3 4.7l-.9.9M5.6 14.4l-.9.9" />
          <circle cx="10" cy="10" r="3.3" />
        </svg>
        <select
          aria-label="Color theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value as ThemeMode)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </span>
    </label>
  );
}
