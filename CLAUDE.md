# yuriy-sobakar-site — conventions

One-page resume site of Yuriy Sobakar. Static HTML built by Eleventy from a single YAML file.
The full decision record lives in [docs/architecture-map.md](docs/architecture-map.md) and
[docs/adr/](docs/adr/); feature artifacts in `docs/features/<slug>/`. Pipeline documents are in
Ukrainian, site content is in English.

## Stack

- Node.js 20+, JavaScript ESM only — no TypeScript, no transpilation.
- Eleventy 3 with Nunjucks templates (`eleventy.config.js`, input `src/`, output `_site/`).
- Content: `src/_data/resume.yaml` validated against `src/_data/resume.schema.json` at build time
  (`lib/resume/load.js`). An invalid file stops the build with a field-level message.
- Styles: vanilla CSS with custom properties, four files in `src/styles/`.
- Tests: `node --test` in `test/`. Lint: `html-validate` over the built HTML.
- Hosting: Netlify (`netlify.toml`), `main` = production, pull requests = deploy previews.
  CI: GitHub Actions (`.github/workflows/ci.yml`).

## Commands

```
npm install        # once
npm test           # node --test test/*.test.js
npm run build      # eleventy → _site/
npm run lint       # html-validate "_site/**/*.html"  (run after build)
npm run dev        # eleventy --serve
```

## Rules

1. **Every text on the page comes from `src/_data/resume.yaml`.** No hardcoded content in templates,
   except UI labels (link captions, "Present", screen-reader text). Section headings and order are
   in the YAML `sections` array.
2. **Schema first.** A new field is added to `resume.schema.json` before `resume.yaml`;
   `additionalProperties: false` makes the schema test fail until both are updated.
3. **One partial per section** in `src/_includes/sections/<id>.njk`, included from `src/index.njk`
   in the order the YAML declares. New section = partial + YAML field + schema + `sections` enum.
4. **Tokens only.** Colours, spacing, type sizes and radii come from `src/styles/tokens.css`;
   layout is mobile-first in `layout.css` (breakpoints 768 / 1280); primitives (`section`, `tag`,
   `card`, `timeline-item`, `button`) live in `base.css`.
5. **Everything printable lives only in `src/styles/print.css`** (linked with `media="print"`).
   No effects that don't survive paper: no animations, no dark fills.
6. **No client-side JavaScript**, except the single `window.print()` handler (roadmap step 5) and
   the exception recorded in `docs/features/resume-page/adr/0003` (contact click counter).
   Anything else needs an ADR.
7. **Never use the `safe` filter on resume data** — Nunjucks autoescape stays on; the build test
   fails if a section partial contains `| safe`.
8. **Branches and commits:** features in `feat/<slug>`, merged to `main` via pull request with green
   CI; commit messages `type: summary`.
9. No database, no migrations: persistence is the YAML file in git.
