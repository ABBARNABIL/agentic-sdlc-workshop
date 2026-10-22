import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const output = fileURLToPath(new URL('../dist/', import.meta.url));
const base = '/agentic-sdlc-workshop/';
const origin = 'https://abbarnabil.github.io';
async function filesIn(directory) {
  const groups = await Promise.all((await readdir(directory, { withFileTypes: true })).map(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : [target];
  }));
  return groups.flat();
}
const files = await filesIn(output);
const documents = new Map();
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  const ids = new Set($('[id]').map((_, element) => $(element).attr('id')).get());
  const urls = $('[href], [src]').map((_, element) => $(element).attr('href') ?? $(element).attr('src')).get();
  $('template').each((_, template) => {
    const content = load($(template).html() ?? '');
    content('[id]').each((_, element) => ids.add(content(element).attr('id')));
    content('[href], [src]').each((_, element) => urls.push(content(element).attr('href') ?? content(element).attr('src')));
  });
  const duplicates = $('[id]').map((_, element) => $(element).attr('id')).get();
  if (new Set(duplicates).size !== duplicates.length) throw new Error(`Duplicate HTML ids in ${file}`);
  documents.set(file, { $, urls, ids });
}
const failures = [];
let checked = 0;
async function verify(value, from) {
  if (!value || /^(?:data:|mailto:|tel:)/i.test(value)) return;
  const relative = path.relative(output, from).split(path.sep).join('/');
  const pagePath = `${base}${relative.replace(/index\.html$/, '')}`;
  const url = new URL(value, `${origin}${pagePath}`);
  if (url.origin !== origin) return;
  if (!url.pathname.startsWith(base)) {
    failures.push(`${relative}: URL escapes project base: ${value}`);
    return;
  }
  const pathname = decodeURIComponent(url.pathname.slice(base.length));
  let target = path.join(output, ...pathname.split('/'));
  if (existsSync(target) && (await stat(target)).isDirectory()) target = path.join(target, 'index.html');
  checked++;
  if (!existsSync(target)) { failures.push(`${relative}: missing ${value}`); return; }
  if (url.hash && documents.has(target) && !documents.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) {
    failures.push(`${relative}: missing anchor ${value}`);
  }
}
for (const [file, document] of documents) {
  for (const value of document.urls) await verify(value, file);
}
for (const file of files.filter(file => file.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) await verify(match[1], file);
}
const search = JSON.parse(await readFile(path.join(output, 'search.json'), 'utf8'));
for (const entry of search) {
  if (entry.href.includes('/solutions/')) failures.push(`Search contains a solution: ${entry.href}`);
  await verify(entry.href, path.join(output, 'index.html'));
}
if (failures.length) throw new Error(`Emitted link check failed:\n${failures.join('\n')}`);
console.log(`Verified ${documents.size} HTML documents and ${checked} internal links/assets/search targets under ${base}. No solution entries in search.`);
