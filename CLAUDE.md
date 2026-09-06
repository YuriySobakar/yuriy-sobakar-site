# yuriy-sobakar-site — conventions

One-page resume site of Yuriy Sobakar. Static HTML built by Eleventy from a single YAML file.
The full decision record lives in [docs/architecture-map.md](docs/architecture-map.md) and
[docs/adr/](docs/adr/); feature artifacts in `docs/features/<slug>/`. Pipeline documents are in
Ukrainian, site content is in English.

## Stack

- Node.js 20+, JavaScript ESM only — no TypeScript, no transpilation.
- Eleventy 3 with Nunjucks templates (`eleventy.config.js`; input `src/` is passed as `--input=src`
  by the npm scripts, output `_site/`). `dir.input` / `dir.output` are deliberately NOT returned from
  the config — they would override the programmatic builds the tests run on temp copies.
- Content pipeline (`lib/resume/`, feature `docs/features/resume-page/`, ADR 0001/0002):
  `src/_data/resume.yaml` → JSON Schema `src/_data/resume.schema.json` (shape: required fields, types,
  1–3 facts) → `lib/resume/rules.js` (cross-field rules; code-host list in `lib/resume/code-hosts.js`)
  → `lib/resume/view-model.js` (safe presentation) → templates. Wired in `lib/resume/load.js`; any
  violation throws `ResumeValidationError` with every problem of the failing stage as
  `resume.yaml › <path> "<entry>": <rule in words>` and stops the build.
- Site settings that are NOT content: `src/_data/site.json` (contact click-counter script + endpoint;
  empty strings = counter off). Available in templates as `site`.
- Styles: vanilla CSS with custom properties, four files in `src/styles/`; design canon in
  [docs/design-system.md](docs/design-system.md). Montserrat is self-hosted (`src/assets/fonts/`,
  `@font-face` in `base.css`) — no external font hosts (the build test checks).
- Tests: `node --test` in `test/` — `resume-schema.test.js` (schema + pipeline wiring),
  `resume-rules.test.js` (one test per rule), `view-model.test.js` (presentation), `build.test.js`
  (renders a temp copy of `src/` with `test/fixtures/*.yaml` and inspects the HTML).
  Lint: `html-validate` over the built HTML.
- Hosting: Netlify (`netlify.toml`), `main` = production, pull requests = deploy previews.
  CI: GitHub Actions (`.github/workflows/ci.yml`).

## Commands

```
npm install        # once
npm test           # node --test test/*.test.js
npm run build      # eleventy --input=src → _site/
npm run lint       # html-validate "_site/**/*.html"  (run after build)
npm run dev        # eleventy --input=src --serve
```

## Rules

1. **Every text on the page comes from `src/_data/resume.yaml`.** No hardcoded content in templates,
   except UI labels (link captions, "Present", "Print", screen-reader text). Section headings and
   order are in the YAML `sections` array (`experience`, `skills`, `projects`, `education`, `contacts`).
2. **Schema first.** A new field is added to `resume.schema.json` before `resume.yaml`;
   `additionalProperties: false` makes the schema test fail until both are updated.
   **Shape goes in the schema; a cross-field invariant = one function in `lib/resume/rules.js` + one
   test in `test/resume-rules.test.js`.** Never express a rule that needs words (entry name, domain)
   in the schema.
2a. **Templates hide and sort nothing.** Empty sections / groups, experience order, `current`, the
   confidential-project strip (no `name` / `links` / `stack`) and the `links.code` strip all happen in
   `lib/resume/view-model.js`; a `.njk` file only loops and prints what the view model gives it. A new
   computed field for a template is added there, with a test in `test/view-model.test.js`.
3. **One partial per section** in `src/_includes/sections/<id>.njk`, included from `src/index.njk`
   in the order the YAML declares. New section = partial + YAML field + schema + `sections` enum.
4. **Tokens only.** Colours, spacing, type sizes and radii come from `src/styles/tokens.css`;
   layout is mobile-first in `layout.css` (breakpoints 768 / 1280; `.skill-groups` and `.cards` go
   to 2 columns from 768); primitives (`section`, `tag`, `card`, `timeline-item`, `button`,
   `fact-list`, `icon`) live in `base.css` and are registered in `docs/design-system.md`. Contact
   icons are inline SVG partials `src/_includes/icons/<contact.type>.njk` — one per schema enum value.
5. **Everything printable lives only in `src/styles/print.css`** (linked with `media="print"`).
   No effects that don't survive paper: no animations, no dark fills.
6. **No client-side JavaScript**, except three ADR-approved pieces: the single `window.print()`
   handler on the hero's "Print" button (roadmap step 5, ADR 0004; the build test allows exactly one
   `onclick`); the contact click counter from `docs/features/resume-page/adr/0003` (exactly one async
   tag + one delegated click handler in `layout.njk`, rendered only when `site.json` has a counter
   address; no cookies, no visitor ids); and the "Share" handler (`docs/adr/0005`: Web Share API with a
   clipboard fallback, one delegated handler in `layout.njk`, no network, no storage). The build test
   fixes the exact `<script>` count. Anything else needs an ADR.
7. **Never use the `safe` filter on resume data** — Nunjucks autoescape stays on; the build test
   fails if a section partial contains `| safe`. The build test also searches the whole HTML for the
   confidential fixture's name / URL / stack — the second barrier after the view model.
8. **Branches and commits:** single `main` branch, no feature branches or pull requests (owner's
   decision 2026-09-05) — commit straight to `main` with green `npm test` + build + lint; commit
   messages `type: summary`.
9. No database, no migrations: persistence is the YAML file in git.
