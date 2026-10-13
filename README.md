# karakoram.dev

Source for [karakoram.dev](https://karakoram.dev), the website and documentation
of [Karakoram](https://github.com/KarakoramDev/Karakoram) — self-hosted MongoDB
orchestration for Zerops.

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
   `deploy/zerops/import.yaml` for the landing page quick start.

The build fails if a relative link points to a missing file (ingestion) or if
an internal link or `#anchor` does not resolve
([starlight-links-validator](https://github.com/HiDeoo/starlight-links-validator)).

| Source file | Route |
| --- | --- |
| `README.md` | `/docs/` |
| `docs/install.md`, `docs/upgrade.md` | `/docs/getting-started/install/`, `/docs/getting-started/upgrade/` |
| `docs/user-guide/<name>.md` | `/docs/user-guide/<name>/` |
| `docs/adr/README.md`, `docs/adr/<adr>.md` | `/docs/adr/`, `/docs/adr/<adr>/` |
| `docs/<name>.md` | `/docs/<name>/` |
| `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` | `/docs/contributing/`, `/docs/code-of-conduct/` |

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

It runs on pushes to `main`, daily on a schedule, on manual dispatch and on a
`docs-updated` repository dispatch event. Pull requests run
`.github/workflows/check.yml`, which builds the site with both base paths.

### Rebuilding after documentation changes

- **Automatically:** the daily scheduled build picks up changes on the code
  repository's `main`. GitHub pauses scheduled workflows after 60 days without
  activity in this repository; re-enable the workflow in the Actions tab if that
  happens.
- **Manually:** Actions → *Deploy site* → *Run workflow*, or
  `gh workflow run deploy.yml -R KarakoramDev/karakoram.dev`.
- **From the code repository (optional):** add a workflow there that sends a
  repository dispatch when `docs/**`, `README.md`, `CONTRIBUTING.md` or
  `CODE_OF_CONDUCT.md` change on `main`. It needs a secret holding a
  fine-grained token with *Contents: read and write* on
  `KarakoramDev/karakoram.dev` (here named `SITE_DISPATCH_TOKEN`):

  ```yaml
  name: Rebuild website
  on:
    push:
      branches: [main]
      paths: [docs/**, README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md]
  jobs:
    dispatch:
      runs-on: ubuntu-latest
      steps:
        - run: gh api repos/KarakoramDev/karakoram.dev/dispatches -f event_type=docs-updated
          env:
            GH_TOKEN: ${{ secrets.SITE_DISPATCH_TOKEN }}
  ```

## License

The site code is licensed under the [Apache License 2.0](LICENSE). The
documentation content is pulled from
[KarakoramDev/Karakoram](https://github.com/KarakoramDev/Karakoram) and remains
under that repository's license.

Percona Server for MongoDB and Percona Backup for MongoDB are Percona products
and trademarks; OpenEverest, MongoDB and Zerops names and marks belong to their
respective owners. Karakoram is independent and is not affiliated with or
endorsed by any of them.
