---
id: T1
title: "Publish gate: модуль правил rules.js + список code-хостів + схема (1–3 факти обов'язкові)"
layer: "domain"
deps: []
acs: ["AC-03b", "AC-05", "AC-07"]
files_hint: ["lib/resume/rules.js", "lib/resume/code-hosts.js", "src/_data/resume.schema.json", "src/_data/resume.yaml", "test/resume-rules.test.js"]
owner: "Yuriy Sobakar"
estimate: "M"
status: "todo"
---

# T1 — Publish gate: rules.js + code-хости + схема фактів

## Why

Перехресні інваріанти, які схема виражає погано, живуть у коді з людськими повідомленнями — [ADR-0001](../adr/0001-publish-gate-schema-plus-rules-module.md); список code-хостів і формат помилки — [sad §8](../sad.md) «Помилки даних», «Заборона коду commercial project». Форма (1–3 факти) залишається у схемі — [spec AC-07](../spec.md), [sad §5](../sad.md).

## What

- `lib/resume/code-hosts.js` — експортує список доменів code-хостингу з sad §8 (`github.com`, `gitlab.com`, `bitbucket.org`, `codeberg.org`, `git.sr.ht`, `gitee.com`, `dev.azure.com`) і список винятків-сторінок (`*.github.io`, `*.gitlab.io`, `*.pages.dev`), плюс функцію `isCodeHost(url)`: збіг домену або його піддомену, виняток — не збіг.
- `lib/resume/rules.js` — чиста функція `checkRules(data) → string[]` над уже валідним за схемою об'єктом; кожне порушення — рядок `<шлях> "<підпис запису>": <правило словами>` (без префікса `resume.yaml ›` — його додає `load.js`). Правила:
  1. `experience[i]` без `results` або з порожнім масивом → «запис досвіду без результату» (AC-03b);
  2. `projects[i]` з `kind: commercial` без `industry` → «commercial project без галузі» (AC-07);
  3. `projects[i]` з `kind: commercial` і заповненим `links.code` → «код commercial project не публікується» (AC-05);
  4. `projects[i]` з `kind: commercial`, будь-яке посилання якого проходить `isCodeHost` → те саме правило + домен у тексті (AC-05).
  Підпис запису: `role @ company` для досвіду, `name` (або `industry`, якщо назви немає) для проєкту.
- `src/_data/resume.schema.json` — `facts` стає `required`, `minItems: 1` (уже є `maxItems: 3`). Оновити `resume.yaml`: один факт замість `facts: []`, щоб скелет лишався валідним.
- `test/resume-rules.test.js` — по тесту на кожне правило (позитив + негатив), на піддомен code-хосту, на кожен виняток; тести схеми на 0 і 4 факти.

## Definition of Done

- [ ] `test/resume-rules.test.js` зелений: кожне з чотирьох правил дає рівно один рядок із підписом запису і правилом словами; валідні дані дають `[]`.
- [ ] `isCodeHost` спрацьовує на `github.com` і `gist.github.com`, не спрацьовує на `client.github.io`, `x.pages.dev`, `example.com`.
- [ ] Схема відхиляє `facts: []` і масив із 4 фактів (`must have at least 1 item(s)` / `at most 3`); `npm test` зелений на чинному `resume.yaml`.
- [ ] `npm run build` зелений (схема + YAML змінені разом).

## Notes

- Не чіпає `load.js` — зшивка в T3. `rules.js` не імпортує Ajv і нічого не читає з диска.
- Мова тексту правил: як у наявному `describe()` в `load.js` (англійська, зміст сайту англійською); приклад у sad §8 ілюстративний. Формат шляху — як у `describe()`: `projects.2`, або `projects[2]` — обрати один і використати в обох місцях (T3 вирівнює).
- Hard rule: role / company / start досвіду лишаються у схемі (`required`), не дублювати їх у правилах.
