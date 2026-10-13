// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from 'node:url';

// Only diagram-page frontmatter links this chunk. Vite bundles the lazy import
// and emits Mermaid's own chunks locally, without a browser/CDN dependency in CI.
export function mermaidAssets(base) {
  const prefix = `/${base.split('/').filter(Boolean).join('/')}/`.replace(/^\/\/$/, '/');
  return {
    name: 'karakoram-mermaid',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((request, response, next) => {
          // Astro may already have stripped the deployment base in dev.
          if (![`${prefix}_astro/karakoram-mermaid.js`, '/_astro/karakoram-mermaid.js'].includes(request.url?.split('?')[0])) return next();
          response.writeHead(307, { Location: `${prefix}src/plugins/mermaid-client.mjs` });
          response.end();
        });
      },
      'astro:build:setup': ({ updateConfig }) => {
        updateConfig({ plugins: [{
          name: 'karakoram-mermaid-client',
          applyToEnvironment(environment) { return environment.name === 'client'; },
          buildStart() {
            this.emitFile({ type: 'chunk', id: fileURLToPath(new URL('./mermaid-client.mjs', import.meta.url)), fileName: '_astro/karakoram-mermaid.js' });
          },
        }] });
      },
    },
  };
}
