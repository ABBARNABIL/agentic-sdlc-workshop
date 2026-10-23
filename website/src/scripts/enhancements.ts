export function enhanceCode(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('pre > code').forEach(code => {
    const pre = code.parentElement;
    if (!pre || pre.parentElement?.classList.contains('code-block')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    const tools = document.createElement('div');
    tools.className = 'code-toolbar';
    const language = [...code.classList].find(name => name.startsWith('language-'))?.slice(9) ?? 'Text';
    const label = document.createElement('span');
    label.textContent = language === 'mermaid' ? 'Diagram source' : language;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', pre.dataset.copyLabel ?? `Copy ${language} example`);
    const feedback = document.createElement('span');
    feedback.className = 'copy-feedback';
    feedback.setAttribute('role', 'status');
    tools.append(label, button);
    pre.before(wrapper);
    wrapper.append(tools, pre, feedback);
    pre.tabIndex = 0;
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', `${language} code example`);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent ?? '');
        feedback.textContent = 'Copied to clipboard.';
        button.textContent = 'Copied';
      } catch {
        feedback.textContent = 'Copy failed. Select the code and copy it manually.';
        button.textContent = 'Copy failed';
        pre.focus();
      }
      window.setTimeout(() => { button.textContent = 'Copy'; }, 2500);
    });
  });
}

let diagramQueue = Promise.resolve();
let diagramRevision = 0;
let diagramId = 0;

function diagramColors(): Record<string, string> {
  const probe = document.createElement('span');
  probe.hidden = true;
  document.body.append(probe);
  try {
    return Object.fromEntries(['surface', 'porcelain', 'ink', 'cobalt', 'slate', 'border', 'notice-bg'].map(token => {
      probe.style.color = `var(--${token})`;
      const rgb = getComputedStyle(probe).color.match(/\d+(?:\.\d+)?/g);
      if (!rgb || rgb.length !== 3) throw new Error(`Unable to resolve diagram color: ${token}`);
      return [token, `#${rgb.map(value => Math.round(Number(value)).toString(16).padStart(2, '0')).join('')}`];
    }));
  } finally {
    probe.remove();
  }
}

export function enhanceDiagrams(): Promise<void> {
  const revision = ++diagramRevision;
  document.querySelectorAll('.diagram-drawing').forEach(drawing => drawing.setAttribute('aria-busy', 'true'));
  // Mermaid has shared configuration; serialize renders and discard stale theme requests.
  diagramQueue = diagramQueue.then(async () => {
    if (revision !== diagramRevision) return;
    const diagrams = [...document.querySelectorAll<HTMLElement>('code.language-mermaid')];
    if (!diagrams.length) return;
    try {
      const { default: mermaid } = await import('mermaid');
      if (revision !== diagramRevision) return;
      const dark = document.documentElement.dataset.theme === 'dark';
      const colors = diagramColors();
      mermaid.initialize({
        startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'base',
        themeVariables: {
          darkMode: dark, background: colors.surface, primaryColor: colors.surface,
          primaryTextColor: colors.ink, primaryBorderColor: colors.cobalt, lineColor: colors.slate,
          secondaryColor: colors['notice-bg'], tertiaryColor: colors.porcelain,
          clusterBkg: colors.porcelain, clusterBorder: colors.border,
          edgeLabelBackground: colors.surface, fontFamily: 'Atkinson Hyperlegible, sans-serif',
        },
      });
      for (const code of diagrams) {
        const block = code.closest('.code-block') ?? code.parentElement;
        if (!block) continue;
        const { svg } = await mermaid.render(`workshop-diagram-${++diagramId}`, code.textContent ?? '');
        if (revision !== diagramRevision) return;
        let figure = code.closest<HTMLElement>('.diagram');
        let drawing = figure?.querySelector<HTMLElement>('.diagram-drawing');
        if (!figure || !drawing) {
          figure = document.createElement('figure');
          figure.className = 'diagram';
          drawing = document.createElement('div');
          drawing.className = 'diagram-drawing';
          const details = document.createElement('details');
          const summary = document.createElement('summary');
          summary.textContent = 'View or copy diagram source';
          details.append(summary);
          block.before(figure);
          details.append(block);
          figure.append(drawing, details);
        }
        drawing.innerHTML = svg;
        drawing.dataset.theme = dark ? 'dark' : 'light';
        drawing.setAttribute('aria-busy', 'false');
      }
    } catch (error) {
      const message = document.createElement('p');
      message.className = 'notice';
      message.setAttribute('role', 'status');
      message.textContent = 'A diagram could not be rendered. Its complete Mermaid source remains available below.';
      diagrams[0]?.closest('.diagram, .code-block')?.before(message);
      document.querySelectorAll('.diagram-drawing').forEach(drawing => drawing.setAttribute('aria-busy', 'false'));
      console.error('Workshop diagram rendering failed', error);
    }
  });
  return diagramQueue;
}

export function initSolution(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-reveal-solution]');
  const template = document.querySelector<HTMLTemplateElement>('[data-solution-template]');
  const target = document.querySelector<HTMLElement>('[data-solution-target]');
  if (!button || !template || !target) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    target.append(template.content.cloneNode(true));
    template.remove();
    document.querySelector('[data-spoiler-gate]')?.remove();
    const tocTemplate = document.querySelector<HTMLTemplateElement>('[data-solution-toc]');
    const tocTarget = document.querySelector('[data-toc-target]');
    if (tocTemplate && tocTarget) {
      tocTarget.replaceChildren(tocTemplate.content.cloneNode(true));
      tocTemplate.remove();
    }
    enhanceCode(target);
    void enhanceDiagrams();
    target.hidden = false;
    const heading = target.querySelector<HTMLElement>('h2');
    if (heading) { heading.tabIndex = -1; heading.focus(); }
    observeHeadings();
  }, { once: true });
}

export function observeHeadings(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc-target] a')];
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    const first = entries.find(entry => entry.isIntersecting);
    if (!first) return;
    links.forEach(link => {
      if (link.hash === `#${first.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-12% 0px -65% 0px' });
  document.querySelectorAll('main h2[id], main h3[id]').forEach(heading => observer.observe(heading));
}

export function initResponsiveNavigation(): void {
  const breakpoint = window.matchMedia('(min-width: 1100px)');
  const update = () => {
    document.querySelectorAll<HTMLDetailsElement>('[data-responsive-details]').forEach(details => { details.open = breakpoint.matches; });
  };
  update();
  breakpoint.addEventListener('change', update);
}
