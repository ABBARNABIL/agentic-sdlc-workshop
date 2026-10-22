import { existsSync, statSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Element, Root } from 'hast';
import { repositoryUrl, withBase } from './site.ts';

export const repositoryRoot = path.resolve(process.cwd(), '..');
if (!existsSync(path.join(repositoryRoot, 'WORKSHOP.md'))) {
  throw new Error('Run site commands from website/ (or use npm --prefix website). WORKSHOP.md was not found.');
}

export type PageKind = 'overview' | 'setup' | 'challenge' | 'solution' | 'finish' | 'reference' | 'resources' | 'about';
export interface Heading { id: string; depth: number; text: string }
export interface Criterion { id: string; text: string }
export interface SearchEntry { title: string; heading: string; href: string; text: string }
export interface WorkshopPage {
  source: string;
  slug: string;
  title: string;
  kind: PageKind;
  number?: number;
  step?: string;
  html: string;
  headings: Heading[];
  criteria: Criterion[];
  sections: SearchEntry[];
}

interface TextNode { type: string; value?: string; children?: TextNode[]; depth?: number }

function textOf(node: TextNode): string {
  return node.value ?? node.children?.map(textOf).join('') ?? '';
}

export function describeSource(source: string): Pick<WorkshopPage, 'slug' | 'kind' | 'number' | 'step'> {
  if (source === 'WORKSHOP.md') return { slug: '', kind: 'overview' };
  if (source === 'SETUP.md') return { slug: 'start', kind: 'setup' };
  if (source === 'provenance/README.md') return { slug: 'about', kind: 'about' };
  if (source === 'website/content/resources.md') return { slug: 'resources', kind: 'resources' };
  if (source === 'challenges/finish.md') return { slug: 'finish', kind: 'finish', step: 'finish' };
  const challenge = /^challenges\/challenge-(\d{2})\.md$/.exec(source);
  if (challenge) return { slug: `challenges/${challenge[1]}`, kind: 'challenge', number: Number(challenge[1]), step: challenge[1] };
  const solution = /^walkthrough\/challenge-(\d{2})\/solution-\d{2}\.md$/.exec(source);
  if (solution) return { slug: `solutions/${solution[1]}`, kind: 'solution', number: Number(solution[1]) };
  return { slug: `reference/${source.replace(/\.md$/i, '').replace(/\/readme$/i, '').toLowerCase()}`, kind: 'reference' };
}

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(path.join(repositoryRoot, ...directory.split('/')), { withFileTypes: true });
  const files = await Promise.all(entries
    .filter(entry => !entry.name.startsWith('.') && !['node_modules', 'dist', 'target', 'bin', 'obj'].includes(entry.name))
    .map(async entry => {
      const relative = `${directory}/${entry.name}`;
      return entry.isDirectory() ? markdownFiles(relative) : entry.name.endsWith('.md') ? [relative] : [];
    }));
  return files.flat();
}

const imageAssets = new Set<string>();
let pagesPromise: Promise<WorkshopPage[]> | undefined;

export function rewriteLocalUrl(value: string, source: string, knownPages: Map<string, string>, image = false): string {
  if (!value || value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')) return value;
  const match = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(value);
  if (!match) throw new Error(`Invalid URL "${value}" in ${source}`);
  const [, pathname, query = '', fragment = ''] = match;
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(source), decodeURIComponent(pathname)));
  if (target === '..' || target.startsWith('../') || path.posix.isAbsolute(target)) {
    throw new Error(`Link escapes the repository: ${source} -> ${value}`);
  }
  const absolute = path.join(repositoryRoot, ...target.split('/'));
  if (!existsSync(absolute)) throw new Error(`Missing link target: ${source} -> ${value} (${target})`);
  const directPage = knownPages.get(target);
  if (directPage !== undefined) return `${withBase(directPage)}${query}${fragment}`;
  const directory = statSync(absolute).isDirectory();
  if (directory) {
    const index = knownPages.get(`${target.replace(/\/$/, '')}/README.md`);
    if (index !== undefined) return `${withBase(index)}${query}${fragment}`;
  }
  if (image) {
    if (directory) throw new Error(`Image is a directory: ${source} -> ${value}`);
    imageAssets.add(target);
    return `${withBase('')}workshop-assets/${target.split('/').map(encodeURIComponent).join('/')}${query}${fragment}`;
  }
  return `${repositoryUrl(target.replace(/\/$/, ''), directory)}${fragment}`;
}

