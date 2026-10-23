export const THEME_STORAGE_KEY = 'agentic-sdlc-workshop:theme:v1';
export const THEME_CHANGE_EVENT = 'workshop:theme-change';
export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorTheme = 'light' | 'dark';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ColorTheme {
  return preference === 'system' ? systemDark ? 'dark' : 'light' : preference;
}

// Serialized into the head; keep this synchronous and independent of other module code.
export function bootstrapTheme(storageKey: string): void {
  const root = document.documentElement;
  let preference = 'system';
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark' || saved === 'system') preference = saved;
    else if (saved !== null) root.dataset.themeStorage = 'invalid';
  } catch {
    root.dataset.themeStorage = 'unavailable';
  }
  const theme = preference === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : preference;
  root.dataset.themePreference = preference;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    meta.setAttribute('content', theme === 'dark' ? '#101827' : '#F7F9FD');
  });
}
