---
id: T10
title: "Тест збірки на фікстурах: confidential відсутній у HTML, порожня section відсутня, порядок досвіду, landmarks"
layer: "tests"
deps: ["T4", "T5", "T6", "T7", "T8", "T9"]
acs: ["AC-01", "AC-03", "AC-06", "AC-08", "AC-11"]
files_hint: ["test/build.test.js", "test/fixtures/"]
owner: "Yuriy Sobakar"
estimate: "M"
status: "todo"
---

# T10 — Тест збірки на фікстурах

## Why

Другий бар'єр проти витоку confidential project і єдина автоматична перевірка зібраного HTML — [ADR-0002](../adr/0002-templates-render-sanitized-view-model.md) (Positive), [sad §5](../sad.md) `build.test.js`, [sad §10 QG-2](../sad.md); критерії — [spec AC-01, AC-03, AC-06, AC-08, AC-11](../spec.md), стани `empty` і `default · confidential` у [screens.md](../screens.md).

## What

- `test/fixtures/resume.full.yaml` — валідні дані з: 3 фактами, 3 контактами, 3 записами досвіду в перемішаному порядку (один без `end`), групами навичок A / B(порожня) / C, проєктами commercial / pet / confidential (у confidential — впізнавана назва клієнта і URL, яких більше ніде немає), одним результатом з унікальним рядком-маркером.
- `test/fixtures/resume.empty-sections.yaml` — валідні дані з `experience: []`, `projects: []`, усі групи навичок порожні.
- `test/fixtures/resume.invalid-rule.yaml` — валідна схема, але commercial project із `links.code`.
- `test/build.test.js`: хелпер `buildWith(fixturePath)` копіює `src/` у тимчасову теку, підміняє `_data/resume.yaml`, збирає Eleventy з `configPath` кореня у другу тимчасову теку і повертає `index.html` (прибирає обидві теки у `finally`). Наявні тести (реальний `resume.yaml`, `| safe`) лишаються.

## Definition of Done

- [ ] `full`: у HTML немає назви клієнта confidential project, жодного його URL і жодної навички його стеку (пошук по всьому файлу); є галузь і `Confidential`.
- [ ] `full`: `<h3>` записів досвіду йдуть у порядку від найновішого `start`; перший містить `– Present`; є рівно один `<header>`, `<main>`, `<footer>`; кількість `<h2>` = 4; 3 `<li>` у `.fact-list`; 3 елементи `data-contact` у hero і 3 у footer; група B відсутня, A перед C; commercial має `Live` без `Code`, pet — обидва.
- [ ] `full`: унікальний рядок-маркер результату присутній у HTML дослівно (AC-11).
- [ ] `empty-sections`: у HTML лише один `<h2>` (Contacts); рядків `Experience` / `Skills` / `Projects` як заголовків немає.
- [ ] `invalid-rule`: `buildWith` відхиляється з `ResumeValidationError` (або помилкою Eleventy, що її обгортає) і `index.html` у вихідній теці відсутній.
- [ ] Лічильник: із `site.json` з адресою — рівно один `<script async`; тест на «нуль скриптів» без адреси через фікстурний `site.json` у тій самій копії `src/`.
- [ ] `npm test` зелений локально і в CI (Node 20).

## Notes

- Копіювати `src/` (а не підміняти файл на місці), щоб тест не чіпав робочу теку і міг іти паралельно.
- AC-10 і NFR spec §6 тут не автоматизуються — ручна перевірка на deploy preview у `ship`.
