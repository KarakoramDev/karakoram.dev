// SPDX-License-Identifier: Apache-2.0
const figures = [...document.querySelectorAll('.karakoram-mermaid')];
if (figures.length) {
  const sources = figures.map((figure) => figure.querySelector('code').textContent);
  let mermaid;
  let rendering = false;
  let pending = false;
  let sequence = 0;
  async function render() {
    if (rendering) { pending = true; return; }
    rendering = true;
    try {
      mermaid ||= (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default',
        fontFamily: 'inherit',
      });
      for (let index = 0; index < figures.length; index++) {
        const figure = figures[index];
        const output = figure.querySelector('[data-mermaid-output]');
        const fallback = figure.querySelector('[data-mermaid-source]');
        try {
          const { svg, bindFunctions } = await mermaid.render(`karakoram-diagram-${sequence++}`, sources[index]);
          output.innerHTML = svg;
          const diagram = output.querySelector('svg');
          diagram.style.maxWidth = '100%';
          diagram.style.height = 'auto';
          output.style.overflowX = 'auto';
          output.hidden = false;
          fallback.open = false;
          bindFunctions?.(output);
        } catch {
          output.hidden = true;
          fallback.open = true;
        }
      }
    } catch {
      // Import/network failure leaves the original, accessible code visible.
    } finally {
      rendering = false;
      if (pending) { pending = false; void render(); }
    }
  }
  new MutationObserver(() => void render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); void render(); }
    }, { rootMargin: '200px' });
    for (const figure of figures) observer.observe(figure);
  } else {
    void render();
  }
}
