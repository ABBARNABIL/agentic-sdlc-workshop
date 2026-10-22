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

export async function enhanceDiagrams(root: ParentNode = document): Promise<void> {
  const diagrams = [...root.querySelectorAll<HTMLElement>('code.language-mermaid')].filter(node => !node.dataset.rendered);
  if (!diagrams.length) return;
  try {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      startOnLoad: false, securityLevel: 'strict', theme: 'base',
      themeVariables: { primaryColor: '#F7F9FD', primaryTextColor: '#17243A', primaryBorderColor: '#315EE8', lineColor: '#52647A', fontFamily: 'Atkinson Hyperlegible, sans-serif' },
    });
    for (const [index, code] of diagrams.entries()) {
      code.dataset.rendered = 'true';
      const block = code.closest('.code-block') ?? code.parentElement;
      if (!block) continue;
      const { svg } = await mermaid.render(`workshop-diagram-${index}-${document.querySelectorAll('.diagram').length}`, code.textContent ?? '');
      const figure = document.createElement('figure');
      figure.className = 'diagram';
      const drawing = document.createElement('div');
      drawing.className = 'diagram-drawing';
      drawing.innerHTML = svg;
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'View or copy diagram source';
      details.append(summary);
      block.before(figure);
      details.append(block);
      figure.append(drawing, details);
    }
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'notice';
    message.setAttribute('role', 'status');
    message.textContent = 'A diagram could not be rendered. Its complete Mermaid source remains available below.';
    diagrams[0]?.closest('.code-block')?.before(message);
    console.error('Workshop diagram rendering failed', error);
  }
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
    void enhanceDiagrams(target);
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
