import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/styles/guide.css', import.meta.url), 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6}|#fff);/g)].map(match => [match[1], match[2]]));

function luminance(hex: string): number {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map(value => value + value).join('')}` : hex;
  const values = [1, 3, 5].map(index => {
    const value = Number.parseInt(full.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

test('the actual CSS reading, muted, action, completion, and focus colors meet WCAG AA', () => {
  for (const [foreground, background] of [
    ['ink', 'white'], ['slate', 'white'], ['slate', 'porcelain'],
    ['cobalt', 'white'], ['cobalt', 'porcelain'], ['teal', 'white'], ['teal', 'porcelain'],
  ]) {
    assert.ok(colors[foreground] && colors[background]);
    const a = luminance(colors[foreground]), b = luminance(colors[background]);
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(contrast >= 4.5, `${foreground} on ${background}: ${contrast.toFixed(2)}:1 is below 4.5:1`);
  }
});
