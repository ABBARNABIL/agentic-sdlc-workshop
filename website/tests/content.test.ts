import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { load } from 'cheerio';
import { getPages, getSearchEntries, repositoryRoot, rewriteLocalUrl, upstreamLicense } from '../src/lib/content.ts';
import { BASE } from '../src/lib/site.ts';

const pages = await getPages();
interface TextNode { type: string; value?: string; children?: TextNode[] }
const text = (node: TextNode): string => node.value ?? (node.children ?? []).map(text).join('');
const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

test('all seven full challenges, seven solutions, setup, finish, and supporting documents have unique routes', () => {
  assert.equal(pages.filter(page => page.kind === 'challenge').length, 7);
  assert.equal(pages.filter(page => page.kind === 'solution').length, 7);
  assert.equal(pages.filter(page => page.kind === 'finish').length, 1);
  assert.equal(pages.filter(page => page.kind === 'setup').length, 1);
  assert.equal(new Set(pages.map(page => page.slug)).size, pages.length);
  assert.ok(pages.some(page => page.source === 'assets/workiq/teams-thread-launch-promo.md'));
  assert.ok(pages.some(page => page.source === 'src/docs/architecture.md'));
});

test('participants use only their own GitHub accounts and Azure subscriptions', async () => {
  const pageText = (source: string): string => {
    const page = pages.find(item => item.source === source);
    assert.ok(page, source);
    return clean(load(page.html).text());
  };
  assert.match(pageText('SETUP.md'), /your own GitHub account/i);
  for (const source of [
    'SETUP.md', 'WORKSHOP.md', 'challenges/challenge-05.md', 'challenges/challenge-06.md',
    'walkthrough/challenge-05/solution-05.md', 'walkthrough/challenge-06/solution-06.md',
  ]) {
    assert.match(pageText(source), /your own Azure subscription/i, source);
  }
  const documents = [
    ...pages.map(page => ({ source: page.source, text: pageText(page.source) })),
    { source: 'README.md', text: await readFile(path.join(repositoryRoot, 'README.md'), 'utf8') },
  ];
  for (const document of documents) {
    assert.doesNotMatch(document.text, /labuser[-_]\d+|MngEnvMCAP\d+|facilitated event|event-provided accounts|hackathon-provided GitHub/i, document.source);
  }
});

test('success checklists contain the original criteria, not optional stretches or unrelated lists', () => {
  const counts = [3, 4, 4, 3, 4, 4, 4];
  for (const page of pages.filter(page => page.kind === 'challenge')) {
    assert.equal(page.criteria.length, counts[(page.number ?? 1) - 1], page.source);
    assert.equal((page.html.match(/data-criterion=/g) ?? []).length, page.criteria.length);
  }
  assert.equal(pages.find(page => page.kind === 'finish')?.criteria.length, 4);
});

test('heading permalinks do not pollute the accessible heading names', () => {
  for (const page of pages) {
    const $ = load(page.html);
    for (const heading of page.headings) {
      assert.equal($(`[id="${heading.id}"]`).attr('aria-label'), heading.text, page.source);
    }
  }
});

test('every instructional paragraph, code fence, and non-title heading survives Markdown rendering', async () => {
  for (const page of pages) {
    const markdown = await readFile(path.join(repositoryRoot, ...page.source.split('/')), 'utf8');
    const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
    const rendered = clean(load(page.html).text());
    visit(tree, node => {
      if (!['paragraph', 'heading', 'code'].includes(node.type)) return;
      if (node.type === 'heading' && node.depth === 1) return;
      const expected = clean(text(node));
      if (/Home/.test(expected) && /(?:Previous Challenge|Next Challenge)/.test(expected)) return;
      if (!expected || node.type === 'code' && node.lang === 'mermaid') return;
      assert.ok(rendered.includes(expected), `${page.source}: missing "${expected.slice(0, 110)}"`);
    });
  }
});

test('ordinary search never contains solution routes or worked-approach text', async () => {
  const index = await getSearchEntries();
  assert.ok(index.length > 100);
  assert.ok(index.every(entry => entry.href.startsWith(BASE) && !entry.href.includes('/solutions/')));
  assert.ok(!JSON.stringify(index).includes('Sprawling diff touching unrelated files'));
  assert.ok(index.some(entry => entry.text.includes('OIDC')));
});

test('relative docs become guide routes, supporting files become accurate repository links, and bad paths fail', () => {
  const map = new Map(pages.map(page => [page.source, page.slug]));
  assert.equal(rewriteLocalUrl('../WORKSHOP.md#general-prerequisites', 'challenges/challenge-01.md', map), `${BASE}#general-prerequisites`);
  assert.equal(rewriteLocalUrl('../.github/workflows/deploy.yml.example', 'challenges/challenge-05.md', map), 'https://github.com/ABBARNABIL/agentic-sdlc-workshop/blob/main/.github/workflows/deploy.yml.example');
  assert.throws(() => rewriteLocalUrl('../missing-file.md', 'challenges/challenge-01.md', map), /Missing link target/);
  assert.throws(() => rewriteLocalUrl('../../outside.md', 'challenges/challenge-01.md', map), /escapes/);
});

test('all 278 imported files are present and unadapted files keep their original Git blob hashes', async () => {
  const manifest = JSON.parse(await readFile(path.join(repositoryRoot, 'provenance', 'upstream-tree.json'), 'utf8'));
  const adapted = new Set([
    '.gitignore', '.devcontainer/devcontainer.json', '.devcontainer/docker-compose.yml',
    '.vscode/tasks.json', '.vscode/launch.json', '.github/workflows/deploy.yml', '.github/copilot-instructions.md',
    'Readme.md', 'src/Makefile', 'src/README.md', 'src/docs/build.md',
    'src/frontend/vite.config.ts', 'src/frontend/src/api/config.ts', 'infra/README.md', 'scripts/README.md',
    ...Array.from({ length: 7 }, (_, i) => `challenges/challenge-0${i + 1}.md`),
    'challenges/finish.md',
    ...Array.from({ length: 7 }, (_, i) => `walkthrough/challenge-0${i + 1}/solution-0${i + 1}.md`),
  ]);
  const entries = manifest.tree.filter((entry: { type: string }) => entry.type === 'blob');
  assert.equal(entries.length, 278);
  for (const entry of entries) {
    const mapped = entry.path === 'Readme.md' ? 'WORKSHOP.md' : entry.path === '.github/workflows/deploy.yml' ? `${entry.path}.example` : entry.path;
    const target = path.join(repositoryRoot, ...mapped.split('/'));
    assert.ok(existsSync(target), `Missing imported file: ${mapped}`);
    if (!adapted.has(entry.path)) {
      const bytes = await readFile(target);
      const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      assert.equal(hash, entry.sha, `Undocumented change to imported file: ${entry.path}`);
    }
  }
  assert.match(await upstreamLicense(), /Copyright \(c\) Microsoft Corporation/);
});
