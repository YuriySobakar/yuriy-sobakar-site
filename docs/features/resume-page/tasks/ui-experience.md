---
id: T6
title: "SCR-03 experience: записи з view model, період з підписом Present"
layer: "ui"
deps: ["T3"]
acs: ["AC-03"]
files_hint: ["src/_includes/sections/experience.njk"]
owner: "Yuriy Sobakar"
estimate: "S"
status: "todo"
---

# T6 — SCR-03 experience

## Why

Досвід від найновішого до найстаршого, відкритий період підписано «Present», кожен запис із роллю, компанією, періодом і результатами — [spec AC-03](../spec.md), [sad §8](../sad.md) «Дати». Стани `default`, `default · current role`, `empty` і wireframes D / E — [screens.md SCR-03](../screens.md).

## What

`src/_includes/sections/experience.njk`: прибрати зовнішній `{% if resume.experience.length %}` (порожньої section у view model немає); цикл по `resume.experience` у порядку view model (шаблон не сортує); `timeline-item` з `h3` роль, компанія, період `{{ job.start }} – {{ "Present" if job.current else job.end }}` у `<p class="timeline-item__meta">` (уже `--text-small`), список результатів без умови на порожнє (правило T1 гарантує ≥1). Перевикористовує `section`, `timeline-item`, `timeline-item__meta` з `base.css`; нових стилів немає.

## Definition of Done

- [ ] На фікстурі з трьома записами HTML містить їх у порядку від найновішого `start`; запис без `end` містить `– Present` (перевіряє T10).
- [ ] У шаблоні немає умов приховування section чи результатів і немає звертання до `job.end` як ознаки «поточна робота» — лише `job.current`.
- [ ] `npm run build`, `npm run lint` зелені.

## Notes

- Hard rule (ADR-0002): жодних фільтрів `sort` у Nunjucks.
