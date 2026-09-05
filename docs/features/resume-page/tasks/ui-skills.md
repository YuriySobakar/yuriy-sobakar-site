---
id: T7
title: "SCR-04 skills: групи у порядку view model, чипи без шкал, сітка 2 колонки від 768 px"
layer: "ui"
deps: ["T3", "T4"]
acs: ["AC-04", "AC-08"]
files_hint: ["src/_includes/sections/skills.njk"]
owner: "Yuriy Sobakar"
estimate: "S"
status: "todo"
---

# T7 — SCR-04 skills

## Why

Навички групами у порядку resume data, без рівнів і шкал; порожня група відсутня — [spec AC-04, AC-08](../spec.md), [sad §8](../sad.md) «Порожні section і групи». Стани `default @360`, `default @768+`, `empty · group`, `empty · section` і wireframe F — [screens.md SCR-04](../screens.md).

## What

`src/_includes/sections/skills.njk`: прибрати `{% if resume.skills.length %}` і `{% if group.items.length %}` — view model уже прибрав порожнє; обгорнути групи у `<div class="skill-groups">` (сітка з T4 `layout.css`); кожна група — `<div class="skill-group">` з `<h3>` і `<ul class="tags">` із `<li class="tag">`. Перевикористовує `section`, `tag`, `tags`; нових стилів немає.

## Definition of Done

- [ ] На фікстурі з групами A, B(порожня), C HTML містить `<h3>` A і C у цьому порядку і не містить `<h3>` B (перевіряє T10).
- [ ] У розмітці навичок немає чисел, відсотків чи `<progress>` / `<meter>`.
- [ ] Ручна перевірка на 768 px: групи у два стовпці, порядок читання зліва-направо зберігає порядок YAML.
- [ ] `npm run build`, `npm run lint` зелені.

## Notes

- Залежить від T4 через клас `.skill-groups` у `layout.css`; сам `layout.css` не чіпає.
