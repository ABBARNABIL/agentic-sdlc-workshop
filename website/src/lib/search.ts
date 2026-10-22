import type { SearchEntry } from './content.ts';

export function normalizeSearch(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();
}

export function searchEntries(entries: SearchEntry[], query: string): SearchEntry[] {
  const words = normalizeSearch(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.length) return [];
  return entries.map((entry, index) => {
    const title = normalizeSearch(`${entry.title} ${entry.heading}`);
    const body = normalizeSearch(entry.text);
    if (!words.every(word => title.includes(word) || body.includes(word))) return { entry, score: 0, index };
    const score = words.reduce((sum, word) => sum + (title.includes(word) ? 8 : 0) + (body.includes(word) ? 1 : 0), 0);
    return { entry, score, index };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).map(result => result.entry);
}

export function searchSnippet(text: string, query: string, length = 185): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const word = normalizeSearch(query).match(/[\p{L}\p{N}]+/u)?.[0];
  const found = word ? normalizeSearch(clean).indexOf(word) : 0;
  const start = Math.max(0, found - 45);
  const end = Math.min(clean.length, start + length);
  return `${start ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
}
