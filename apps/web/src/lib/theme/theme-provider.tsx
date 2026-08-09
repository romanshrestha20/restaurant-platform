'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ResolvedTheme, ThemeMode } from './theme.types';

const STORAGE_KEY = 'tablefolk-theme';
const SYSTEM_QUERY = '(prefers-color-scheme: dark)';

type ThemeContextValue = {
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system';

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme !== 'system') return theme;
  return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themeMode = theme;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Stable server values avoid hydration mismatches. ThemeScript has already
  // applied the visual theme before this provider hydrates.
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const themeRef = useRef<ThemeMode>('system');

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    themeRef.current = nextTheme;
    setThemeState(nextTheme);
    setResolvedTheme(applyTheme(nextTheme));
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The active page still updates when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const rootMode = document.documentElement.dataset.themeMode ?? null;
    const initialTheme = isThemeMode(rootMode) ? rootMode : 'system';
    themeRef.current = initialTheme;
    setThemeState(initialTheme);
    setResolvedTheme(applyTheme(initialTheme));

    const media = window.matchMedia(SYSTEM_QUERY);
    const handleSystemChange = () => {
      if (themeRef.current === 'system') {
        setResolvedTheme(applyTheme('system'));
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextTheme = isThemeMode(event.newValue) ? event.newValue : 'system';
      themeRef.current = nextTheme;
      setThemeState(nextTheme);
      setResolvedTheme(applyTheme(nextTheme));
    };

    media.addEventListener('change', handleSystemChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      media.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const value = useMemo(
    () => ({ resolvedTheme, setTheme, theme }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider.');
  return context;
}
