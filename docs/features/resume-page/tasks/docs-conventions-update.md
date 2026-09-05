---
id: T11
title: "Оновити конвенції: CLAUDE.md і architecture-map під rules / view-model / site.json / fact-list"
layer: "docs"
deps: ["T10"]
acs: ["AC-11"]
files_hint: ["CLAUDE.md", "docs/architecture-map.md"]
owner: "Yuriy Sobakar"
estimate: "S"
status: "todo"
---

# T11 — Оновити конвенції

## Why

Наступні фічі (друк — крок 5, «як зроблено» — крок 6) читають `CLAUDE.md` і карту архітектури; після цієї фічі там мають бути конвеєр даних і нові файли, інакше site owner знову правитиме шаблони замість `resume.yaml` — [spec US-04, AC-11](../spec.md), [sad §11](../sad.md) рядок про оновлення карти, [sad §5](../sad.md) як джерело переліку файлів.

## What

- `CLAUDE.md` §Stack / §Rules: конвеєр `resume.yaml → schema → rules.js → view-model.js → templates`; нове правило «перехресний інваріант = функція в `lib/resume/rules.js` + тест у `test/resume-rules.test.js`; форма поля = схема»; «шаблони не приховують і не сортують — це view model»; `src/_data/site.json` — службові налаштування (лічильник), не зміст; `fact-list` у переліку примітивів `base.css`; уточнити правило 6 (лічильник увімкнено).
- `docs/architecture-map.md`: §Module inventory — рядки для `lib/resume/rules.js`, `code-hosts.js`, `view-model.js`, `src/_data/site.json`, `test/resume-rules.test.js`, `test/view-model.test.js`, `test/fixtures/`; §Frontend — `fact-list` у shared primitives; `reflects_commit` — коміт T10. Без переписування C4 (це робота `survey`).

## Definition of Done

- [ ] `CLAUDE.md` і `docs/architecture-map.md` згадують кожен новий файл із `files_hint` задач T1–T10 рівно один раз, з одним рядком призначення.
- [ ] Жоден абзац не дублює текст spec / sad — лише посилання на `docs/features/resume-page/`.
- [ ] `npm test` зелений (документація не чіпає код).

## Notes

- Реєстрація `fact-list` у `docs/design-system.md` — після `/sdd:design-system`, не тут (`screens.md` §New components).
