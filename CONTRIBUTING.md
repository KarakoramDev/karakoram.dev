# Contributing

Karakoram's contribution guidelines, Developer Certificate of Origin sign-off
requirements and Code of Conduct live in the main repository:

- [CONTRIBUTING.md](https://github.com/KarakoramDev/Karakoram/blob/main/CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](https://github.com/KarakoramDev/Karakoram/blob/main/CODE_OF_CONDUCT.md)

They apply to this repository as well.

**Documentation changes** belong in
[KarakoramDev/Karakoram](https://github.com/KarakoramDev/Karakoram) (`docs/`,
`README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`); this site only renders
them. Open pull requests here for the landing page, design, build or
deployment. See the [README](README.md) for local development.

## Blog posts

Add Markdown or MDX to `src/content/blog/`; its file path becomes the URL under
`/blog/` (for example, `operations/backup-drills.md` → `/blog/operations/backup-drills/`).
This collection is independent of imported documentation and is not touched by ingestion.
Required frontmatter: `title`, `description`, `pubDate` (ISO date).
Optional: `updatedDate` (ISO date), `author` (defaults to `Samyazz`),
`tags` (string array), `canonical` (absolute URL), `draft` (defaults to `false`).
For articles first published elsewhere, `canonical` sets the canonical link to
the original URL; the local article URL remains in the RSS feed.
Drafts are visible during development but excluded from production pages and RSS.
Run `npm run dev` to preview posts and `npm run build` for the production output.
