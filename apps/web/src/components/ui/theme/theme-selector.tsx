'use client';

import { useTheme, type ThemeMode } from '@/lib/theme';

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { setTheme, theme } = useTheme();

  if (compact) {
    return (
      <label className="theme-selector theme-selector--swap" title={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}>
        <input
          aria-label="Toggle dark mode"
          type="checkbox"
          checked={theme === 'dark'}
          onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
        />
        <svg className="swap-on" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5.64 17l-.71.71a1 1 0 0 0 0 1.41 1 1 0 0 0 1.41 0l.71-.71A1 1 0 0 0 5.64 17ZM5 12a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1Zm7-7a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1ZM5.64 7.05a1 1 0 0 0 .7.29 1 1 0 0 0 .71-.29 1 1 0 0 0 0-1.41l-.71-.71A1 1 0 0 0 4.93 6.34Zm12 .29a1 1 0 0 0 .7-.29l.71-.71a1 1 0 1 0-1.41-1.41L17 5.64a1 1 0 0 0 0 1.41 1 1 0 0 0 .64.29ZM21 11h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2Zm-9 8a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1Zm6.36-2A1 1 0 0 0 17 18.36l.71.71a1 1 0 0 0 1.41 0 1 1 0 0 0 0-1.41ZM12 6.5A5.5 5.5 0 1 0 17.5 12 5.51 5.51 0 0 0 12 6.5Z" />
        </svg>
        <svg className="swap-off" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73A8.15 8.15 0 0 1 9.08 5.49a8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36 10.14 10.14 0 1 0 22 14.05a1 1 0 0 0-.36-1.05ZM12.14 19.73A8.14 8.14 0 0 1 7.08 5.22v.27a10.15 10.15 0 0 0 10.14 10.14 9.79 9.79 0 0 0 2.1-.22 8.11 8.11 0 0 1-7.18 4.32Z" />
        </svg>
      </label>
    );
  }

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
