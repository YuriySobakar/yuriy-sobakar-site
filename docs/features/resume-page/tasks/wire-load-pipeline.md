---
id: T3
title: "Зшити конвеєр у load.js: схема → правила → view model, помилки з назвою запису"
layer: "wiring"
deps: ["T1", "T2"]
acs: ["AC-03b", "AC-05", "AC-07", "AC-09", "AC-11"]
files_hint: ["lib/resume/load.js", "test/resume-schema.test.js"]
owner: "Yuriy Sobakar"
estimate: "S"
status: "todo"
---

# T3 — Зшити конвеєр у load.js

## Why

Єдина точка зшивання даних і шаблонів — data extension, що викликає `loadResume` ([sad §5](../sad.md)); порядок «схема, потім правила, потім view model» і формат помилки «всі порушення за один прохід» — [sad §6 Flow 2](../sad.md), [sad §8](../sad.md) «Помилки даних». Атомарність публікації (AC-09) випливає з того, що збірка падає до запису HTML.

## What

- `lib/resume/load.js`: `validateResume` після успішної схеми викликає `checkRules` (T1); непорожній результат → `ResumeValidationError` із рядками `resume.yaml › <рядок правила>`. Далі `loadResume` / `loadResumeFile` повертають `buildViewModel(data)` (T2), а не сирий об'єкт. Схема і правила не змішуються в одному списку: правила припускають валідну форму, тому запускаються лише коли схема пройшла (усі порушення *кожного* етапу — разом).
- `describe()` доповнюється підписом елемента масиву: для `instancePath` виду `/experience/1/...` або `/projects/2` до шляху додається `"<role @ company>"` / `"<name або industry>"` / `"<group>"` / `"<label>"`, якщо відповідне поле є в даних (AC-03b «назву запису та порожнє поле»).
- `eleventy.config.js` не змінюється (уже викликає `loadResume`).
- `test/resume-schema.test.js`: доповнити тестами, що `loadResume` повертає view model (наприклад, `current` у записі без `end`) і що порушення правила з валідною схемою кидає `ResumeValidationError` із підписом запису.

## Definition of Done

- [ ] `npm test` зелений; `loadResumeFile()` повертає об'єкт із відфільтрованим `sections`.
- [ ] `loadResume` на YAML із commercial project + `links.code` кидає `ResumeValidationError`, у `problems` один рядок із назвою проєкту і правилом.
- [ ] Помилка схеми `experience.1: required field "role" is missing` містить підпис запису, коли є `company` (наприклад `experience.1 "@ Acme"`) — формат узгоджено з T1.
- [ ] `npm run build` із навмисно зламаним `resume.yaml` (тимчасово) завершується ненульовим кодом, у `_site/` нового `index.html` немає; після відкату збірка зелена.

## Notes

- Існуючий `build.test.js` читає `resume.name` через `loadResumeFile()` — лишається робочим.
- Hard rule: жодного `try/catch`, що ковтає помилку, у data extension — збірка мусить впасти (карта §Conventions «Помилки збірки»).
