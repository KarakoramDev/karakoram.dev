# Brand marks: sources and licences

The marks next to backend and engine names (landing page cards and "Runs on" row, docs sidebar,
docs page titles and docs tables) are inlined from `src/lib/brands.mjs`. The path data there is
verbatim from the sources below; the only edits are a `viewBox` cropped to the mark and the fill
set per theme as described. Nothing is hotlinked. The SVG files in this directory are the
unmodified originals of the marks that do not come from Simple Icons, kept for audit.

All marks are trademarks of their owners and are used only to identify the product named next to
them (nominative use). Karakoram is independent and not affiliated with or endorsed by any of them
(see also the trademark notice in `README.md` and the site footer).

| Brand | Mark | Source | Licence / usage terms | Colour (light / dark theme) |
| --- | --- | --- | --- | --- |
| Zerops | Symbol from `logo-symbol.svg` in the official asset pack | [docs.zerops.io/company/branding](https://docs.zerops.io/company/branding) → `zerops-assets.zip` (sha256 `2eb010ab…a3d59a`, 2026-10-27), copy: `zerops-logo-symbol.svg` | Zerops brand guidelines on that page: official assets, not modified, adequate spacing, no implied partnership | Fixed two-tone `#3dbeb3` / `#02b3a4` as supplied, both themes |
| Dokploy | `apps/dokploy/public/logo.svg` | [Dokploy/dokploy@de25794](https://github.com/Dokploy/dokploy/blob/de2579401cee215eb9fdfd468582544072afb700/apps/dokploy/public/logo.svg), copy: `dokploy-logo.svg` | Apache-2.0 (repository licence, file outside `/proprietary`); no separate brand guidelines published | One-colour: text ink (currentColor), both themes |
| Nomad | Simple Icons `nomad` | [simple-icons@16.36.0](https://github.com/simple-icons/simple-icons) (source: hashicorp.com/brand) | Simple Icons: CC0-1.0; [HashiCorp brand guidelines](https://www.hashicorp.com/brand) | `#00ca8e` both themes (HashiCorp's Nomad colour as recorded by Simple Icons) |
| MongoDB | Simple Icons `mongodb` | simple-icons@16.36.0 (source: mongodb.com/pressroom) | CC0-1.0; MongoDB trademark | `#47a248` both themes |
| PostgreSQL | Simple Icons `postgresql` | simple-icons@16.36.0 (source: wiki.postgresql.org/wiki/Logo) | CC0-1.0; [PostgreSQL trademark policy](https://www.postgresql.org/about/policies/trademarks/) | `#4169e1` both themes |
| Supabase | Simple Icons `supabase` | simple-icons@16.36.0 (source: supabase/supabase repository) | CC0-1.0; Supabase trademark | `#3fcf8e` both themes |
| RabbitMQ | Simple Icons `rabbitmq` | simple-icons@16.36.0 (source: rabbitmq.com) | CC0-1.0; [RabbitMQ trademark guidelines](https://www.rabbitmq.com/trademark-guidelines.html) | `#ff6600` both themes |
| Elasticsearch | Simple Icons `elasticsearch` | simple-icons@16.36.0 (source: elastic.co/brand) | CC0-1.0; [Elastic brand](https://www.elastic.co/brand) (one-colour versions provided for light and dark backgrounds) | `#005571` light; text ink (white) dark |
| MySQL | Simple Icons `mysql` | simple-icons@16.36.0 (source: mysql.com/about/legal/logos.html) | CC0-1.0; [MySQL logo policy](https://www.mysql.com/about/legal/logos.html) | `#4479a1` both themes |
| Percona (Percona XtraDB Cluster card) | "Percona Logomark Only – One Colour", dark and white versions | [percona.com/brand-resources](https://www.percona.com/brand-resources/), copies: `percona-logomark-one-color-dark.svg`, `percona-logomark-one-color-white.svg` | [Percona trademark policy](https://www.percona.com/trademark-policy/): nominative fair-use reference to a Percona product; brand resources page | `#282727` light (dark version as supplied); `#ffffff` dark (white version as supplied) |
| Neo4j | Simple Icons `neo4j` | simple-icons@16.36.0 (source: neo4j.com/brand) | CC0-1.0; [Neo4j brand](https://neo4j.com/brand/#logo) | `#4581c3` both themes |
| Weaviate | Symbol (hexagonal "W" outline) from the weaviate.io header logo | [weaviate.io/img/site/2026/weaviate-logo-2-colours-dark-green.svg](https://weaviate.io/img/site/2026/weaviate-logo-2-colours-dark-green.svg) (fetched 2026-10-27), copy: `weaviate-logo-2-colours-dark-green.svg`; the symbol is its gradient-filled path, wordmark paths left out | No brand kit or logo usage terms published that we could find (weaviate.io/brand and /press return 404; the docs repository has no licence); used as a nominative reference to Weaviate like the other marks | Dark: the gradient the file is served with (`#75FBAE` → `#B6F874`, only a dark-background version exists); light: the same outline in text ink |
| Keycloak | Simple Icons `keycloak` | simple-icons@16.36.0 (source: keycloak/keycloak-misc `logo/icon-black.svg`) | CC0-1.0; [Linux Foundation trademark usage](https://www.linuxfoundation.org/legal/trademark-usage) (black and white icons provided) | One-colour: text ink, both themes |
| OpenBao | Simple Icons `openbao` | simple-icons@16.36.0 (source: openbao/artwork `black/openbao-single-black.svg`) | CC0-1.0 (Simple Icons); artwork CC-BY-SA-4.0; [OpenBao brand policy](https://openbao.org/docs/policies/brand/) (black and white versions provided) | `#336d5c` light; text ink (white) dark |
| Temporal | Simple Icons `temporal` | simple-icons@16.36.0 (source: temporalio/temporaldotio `temporal-no-text.svg`) | CC0-1.0; Temporal trademark (black and white versions in use by Temporal) | One-colour: text ink, both themes |

## Rendering rules

- `src/lib/brands.mjs` → `brandIconHtml()`: one `<svg>` per mark, `fill="currentColor"` unless the
  source fixes a colour (Zerops). Theme colours come from `--kk-brand-light` / `--kk-brand-dark`
  inline custom properties (`src/styles/brands.css`).
- Decorative by default (`aria-hidden="true"`), because the product name is always written next to
  the mark; `labelled` exposes the name through `role="img"` + `aria-label`.
- Every mark is a 1em square; `.kk-brand-tile` is the fixed box used on cards and page titles.
- Adding a mark: add the entry to `brands.mjs`, a row here, and (if not from Simple Icons) the
  unmodified original file to this directory.
