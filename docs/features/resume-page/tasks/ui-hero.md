---
id: T5
title: "SCR-02 hero: ім'я, позиціювання, fact-list, контакти до лінії згортки 360×640"
layer: "ui"
deps: ["T3"]
acs: ["AC-01", "AC-02"]
files_hint: ["src/_includes/sections/hero.njk", "src/styles/base.css"]
owner: "Yuriy Sobakar"
estimate: "S"
status: "todo"
---

# T5 — SCR-02 hero

## Why

Перший екран веде до контакту: ім'я, позиціювання, 1–3 факти і контакти видно до прокрутки на 360×640 — [spec AC-01](../spec.md), [sad §6 Flow 3](../sad.md) крок 5. Стан `default` і wireframe C — [screens.md SCR-02](../screens.md); факти — новий компонент `fact-list` ([screens.md §New components](../screens.md)), бо `tag` не читається на 60 знаків.

## What

- `src/_includes/sections/hero.njk`: `<h1 class="hero__name">`, `<p class="hero__headline">`, `<ul class="fact-list">` з `<li>` на факт (без класу `tag`; умова `{% if facts %}` зайва — схема гарантує ≥1), `<ul class="hero__contacts">` з `<a class="button" href data-contact="<type>">` на кожен контакт, без `target="_blank"`, з текстовим підписом (`label`). Hero лишається у `<header>` (T4).
- `src/styles/base.css`: примітив `.fact-list` — вертикальний список, `font-size: var(--text-base)`, маркер і відступи через токени (`--space-*`, `--color-text`); прибрати правило `.hero__facts` із групи flex-списків. Жодних нових значень поза токенами.
- Перевикористовує: `section` (варіант hero без `h2`), `button`, токени типографіки.

## Definition of Done

- [ ] Зібраний HTML містить `<h1>`, позиціювання, стільки `<li>` у `.fact-list`, скільки фактів у даних, і по одному `data-contact` на контакт (перевіряє T10).
- [ ] У `hero.njk` немає `class="tag"` для фактів і немає `target=` на контактах.
- [ ] Ручна перевірка у dev-сервері на 360×640 з 3 фактами і 3 контактами: увесь hero видно без прокрутки.
- [ ] `npm run build`, `npm run lint` зелені.

## Notes

- Ділить `base.css` з T8 (картки) — одна смуга; будь-який порядок.
- Фото й телефон не рендеряться (дефолти spec §8 / sad §11); тип `phone` у даних просто дав би ще одну кнопку.
- `fact-list` реєструється у `docs/design-system.md` після `/sdd:design-system` — не в цій задачі.
