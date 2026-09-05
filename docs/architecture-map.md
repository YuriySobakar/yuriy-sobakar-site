---
status: current
mode: greenfield-bootstrap
updated_at: "2026-09-05"
reflects_commit: "6f52406"
# machine-readable keys — the DECIDED toolchain of the greenfield foundation; "" = not yet decided.
# implement's command-detection cascade reads test_cmd/lint_cmd right after the settings override.
language: "javascript (node 20+, ESM)"
build_cmd: "npm run build"
test_cmd: "npm test"
lint_cmd: "npm run lint"
migration_tool: ""
frontend: "eleventy 3 (nunjucks templates) + vanilla css with custom properties"
---

# Architecture map — yuriy-sobakar-site

> Цільовий фундамент (`mode: greenfield-bootstrap`), зафіксований у foundation-сесії `survey`
> 2026-09-05 разом із власником. C4 нижче описує **те, що зараз буде заскафолджено**, а не наявний
> код: у репозиторії на момент карти є лише `docs/idea-brief.md`, `.gitignore` та налаштування SDD.
> Читають: `scaffold` (матеріалізує скелет), `specify` (обмеження), `design`, `implement`.
> Оновлювати через `survey`, коли репозиторій піде далі за `reflects_commit`.

## Stack

- **Мова / рантайм:** JavaScript (ESM) на Node.js 20+ — без TypeScript і без транспіляції; браузерного JavaScript на сторінці немає, крім одного виклику друку (`package.json`, після скаффолду).
- **Генератор сайту:** Eleventy 3 (`@11ty/eleventy`) — читає шаблони Nunjucks та файл даних і віддає статичний HTML у `_site/` (`eleventy.config.js`). Рішення → `docs/adr/0001-static-site-generator-eleventy.md`.
- **Дані:** один файл `src/_data/resume.yaml` + JSON Schema `src/_data/resume.schema.json`; YAML підключається до Eleventy через data extension (`eleventy.config.js`). Рішення → `docs/adr/0002-content-single-yaml-with-schema.md`.
- **Стилі:** чистий CSS з кастомними властивостями (дизайн-токени) та окремим `print.css`; жодного препроцесора чи утилітарного фреймворку. Рішення → `docs/adr/0003-styling-vanilla-css-and-print-view.md`.
- **PDF:** друковані стилі + кнопка «Download PDF», яка викликає системний друк браузера; файл PDF не генерується і не зберігається. Рішення → `docs/adr/0004-pdf-via-browser-print.md`.
- **Build / test / lint:** `npm run build` → `eleventy --input=src` (вихід `_site/`, Eleventy-дефолт — у конфігу `dir.input` і `dir.output` навмисно не задані, бо вони перекривають програмні виклики, а тест збірки рендерить тимчасову копію `src/` у тимчасову теку); `npm test` → `node --test test/*.test.js` (вбудований ранер Node; директорія як аргумент не працює на Node 20/25, тому glob); `npm run lint` → `html-validate "_site/**/*.html"` (конфіг `.htmlvalidate.json`, SRI лише для crossorigin-ресурсів). Ці команди читає `implement`. Звірено з реальним прогоном на `scaffold` 2026-09-05.
- **CI / деплой:** GitHub Actions (`.github/workflows/ci.yml`: install → test → build → lint) на кожен push і pull request; Netlify збирає `npm run build` і публікує `_site` (`netlify.toml`), гілка `main` = production, pull request = deploy preview.

## C4 — system as it is

```mermaid
C4Container
    title Target containers — yuriy-sobakar-site (greenfield baseline)
    Person(recruiter, "Recruiter / Hiring manager", "Opens the link from a CV or LinkedIn, scans the page, saves a PDF")
    Person(owner, "Yuriy (site owner)", "Edits resume.yaml, pushes to main")
    System_Boundary(repo, "yuriy-sobakar-site repository") {
        Container(content, "Content", "resume.yaml + resume.schema.json", "Single source of truth for experience, skills, projects, contacts")
        Container(templates, "Templates", "Nunjucks (.njk)", "One page layout composed of section partials")
        Container(styles, "Styles", "Vanilla CSS + print.css", "Design tokens, responsive layout, printable resume view")
        Container(build, "Eleventy build", "Node 20, @11ty/eleventy", "Validates data against the schema, renders templates into static HTML")
        Container(tests, "Tests + lint", "node --test, html-validate", "Schema validation, build smoke test, HTML validity")
    }
    Container(site, "Static site", "HTML + CSS in _site/", "The published one-page resume with web and print views")
    System_Ext(netlify, "Netlify", "Runs npm run build, hosts _site, deploy previews for PRs")
    System_Ext(github, "GitHub + Actions", "Source of truth for code; CI runs test + build + lint")
    Rel(owner, content, "edits", "git commit / push")
    Rel(build, content, "reads + validates")
    Rel(build, templates, "renders")
    Rel(build, styles, "copies as passthrough")
    Rel(build, site, "emits")
    Rel(tests, site, "checks the built HTML")
    Rel(github, tests, "runs on push / PR")
    Rel(netlify, build, "runs on push to main")
    Rel(netlify, site, "serves over HTTPS")
    Rel(recruiter, site, "reads, prints to PDF", "HTTPS")
```

