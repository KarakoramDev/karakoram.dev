// SPDX-License-Identifier: Apache-2.0
import { brandForLabel, brandIconHtml } from '../lib/brands.mjs';

// Documentation tables name engines and backends in header cells and in the first column
// ("MongoDB", "Zerops — reference", "Percona XtraDB Cluster (PXC)"). The docs are ingested from
// the product repository as plain Markdown, so the marks are added here, at render time,
// in front of such cells; no product doc changes. Satteri HAST plugin (Astro's default processor).
export function brandIcons() {
  return {
    name: 'karakoram-brand-icons',
    hooks: {
      'astro:config:setup': ({ config }) => {
        config.markdown.processor.options.hastPlugins.push({
          name: 'karakoram-brand-icons',
          element: {
            filter: ['th', 'td'],
            visit(node, ctx) {
              // Header cells anywhere; body cells only in the first column (whitespace text nodes may precede it).
              if (node.tagName === 'td') {
                const siblings = ctx.parent(node).children;
                if (siblings.slice(0, ctx.indexOf(node)).some((cell) => cell.type === 'element')) return;
              }
              const brand = brandForLabel(ctx.textContent(node));
              if (!brand) return;
              const icon = { type: 'raw', value: brandIconHtml(brand) };
              // Browsers may break a line between an inline SVG and the text after it, even across a
              // no-break space, so in narrow cells the mark and the first word share a nowrap span.
              const [first] = node.children;
              const words = first?.type === 'text' && first.value.match(/^\s*(\S+)([\s\S]*)$/);
              if (!words) return ctx.prependChild(node, [icon, { type: 'text', value: '\u00a0' }]);
              ctx.replaceNode(first, [
                { type: 'element', tagName: 'span', properties: { className: ['kk-brand-word'] }, children: [icon, { type: 'text', value: `\u00a0${words[1]}` }] },
                { type: 'text', value: words[2] },
              ]);
            },
          },
        });
      },
    },
  };
}
