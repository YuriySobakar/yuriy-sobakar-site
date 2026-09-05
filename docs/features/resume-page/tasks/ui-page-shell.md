---
id: T4
title: "SCR-01 каркас сторінки: landmarks header / main / footer, порядок section з view model, адаптив 360 / 768 / 1280"
layer: "ui"
deps: ["T3"]
acs: ["AC-08", "AC-10"]
files_hint: ["src/_includes/layout.njk", "src/index.njk", "src/styles/layout.css"]
owner: "Yuriy Sobakar"
estimate: "S"
status: "todo"
---

# T4 — SCR-01 каркас сторінки

## Why

Одна прокручувана сторінка без горизонтальної прокрутки, з landmarks і текстом 16 / 14 px — [spec AC-10](../spec.md), [sad §8](../sad.md) «Доступність», [sad §10 QG-4](../sad.md); стани і wireframes A / B — [screens.md SCR-01](../screens.md) (`default @360`, `default @768`, `default @1280`; рядки `previous version` / `updated` — та сама розкладка). Порожня section відсутня в HTML, бо її вже немає у `sections` view model (AC-08).

## What

- `src/_includes/layout.njk`: замість одного `<main class="page">` — `<header>` (hero), `<main>` (section з `resume.sections`, крім `contacts`), `<footer>` (`contacts`), усі всередині контейнера `.page`. Стилі підключені як зараз; місце для тегу лічильника лишається T9.
- `src/index.njk`: hero у `header`; цикл по `resume.sections` у порядку view model — section з `id: contacts` рендериться у `footer`, решта у `main`. Жодних `{% if ... length %}` — порожніх section у view model немає.
- `src/styles/layout.css`: `.page` з `max-width: var(--page-max-width)`; клас `.skill-groups` (сітка, використає T7) і наявний `.cards` — 1 колонка до 768, `repeat(2, 1fr)` від 768; від 1280 центрування як зараз. Значення лише з токенів.
- Новий компонент не потрібен: перевикористовує `section`, токени `tokens.css` (`--text-base`, `--text-small`, `--page-max-width`).

## Definition of Done

- [ ] Зібраний `index.html` містить рівно один `<header>`, один `<main>`, один `<footer>`; `<h1>` = `resume.name`; кількість `<h2>` = довжина `sections` view model, у тому ж порядку (перевіряє T10).
- [ ] `npm run build` і `npm run lint` зелені; `build.test.js` (`| safe` тільки для `content` у `layout.njk`) зелений.
- [ ] Ручна перевірка на dev-сервері або deploy preview на 360, 768, 1280 px: горизонтальної прокрутки немає; `.skill-groups` і `.cards` стають 2 колонки від 768.

## Notes

- Ділить `layout.njk` з T9 (лічильник) — `implement` серіалізує пару; T4 іде першим.
- Hard rule: розміри тексту не задавати у `layout.css` — вони у `tokens.css` / `base.css`.