function pageTransform(page: WorkshopPage, knownPages: Map<string, string>) {
  return () => (tree: Root) => {
    const firstHeading = tree.children.findIndex(node => node.type === 'element' && node.tagName === 'h1');
    if (firstHeading !== -1) tree.children.splice(firstHeading, 1);
    tree.children = tree.children.filter(node => {
      if (node.type !== 'element' || node.tagName !== 'p') return true;
      const text = toString(node);
      return !(text.includes('Home') && /(?:Previous Challenge|Next Challenge)/.test(text));
    });
    if (page.kind === 'overview') {
      const index = tree.children.findIndex(node => node.type === 'element' && node.tagName === 'ul');
      const node = tree.children[index];
      if (node?.type === 'element' && toString(node).includes('MicroHack introduction')) tree.children.splice(index, 1);
    }
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'a' && typeof node.properties.href === 'string') {
        node.properties.href = rewriteLocalUrl(node.properties.href, page.source, knownPages);
      }
      if (node.tagName === 'img' && typeof node.properties.src === 'string') {
        node.properties.src = rewriteLocalUrl(node.properties.src, page.source, knownPages, true);
        node.properties.loading = 'lazy';
      }
      if (/^h[2-4]$/.test(node.tagName)) {
        const heading = { id: String(node.properties.id), depth: Number(node.tagName[1]), text: toString(node) };
        page.headings.push(heading);
        node.properties.ariaLabel = heading.text;
        node.children.push({
          type: 'element', tagName: 'a',
          properties: { href: `#${heading.id}`, className: ['heading-anchor'], ariaLabel: `Link to ${heading.text}` },
          children: [{ type: 'text', value: '#' }],
        });
      }
      if (node.tagName === 'table') node.properties.className = ['data-table'];
    });
    let inSuccess = false;
    let currentSection: SearchEntry = { title: page.title, heading: page.title, href: withBase(page.slug), text: '' };
    const sections: SearchEntry[] = [];
    for (const node of tree.children) {
      if (node.type === 'element' && /^h[2-3]$/.test(node.tagName)) {
        if (currentSection.text.trim()) sections.push(currentSection);
        const heading = page.headings.find(item => item.id === node.properties.id);
        currentSection = { title: page.title, heading: heading?.text ?? page.title, href: `${withBase(page.slug)}#${node.properties.id}`, text: '' };
      }
      if (node.type === 'element' && /^h[2-3]$/.test(node.tagName)) inSuccess = toString(node).replace(/#$/, '').trim() === 'Success criteria';
      if (page.step && inSuccess && node.type === 'element' && node.tagName === 'ul') {
        node.properties.className = ['success-checklist'];
        for (const item of node.children) {
          if (item.type !== 'element' || item.tagName !== 'li') continue;
          const id = `${page.step}-${page.criteria.length + 1}`;
          page.criteria.push({ id, text: toString(item) });
          item.children = [{
            type: 'element', tagName: 'label', properties: { className: ['criterion'] },
            children: [
              { type: 'element', tagName: 'input', properties: { type: 'checkbox', disabled: true, dataCriterion: id }, children: [] },
              { type: 'element', tagName: 'span', properties: {}, children: item.children },
            ],
          }];
        }
      }
      currentSection.text += `${toString(node).replace(/\s+/g, ' ')}\n`;
    }
    if (currentSection.text.trim()) sections.push(currentSection);
    page.sections = sections;
  };
}

async function loadPages(): Promise<WorkshopPage[]> {
  const sourceGroups = await Promise.all(['challenges', 'walkthrough', 'assets', 'src', 'infra', 'scripts'].map(markdownFiles));
  const sources = ['WORKSHOP.md', 'SETUP.md', 'provenance/README.md', 'website/content/resources.md', ...sourceGroups.flat()].sort();
  const knownPages = new Map(sources.map(source => [source, describeSource(source).slug]));
  if (new Set(knownPages.values()).size !== sources.length) throw new Error('Duplicate content routes');
  return Promise.all(sources.map(async source => {
    const markdown = await readFile(path.join(repositoryRoot, ...source.split('/')), 'utf8');
    const ast = unified().use(remarkParse).parse(markdown);
    const heading = ast.children.find(node => node.type === 'heading' && node.depth === 1);
    const originalTitle = heading ? textOf(heading) : source;
    const page: WorkshopPage = {
      ...describeSource(source), source,
      title: originalTitle.replace(/^(?:Walkthrough )?Challenge \d+ - /, ''),
      html: '', headings: [], criteria: [], sections: [],
    };
    const result = await unified().use(remarkParse).use(remarkGfm)
      .use(remarkRehype).use(rehypeSanitize).use(rehypeSlug, { prefix: '' })
      .use(pageTransform(page, knownPages)).use(rehypeStringify).process(markdown);
    page.html = String(result);
    if (page.step && !page.criteria.length) throw new Error(`Missing success criteria: ${source}`);
    return page;
  }));
}

export function getPages(): Promise<WorkshopPage[]> {
  pagesPromise ??= loadPages();
  return pagesPromise;
}

export async function getSearchEntries(): Promise<SearchEntry[]> {
  return (await getPages()).filter(page => page.kind !== 'solution').flatMap(page => page.sections);
}

export async function getImageAssets(): Promise<string[]> {
  await getPages();
  return [...imageAssets];
}

export async function upstreamLicense(): Promise<string> {
  return readFile(path.join(repositoryRoot, 'LICENSE.upstream'), 'utf8');
}
