import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/styles/guide.css', import.meta.url), 'utf8');
const constants = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6}|#fff);/g)].map(match => [match[1], match[2]]));
const pairs = [...css.matchAll(/--([\w-]+):\s*light-dark\(\s*(#[\da-f]{6}),\s*(#[\da-f]{6})\s*\);/g)];

function luminance(hex: string): number {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map(value => value + value).join('')}` : hex;
  const values = [1, 3, 5].map(index => {
    const value = Number.parseInt(full.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

for (const [index, theme] of ['light', 'dark'].entries()) test(`${theme} theme text, actions, notices, and focus colors meet WCAG AA`, () => {
  const colors = { ...constants, ...Object.fromEntries(pairs.map(match => [match[1], match[index + 2]])) };
  assert.ok(pairs.length >= 20, 'Check the actual theme-aware CSS declarations, not a duplicate palette');
  for (const [foreground, background] of [
    ['ink', 'surface'], ['ink', 'porcelain'], ['slate', 'surface'], ['slate', 'porcelain'],
    ['cobalt', 'surface'], ['cobalt', 'porcelain'], ['cobalt', 'active-bg'],
    ['teal', 'surface'], ['teal', 'porcelain'], ['on-accent', 'cobalt'], ['on-accent', 'teal'],
    ['on-accent', 'button-hover'], ['inline-code-ink', 'inline-code-bg'], ['code-ink', 'code-bg'],
    ['notice-ink', 'notice-bg'], ['notice-ink', 'completion-bg'], ['warning-ink', 'warning-bg'],
    ['blockquote-ink', 'blockquote-bg'], ['ink', 'checked-bg'],
  ]) {
    assert.ok(colors[foreground] && colors[background]);
    const a = luminance(colors[foreground]), b = luminance(colors[background]);
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(contrast >= 4.5, `${foreground} on ${background}: ${contrast.toFixed(2)}:1 is below 4.5:1`);
  }
});
