import { isThemePreference, resolveTheme, THEME_CHANGE_EVENT, THEME_STORAGE_KEY } from '../lib/theme.ts';
import type { ThemePreference } from '../lib/theme.ts';

export function initTheme(): void {
  const root = document.documentElement;
  const control = document.querySelector<HTMLElement>('[data-theme-control]');
  const select = document.querySelector<HTMLSelectElement>('[data-theme-select]');
  const notice = document.querySelector<HTMLElement>('[data-theme-notice]');
  const announcement = document.querySelector<HTMLElement>('[data-announcement]');
  if (!control || !select || !notice) return;
  const themeSelect = select, themeNotice = notice;
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference: ThemePreference = isThemePreference(root.dataset.themePreference) ? root.dataset.themePreference : 'system';

  function apply(): void {
    const before = root.dataset.theme;
    const theme = resolveTheme(preference, system.matches);
    root.dataset.themePreference = preference;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    themeSelect.value = preference;
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.setAttribute('content', getComputedStyle(root).backgroundColor);
    });
    if (before !== theme) window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
  function showStorageError(invalid = false): void {
    themeNotice.hidden = false;
    themeNotice.textContent = invalid
      ? 'Your saved color theme was not recognized. The guide is following your device setting. Choose a theme to replace the saved value.'
      : 'Your color theme could not be saved or read. Theme changes work on this page only and will be lost when you leave.';
  }
  if (root.dataset.themeStorage) showStorageError(root.dataset.themeStorage === 'invalid');
  apply();
  control.hidden = false;

  themeSelect.addEventListener('change', () => {
    if (!isThemePreference(themeSelect.value)) return;
    preference = themeSelect.value;
    apply();
    let saved = true;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
      delete root.dataset.themeStorage;
      themeNotice.hidden = true;
    } catch {
      saved = false;
      root.dataset.themeStorage = 'unavailable';
      showStorageError();
    }
    if (announcement) {
      announcement.textContent = `${preference === 'system' ? 'System color theme' : `${preference === 'dark' ? 'Dark' : 'Light'} mode`} selected${saved ? ' and saved in this browser.' : ' for this page only; it was not saved.'}`;
    }
  });
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    if (event.newValue === null || isThemePreference(event.newValue)) {
      preference = event.newValue ?? 'system';
      delete root.dataset.themeStorage;
      themeNotice.hidden = true;
    } else {
      preference = 'system';
      root.dataset.themeStorage = 'invalid';
      showStorageError(true);
    }
    apply();
  });
}
