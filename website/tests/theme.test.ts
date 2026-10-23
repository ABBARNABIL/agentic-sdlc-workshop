import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { bootstrapTheme, isThemePreference, resolveTheme, THEME_STORAGE_KEY } from '../src/lib/theme.ts';

function boot(saved: string | null, systemDark: boolean, blocked = false) {
  const dataset: Record<string, string> = {};
  const style = { colorScheme: '' };
  const metaColors: string[] = [];
  runInNewContext(`(${bootstrapTheme.toString()})(${JSON.stringify(THEME_STORAGE_KEY)});`, {
    document: {
      documentElement: { dataset, style },
      querySelectorAll: () => [{ setAttribute: (_name: string, value: string) => metaColors.push(value) }],
    },
    localStorage: { getItem: (key: string) => {
      assert.equal(key, THEME_STORAGE_KEY);
      if (blocked) throw new Error('Storage blocked');
      return saved;
    } },
    matchMedia: (query: string) => {
      assert.equal(query, '(prefers-color-scheme: dark)');
      return { matches: systemDark };
    },
  });
  return { dataset, style, metaColors };
}

test('theme preferences accept only the three supported choices', () => {
  for (const value of ['system', 'light', 'dark']) assert.ok(isThemePreference(value));
  for (const value of [null, undefined, 'auto', 'DARK', '"dark"', true, {}]) assert.equal(isThemePreference(value), false);
});

test('explicit choices override the operating system while System follows it', () => {
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('the actual head bootstrap applies saved dark mode without a body or module dependencies', () => {
  const result = boot('dark', false);
  assert.equal(result.dataset.themePreference, 'dark');
  assert.equal(result.dataset.theme, 'dark');
  assert.equal(result.style.colorScheme, 'dark');
  assert.deepEqual(result.metaColors, ['#101827']);
  assert.equal(result.dataset.themeStorage, undefined);
});

test('first visits follow the system, and stored Light is respected on a dark device', () => {
  assert.equal(boot(null, true).dataset.theme, 'dark');
  assert.equal(boot(null, false).dataset.theme, 'light');
  assert.equal(boot('system', true).dataset.theme, 'dark');
  const light = boot('light', true);
  assert.equal(light.style.colorScheme, 'light');
  assert.deepEqual(light.metaColors, ['#F7F9FD']);
});

test('blocked and invalid stored preferences are flagged for an honest interface notice', () => {
  const blocked = boot(null, true, true);
  assert.equal(blocked.dataset.theme, 'dark');
  assert.equal(blocked.dataset.themeStorage, 'unavailable');
  const invalid = boot('unknown-theme', false);
  assert.equal(invalid.dataset.themePreference, 'system');
  assert.equal(invalid.dataset.theme, 'light');
  assert.equal(invalid.dataset.themeStorage, 'invalid');
});
