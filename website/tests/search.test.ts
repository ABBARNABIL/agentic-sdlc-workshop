import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchEntries, searchSnippet } from '../src/lib/search.ts';

const entries = [
  { title: 'Cart', heading: 'Success criteria', text: 'Persist the cart through the API.', href: '/cart/' },
  { title: 'Azure', heading: 'OIDC', text: 'Use an identity to deploy the cart.', href: '/azure/' },
  { title: 'Setup', heading: 'Café', text: 'Check the baseline.', href: '/setup/' },
];
test('search requires every token and ranks title matches before body-only matches', () => {
  assert.equal(searchEntries(entries, 'cart')[0].title, 'Cart');
  assert.deepEqual(searchEntries(entries, 'cart OIDC').map(entry => entry.title), ['Azure']);
  assert.equal(searchEntries(entries, 'not-present').length, 0);
  assert.equal(searchEntries(entries, '???').length, 0);
});
test('search is case- and accent-insensitive and snippets have bounded length', () => {
  assert.equal(searchEntries(entries, 'cafe')[0].heading, 'Café');
  assert.equal(searchEntries(entries, 'API')[0].title, 'Cart');
  assert.ok(searchSnippet('prefix '.repeat(100) + 'needle ' + 'tail '.repeat(100), 'needle').includes('needle'));
  assert.ok(searchSnippet('x'.repeat(500), 'x').length <= 187);
});