## Module inventory

| Module | Path | Layers | Wired at | Responsibility |
|---|---|---|---|---|
| content | `src/_data/` | data | `eleventy.config.js` (yaml data extension) | `resume.yaml` — весь зміст сайту; `resume.schema.json` — контракт полів, перевіряється тестом і під час збірки |
| resume loader | `lib/resume/` | data | `eleventy.config.js` (data extension викликає `load.js`) | `load.js` — конвеєр publish gate: YAML → JSON Schema (Ajv, `allErrors`) → `rules.js` → `view-model.js`; будь-яке порушення — `ResumeValidationError` з рядками `resume.yaml › <шлях> "<запис>": <правило словами>`, збірка зупиняється (`docs/features/resume-page/adr/0001`, `0002`) |
| publish rules | `lib/resume/rules.js`, `lib/resume/code-hosts.js` | data | `load.js` після успішної схеми | `rules.js` — перехресні інваріанти (запис досвіду без результату, commercial project без галузі, посилання на код / code-хост); `code-hosts.js` — список code-хостів і винятків `*.github.io` / `*.gitlab.io` / `*.pages.dev`, `isCodeHost(url)` |
| view model | `lib/resume/view-model.js` | data | `load.js` (`loadResume` повертає його шаблонам як `resume`) | безпечне подання: досвід за `start` спадно з `current: true`, порожні групи і section прибрані, confidential project без `name` / `links` / `stack`, commercial без `links.code` |
| site settings | `src/_data/site.json` | data | Eleventy global data (`site.*`) | службові налаштування, не зміст: адреса скрипта і endpoint лічильника кліків (`adr/0003`); порожні рядки = лічильник вимкнено |
| templates | `src/index.njk`, `src/_includes/` | presentation | `eleventy.config.js` (input `src` через `--input=src`, includes `_includes`) | `layout.njk` — `<head>`, контейнер `.page`, тег лічильника + обробник кліків; `index.njk` — landmarks `header` (hero) / `main` (section з view model) / `footer` (contacts); `sections/*.njk` — по одному партіалу на секцію (hero, experience, skills, projects, contacts; built-with — крок 6), лише цикл і вивід |
| styles | `src/styles/` | presentation | `layout.njk` (`<link>`), passthrough copy in `eleventy.config.js` | `tokens.css` (кольори, відступи, типографіка), `base.css`, `layout.css` (адаптив), `print.css` (`@media print`) |
| assets | `src/assets/` | static | passthrough copy in `eleventy.config.js` | зображення, favicon, шрифти (якщо self-hosted) |
| build config | `eleventy.config.js`, `package.json`, `netlify.toml` | infra | — | вхід/вихід Eleventy, npm-скрипти, команда і папка публікації для Netlify |
| tests | `test/` | test | `package.json` → `npm test` | `resume-schema.test.js` (схема + зшивка конвеєра), `resume-rules.test.js` (по тесту на правило і code-хост), `view-model.test.js` (подання), `build.test.js` (рендер тимчасової копії `src/` з `test/fixtures/*.yaml`: landmarks, порядок, порожні section відсутні, назва confidential відсутня у всьому HTML, лічильник, зламана фікстура не пише `index.html`) |
| ci | `.github/workflows/ci.yml` | infra | GitHub Actions | install → `npm test` → `npm run build` → `npm run lint` |
| docs | `docs/` | docs | — | бриф, ця карта, ADR, роадмап, артефакти фіч (`docs/features/<slug>/`) |

## Conventions (cited — the rules a new feature must match)

