const themeScript = `
(function () {
  try {
    var key = 'tablefolk-theme';
    var saved = localStorage.getItem(key);
    var mode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    var resolved = mode === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    var root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themeMode = mode;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  } catch (_) {
    var fallback = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = fallback;
    document.documentElement.dataset.themeMode = 'system';
    document.documentElement.classList.toggle('dark', fallback === 'dark');
    document.documentElement.style.colorScheme = fallback;
  }
})();`;

export function ThemeScript() {
  return <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
