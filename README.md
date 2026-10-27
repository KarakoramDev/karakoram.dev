# karakoram.dev

Source for [karakoram.dev](https://karakoram.dev), the website and documentation
of [Karakoram](https://github.com/KarakoramDev/Karakoram) — self-hosted database
and stateful-service orchestration on infrastructure you run: [Zerops](https://zerops.io) (the
reference backend), [Dokploy](https://dokploy.com) and [HashiCorp Nomad](https://developer.hashicorp.com/nomad).

The site is a static [Astro](https://astro.build) +
[Starlight](https://starlight.astro.build) build published with GitHub Pages:

- `/` — the landing page (`src/pages/index.astro`).
- `/docs/` — the documentation, rendered from the code repository at build time.
  Search is provided by Pagefind, built into Starlight.

## Where the documentation comes from

Documentation is written **only** in the code repository
[KarakoramDev/Karakoram](https://github.com/KarakoramDev/Karakoram): `README.md`,
`docs/**`, `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`. This repository never
contains a copy of it. To change the docs, open a pull request there.

Link the first prose mention of third-party technologies to their official HTTPS
project or vendor website (per section on long pages). Keep headings, code and
existing documentation links unchanged; landing-page cards link vendors in their
descriptions while their titles continue to open the Karakoram guides.

`scripts/ingest-docs.mjs` runs before every `dev` and `build` (`predev` /
`prebuild`). It:

1. Uses the checkout in `KARAKORAM_DOCS_DIR`, or shallow-clones
   `KARAKORAM_REPO` (default `KarakoramDev/Karakoram`) at `KARAKORAM_REF`
   (default `main`) into `.cache/karakoram`.
2. Writes Starlight content to `src/content/docs/docs/` (gitignored): the first
   H1 becomes the page title, the first paragraph the description, and every
   page gets an "Edit page" link to the source file on GitHub.
3. Rewrites relative links: links between documentation files become site
   routes; links to other repository files (for example `api/openapi.yaml`)
   become GitHub URLs.
4. Generates the sidebar (`src/generated/sidebar.json`) and copies
   `deploy/zerops/import.yaml` for the landing page's Zerops install path.

The build fails if a relative link points to a missing file (ingestion) or if
an internal link or `#anchor` does not resolve
([starlight-links-validator](https://github.com/HiDeoo/starlight-links-validator)).

| Source file | Route |
| --- | --- |
| `README.md` | `/docs/` |
| `docs/quickstart.md`, `docs/install.md`, `docs/upgrade.md` | `/docs/getting-started/quickstart/`, `/docs/getting-started/install/`, `/docs/getting-started/upgrade/` |
| `docs/backends.md`, `docs/operating-costs.md` | `/docs/backends/`, `/docs/operating-costs/` (sidebar group "Getting started") |
| `docs/zerops.md`, `docs/dokploy.md`, `docs/nomad.md` | `/docs/zerops/`, `/docs/dokploy/`, `/docs/nomad/` (sidebar group "Backends", in that order) |
| `docs/control-plane-backup.md`, `docs/backup-drills.md`, `docs/notifications.md` | `/docs/control-plane-backup/`, `/docs/backup-drills/`, `/docs/notifications/` (sidebar group "Fleet operations") |
| `docs/<name>.md` | `/docs/<name>/` (sidebar group "Control plane", "Interfaces", "AI agents" or "Reference") |
| `docs/<engine>/README.md`, `docs/<engine>/<name>.md` | `/docs/<engine>/`, `/docs/<engine>/<name>/` (one sidebar group per engine: MongoDB, PostgreSQL, Supabase, RabbitMQ, Elasticsearch, MySQL and PXC, Neo4j, Weaviate, Keycloak, OpenBao, Temporal) |
| `docs/adr/README.md`, `docs/adr/<adr>.md` | `/docs/adr/`, `/docs/adr/<adr>/` |
| `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` | `/docs/contributing/`, `/docs/code-of-conduct/` |

Sidebar groups, order and labels are listed in `sections` in `scripts/ingest-docs.mjs`.
Old `/docs/user-guide/<name>/` URLs and `/docs/pricing/` redirect to their new
pages (`movedDocs` in `astro.config.mjs`).

## Machine-readable documentation

The build uses [starlight-llms-txt](https://delucis.github.io/starlight-llms-txt/)
to publish `/llms.txt` (a project summary and links from the generated sidebar),
`/llms-full.txt` (complete documentation), and `/llms-small.txt` (a condensed
version for smaller context windows). Newly ingested pages appear automatically;
the AI agents group (`/docs/mcp-quickstart/`, `/docs/mcp/`, `/docs/data-mcp/`)
is listed like every other sidebar entry. The project summary at the top of
`llms.txt` is the `description` passed to the plugin in `astro.config.mjs`.

Every documentation page also has a Markdown twin: remove the trailing slash
and append `.md`, for example `/docs/getting-started/install.md`, `/docs/api.md`,
`/docs/mcp-quickstart.md`, or `/docs.md` for the documentation overview. These
static endpoints (`src/pages/[...page].md.ts`) contain the ingested source
Markdown with title frontmatter; documentation links use the same site routes as
the HTML pages. Each documentation page advertises its twin with a
`<link rel="alternate" type="text/markdown">` in its head. All of these files
are generated into `dist/`, not committed.

## Local development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev        # ingests docs from GitHub (main), then serves http://localhost:4321/
npm run build      # ingest + static build into dist/
npm run preview    # serve dist/
```

Preview documentation from a local checkout of the code repository, for
example while editing docs on a branch:

```sh
KARAKORAM_DOCS_DIR=../Karakoram npm run dev
```

Other environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `KARAKORAM_DOCS_DIR` | unset | Use this checkout instead of cloning. |
| `KARAKORAM_REPO` | `KarakoramDev/Karakoram` | Repository to clone and to link to. |
| `KARAKORAM_REF` | `main` | Branch or tag to clone and to link to. |
| `SITE_URL` | `https://karakoram.dev` | Canonical origin. |
| `BASE_PATH` | `/` | Base path, e.g. `/karakoram.dev` for a project page. |

## Deployment

`.github/workflows/deploy.yml` checks out this repository and the code
repository's `main` branch, builds the site and deploys it with GitHub Pages
(`actions/upload-pages-artifact` + `actions/deploy-pages`). `SITE_URL` and
`BASE_PATH` come from `actions/configure-pages`, so the same workflow works for
the custom domain and for `https://karakoramdev.github.io/karakoram.dev/`.

It runs only when triggered manually; pushes, pull requests and documentation
changes do not build or deploy anything by themselves.

### Deploying

Actions → *Deploy site* → *Run workflow*, or
`gh workflow run deploy.yml -R KarakoramDev/karakoram.dev`. Each run builds the
landing page from this repository's `main` and the documentation from the code
repository's `main` at that moment.

## License

The site code is licensed under the [Apache License 2.0](LICENSE). The
documentation content is pulled from
[KarakoramDev/Karakoram](https://github.com/KarakoramDev/Karakoram) and remains
under that repository's license.

Percona Server for MongoDB, Percona Backup for MongoDB, Percona Distribution for
PostgreSQL, Percona Server for MySQL, Percona XtraDB Cluster and Percona
XtraBackup are Percona products and trademarks. RabbitMQ is a trademark of
Broadcom Inc. Elasticsearch, Kibana and Logstash are trademarks of Elastic N.V.
OpenEverest, MongoDB, PostgreSQL, MySQL, Supabase, Citus, Weaviate, Neo4j,
Keycloak, OpenBao, Temporal, Zerops, Dokploy and Nomad names and marks belong to
their respective owners. Karakoram is independent and is not affiliated with or
endorsed by any of them.
