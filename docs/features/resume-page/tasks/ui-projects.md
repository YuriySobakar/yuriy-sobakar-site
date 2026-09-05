---
id: T8
title: "SCR-05 projects: три варіанти картки — commercial, pet, confidential"
layer: "ui"
deps: ["T3"]
acs: ["AC-05", "AC-06"]
files_hint: ["src/_includes/sections/projects.njk", "src/styles/base.css"]
owner: "Yuriy Sobakar"
estimate: "M"
status: "todo"
---

# T8 — SCR-05 projects

## Why

Commercial project із назвою, галуззю, живим посиланням, стеком, роллю і результатом без коду; pet project ще й з кодом; confidential — лише галузь, роль, результат, і так само у вихідному тексті — [spec AC-05, AC-06](../spec.md), [CONTEXT.md](../../../CONTEXT.md), [sad §8](../sad.md) «Посилання», «Confidential project». Стани `default · commercial / pet / confidential`, `default @768+`, `empty` і wireframe G — [screens.md SCR-05](../screens.md).

## What

- `src/_includes/sections/projects.njk`: прибрати `{% if resume.projects.length %}`; `<ul class="cards">` (сітка з `layout.css`), на проєкт `<li class="card">`:
  - заголовок `h3`: `project.name`, а для `project.confidential` — `project.industry` + `<span class="tag">Confidential</span>`;
  - `card__meta` галузь (коли є і не confidential-заголовок), стек як `tags` / `tag` (поле просто відсутнє у confidential — шаблон пише `{% if project.stack %}` як перевірку наявності поля, не як приховування секрету), роль, результат;
  - `card__links`: `<a class="button" target="_blank" rel="noopener noreferrer">Live</a>` для `links.live`, `Code` для `links.code` (буває лише у pet — T1 блокує його у commercial). Підписи `Live` / `Code` / `Confidential` — службовий текст шаблону (spec §3).
- `src/styles/base.css`: `.card__links` як flex-ряд з `gap: var(--space-2)` (додати до групи flex-списків); при потребі `.card__title` вирівнювання з чипом — через токени.
- Перевикористовує `card`, `card__meta`, `tag`, `button`.

## Definition of Done

- [ ] На фікстурі з трьома проєктами HTML містить: для commercial — назву, галузь, `Live`, без `Code`; для pet — `Live` і `Code`; для confidential — галузь і `Confidential`, і **не містить** назви клієнта, жодного його URL і його стеку в усьому файлі (перевіряє T10).
- [ ] Усі посилання проєктів мають `target="_blank" rel="noopener noreferrer"`.
- [ ] У шаблоні немає умови на `project.confidential` для приховування `name` / `links` (їх немає у view model); дозволена лише умова для варіанта заголовка і чипа.
- [ ] `npm run build`, `npm run lint` зелені.

## Notes

- Ділить `base.css` з T5 — одна смуга.
- Hard rule (ADR-0002): другий бар'єр проти витоку — тест T10, не логіка шаблону.