Правила, яким слідує скаффолд і кожна наступна фіча (файли з'являються після `/sdd:scaffold`):

- **Один джерело змісту:** будь-який текст, що показується на сторінці, береться з `src/_data/resume.yaml`; хардкод тексту в шаблонах заборонений, окрім службових підписів (назви секцій задаються в YAML також) — `src/_data/resume.yaml`.
- **Схема даних обов'язкова:** нове поле в YAML спершу додається в `src/_data/resume.schema.json`, тест схеми падає до оновлення обох — `test/resume-schema.test.js`.
- **Шаблони:** одна сторінка `src/index.njk` збирається з партіалів `src/_includes/sections/<section>.njk`; кожна секція — окремий партіал, підключений через `{% include %}` у порядку, заданому масивом у YAML — `src/_includes/layout.njk`.
- **Стилі:** значення кольорів/відступів/шрифтів тільки через кастомні властивості з `src/styles/tokens.css`; розкладка — CSS Grid/Flex, mobile-first, брейкпоінти в `layout.css`; усе друковане — тільки в `src/styles/print.css` (`@media print`), без ефектів, що не переживають друк (анімації, темні заливки) — `src/styles/print.css`.
- **Без клієнтського JavaScript**, окрім одного inline-обробника кнопки друку (`window.print()`) і лічильника кліків по контактах (один async-тег + один обробник у `layout.njk`, адреса в `site.json`, `docs/features/resume-page/adr/0003`); будь-яка інтерактивність понад це потребує ADR.
- **Тести:** вбудований ранер Node (`node --test`), файли `test/*.test.js`; кожен тест або перевіряє дані за схемою, або збирає сайт у тимчасову папку і читає HTML — `test/build.test.js`.
- **Помилки збірки:** невалідний YAML зупиняє збірку з повідомленням про поле і назву запису (схема, потім правила — у data extension), а не публікує порожню секцію — `eleventy.config.js`, `lib/resume/load.js`.
- **Форма vs правило:** форма поля — у схемі; перехресний інваріант — функція в `lib/resume/rules.js` + тест у `test/resume-rules.test.js`; шаблони не приховують і не сортують — це `lib/resume/view-model.js` (`docs/features/resume-page/adr/0001`, `0002`).
- **Гілки і коміти:** фічі — у гілках `feat/<slug>`, у `main` потрапляють через pull request з зеленим CI і deploy preview Netlify; коміти в стилі `type: summary` — `.github/workflows/ci.yml`.
- **Міграції / ідентифікатори:** N/A — бази даних немає, персистентність = файл у git.

## Datastores

| Store | Engine | Accessed via | Notes |
|---|---|---|---|
| `src/_data/resume.yaml` | файл у git | Eleventy global data (`resume.*` у шаблонах) | Єдине джерело правди; історія змін = історія git. Бази даних немає і не планується. |

## Frontend / UI foundation

- **Component library / design system:** власна, мінімальна — партіали секцій у `src/_includes/sections/` і токени; сторонніх UI-кітів немає — `src/_includes/sections/`.
- **Design tokens:** кастомні властивості в `src/styles/tokens.css` (палітра, шкала відступів, типографіка, радіуси); темна тема — через `prefers-color-scheme`, якщо буде обрана в design — `src/styles/tokens.css`.
- **Styling approach:** vanilla CSS, mobile-first, `@media print` в окремому файлі — `src/styles/layout.css`, `src/styles/print.css`.
- **Shared primitives:** `section` з заголовком, `tag`/`chip` для навичок, `card` для проєктів, `timeline-item` для досвіду, `button` (друк, посилання), `fact-list` (1–3 факти на hero, `docs/features/resume-page/screens.md` §New components) — визначаються в `src/styles/base.css` як класи; нова секція складається з них. Сітки `.skill-groups` / `.cards` (2 колонки від 768 px) — у `layout.css`.
- **State / data-fetching:** немає — сторінка статична.
- **Closest UI precedent:** нова секція виглядає як `src/_includes/sections/experience.njk` (заголовок із YAML + цикл по масиву + картки/елементи таймлайну).

## Where things live / closest precedents

- Нова секція резюме → партіал у `src/_includes/sections/`, поле в `resume.yaml` + `resume.schema.json`, підключення в `layout.njk`; за зразком `experience.njk`.
- Зміна тексту/досвіду → тільки `src/_data/resume.yaml`; тест схеми і тест збірки підтвердять, що все на місці.
- Зміна вигляду → токени в `tokens.css`, розкладка в `layout.css`; друковану версію правити окремо в `print.css` і перевіряти через Print preview.
- Секція «як зроблено цей сайт» → `src/_includes/sections/built-with.njk`, посилання на репозиторій і на `docs/` беруться з YAML.
- Хостинг/деплой → `netlify.toml` (build = `npm run build`, publish = `_site`); домен і редіректи — там само.

## Constraints & known tech-debt

- **Розмір XS і профіль Pro:** обсяг фічі тримати в 3–5 задач; жодних нових контейнерів (бекенд, БД, CMS, форми) без окремого ADR — випливає з `docs/idea-brief.md` §5.
- **Статичний хостинг Netlify:** серверного коду немає; будь-яка «динаміка» — лише на етапі збірки.
- **Друк — обмеження дизайну:** дизайн не може спиратися на анімації, темні заливки чи ефекти, які не переживають `@media print` (бриф §6).
- **Без клієнтського JS:** окрім `window.print()`; SEO та швидкість — частина позиціювання власника.
- **Мова змісту сайту — англійська**; мова документів пайплайну — українська (`artifact_language: uk`).
- **Тех-борг:** немає — репозиторій порожній. Старий сайт (статичний HTML 2024) у репозиторій не переноситься; його зміст — джерело для першої версії `resume.yaml`.

## Reconciliation with the authored architecture doc

Авторського документа архітектури немає (`docs/architecture.md`, `ARCHITECTURE.md`, `CLAUDE.md` відсутні); ця карта — поточний еталон. `CLAUDE.md` створить `scaffold` (задача S5) саме з цих конвенцій.
