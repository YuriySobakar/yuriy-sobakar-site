---
id: T2
title: "View model: сортування досвіду, стрип confidential project, прибирання порожніх section і груп"
layer: "domain"
deps: []
acs: ["AC-03", "AC-04", "AC-06", "AC-08"]
files_hint: ["lib/resume/view-model.js", "test/view-model.test.js"]
owner: "Yuriy Sobakar"
estimate: "M"
status: "todo"
---

# T2 — View model: безпечне подання даних

## Why

Шаблони отримують уже підготовану модель, у якій секрет фізично відсутній — [ADR-0002](../adr/0002-templates-render-sanitized-view-model.md); правила подання — [sad §8](../sad.md) «Confidential project», «Порожні section і групи», «Дати»; поведінка — [spec AC-03, AC-04, AC-06, AC-08](../spec.md).

## What

`lib/resume/view-model.js` — чиста функція `buildViewModel(data) → viewModel` над валідним об'єктом (не мутує вхід):

- **experience:** копія, відсортована за `start` спадно (рядки `YYYY-MM` порівнюються лексикографічно); запис без `end` отримує `current: true`. Підпис «Present» — справа шаблону (T6).
- **skills:** групи у вихідному порядку; група з порожнім `items` прибирається.
- **projects:** вихідний порядок; для `confidential: true` видаляються ключі `name`, `links`, `stack` (лишаються `kind`, `industry`, `role`, `result`, `confidential`); для `kind: commercial` без позначки додатково видаляється `links.code`, якби він був (другий бар'єр після T1).
- **sections:** масив `data.sections` фільтрується: `experience` / `skills` / `projects` / `contacts` лишаються лише коли відповідний масив після обробки не порожній (section, у якій усі групи порожні, теж прибирається). Заголовки і порядок — з YAML.
- Решта полів (`name`, `headline`, `facts`, `contacts`) копіюються без змін.

`test/view-model.test.js` — юніт-тести на кожен пункт із мінімальними літералами (без читання `resume.yaml`).

## Definition of Done

- [ ] Сортування: три записи з датами `2023-01`, `2025-03`, `2019-06` виходять у порядку `2025-03`, `2023-01`, `2019-06`; запис без `end` має `current: true`, з `end` — `current` відсутній або `false`.
- [ ] Confidential: `Object.keys(project)` не містить `name`, `links`, `stack`; `industry`, `role`, `result` збережені; сусідні проєкти незмінні.
- [ ] Порядок: `skills` і `projects` виходять у тому ж порядку, що на вході; порожня група відсутня.
- [ ] Sections: при `experience: []` у `sections` нема `id: experience`; при всіх порожніх групах нема `skills`; решта section — на місці і в порядку YAML.
- [ ] Вхідний об'єкт після виклику глибоко дорівнює своїй копії до виклику (немає мутації).

## Notes

- Не імпортує нічого з `load.js` — зшивка в T3; шаблони ще не переходять на нову модель до T4–T9.
- Hard rule (ADR-0002): будь-яке нове обчислене поле для шаблону додається сюди, а не умовою в `.njk`.
