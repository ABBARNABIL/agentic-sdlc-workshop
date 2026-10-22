import { BASE } from '../lib/site.ts';
import { searchEntries, searchSnippet } from '../lib/search.ts';
import type { SearchEntry } from '../lib/content.ts';

function isSearchEntry(value: unknown): value is SearchEntry {
  return typeof value === 'object' && value !== null &&
    'title' in value && typeof value.title === 'string' &&
    'heading' in value && typeof value.heading === 'string' &&
    'href' in value && typeof value.href === 'string' && value.href.startsWith(BASE) &&
    'text' in value && typeof value.text === 'string';
}

export function initSearch(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-search-dialog]');
  const input = document.querySelector<HTMLInputElement>('[data-search-input]');
  const results = document.querySelector<HTMLOListElement>('[data-search-results]');
  const status = document.querySelector<HTMLElement>('[data-search-status]');
  const retry = document.querySelector<HTMLButtonElement>('[data-search-retry]');
  if (!dialog || !input || !results || !status || !retry) return;
  const searchDialog = dialog, searchInput = input, resultList = results, searchStatus = status, retryButton = retry;
  let entries: SearchEntry[] | undefined;
  let loading: Promise<void> | undefined;
  let debounce: ReturnType<typeof setTimeout>;

  function showResults(): void {
    resultList.replaceChildren();
    const query = searchInput.value.trim();
    if (query.length < 2) {
      searchStatus.textContent = 'Type at least 2 characters. Solutions are not included.';
      return;
    }
    if (!entries) return;
    const matches = searchEntries(entries, query);
    searchStatus.textContent = matches.length ? `${matches.length} matching sections${matches.length > 12 ? '; showing the first 12' : ''}.` : 'No matches. Try a tool, challenge, or topic such as cart, OIDC, or SQLite.';
    for (const entry of matches.slice(0, 12)) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = entry.href;
      const title = document.createElement('strong');
      title.textContent = entry.heading === entry.title ? entry.title : `${entry.title}: ${entry.heading}`;
      const excerpt = document.createElement('span');
      excerpt.textContent = searchSnippet(entry.text, query);
      link.append(title, excerpt);
      item.append(link);
      resultList.append(item);
    }
  }
  async function load(): Promise<void> {
    if (entries) { showResults(); return; }
    if (loading) return loading;
    loading = (async () => {
      searchStatus.textContent = 'Loading the workshop search index…';
      retryButton.hidden = true;
      try {
        const response = await fetch(`${BASE}search.json`);
        if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every(isSearchEntry)) throw new Error('Invalid search index');
        entries = data;
        showResults();
      } catch {
        searchStatus.textContent = 'The search index could not be loaded. Check your connection and retry, or use the workshop navigation.';
        retryButton.hidden = false;
      } finally {
        loading = undefined;
      }
    })();
    return loading;
  }
  function open(): void {
    if (!searchDialog.open) searchDialog.showModal();
    searchInput.focus();
    void load();
  }
  document.querySelectorAll<HTMLButtonElement>('[data-search-open]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', open);
  });
  document.querySelector('[data-search-close]')?.addEventListener('click', () => searchDialog.close());
  searchDialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    searchDialog.close();
  });
  searchDialog.addEventListener('click', event => { if (event.target === searchDialog) searchDialog.close(); });
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(showResults, 100);
  });
  retryButton.addEventListener('click', () => { void load(); });
  document.addEventListener('keydown', event => {
    const target = event.target;
    if (event.key !== '/' || event.ctrlKey || event.altKey || event.metaKey ||
        (target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable))) return;
    event.preventDefault();
    open();
  });
}
