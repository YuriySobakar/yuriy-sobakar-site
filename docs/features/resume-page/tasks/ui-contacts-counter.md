---
id: T9
title: "SCR-06 contacts + лічильник кліків без cookie (adr/0003)"
layer: "ui"
deps: ["T4"]
acs: ["AC-02"]
files_hint: ["src/_includes/sections/contacts.njk", "src/_includes/layout.njk", "src/_data/site.json"]
owner: "Yuriy Sobakar"
estimate: "S"
status: "todo"
---

# T9 — SCR-06 contacts + лічильник кліків

## Why

Дотик до контакту відкриває застосунок з адресою власника і асинхронно шле подію `contact:<type>` у лічильник без cookie — [spec AC-02](../spec.md), [spec §7 KPI](../spec.md), [ADR-0003](../adr/0003-contact-click-counter-cookieless-script.md), [sad §6 Flow 4](../sad.md), [sad §8](../sad.md) «Посилання», «Лічильник кліків». Стани `default`, `tap → external app`, `tap · counter unavailable` і wireframe H — [screens.md SCR-06](../screens.md).

## What

- `src/_includes/sections/contacts.njk`: прибрати `{% if ... length %}` (схема гарантує ≥1); section у `footer` (T4) з `h2` із YAML і `<ul class="contacts">` із `<a class="button" href="{{ contact.url }}" data-contact="{{ contact.type }}">{{ contact.label }}</a>` — без `target`. URL вже готові в YAML (`mailto:`, `https://t.me/…`, LinkedIn).
- `src/_data/site.json`: `{ "counter": { "script": "<url скрипта>", "endpoint": "<url подій>" } }` — службові налаштування, не зміст; порожні рядки = лічильник вимкнено. Eleventy віддає файл як `site`.
- `src/_includes/layout.njk`: перед `</body>` — **рівно один** `<script async src="{{ site.counter.script }}">` і **один** inline-обробник: делегований `click` на `document` для `a[data-contact]`, який викликає API лічильника з подією `contact:<type>` і не перешкоджає переходу (без `preventDefault`, без затримки). Обгорнуто в `{% if site.counter.script %}` — без адреси на сторінці немає жодного `<script>`. Конкретний сервіс (наприклад GoatCounter за ADR) і його API — вибір `implement` за ADR-0003; будь-який cookie або ідентифікатор відвідувача заборонений.

## Definition of Done

- [ ] Зібраний HTML із заданою адресою містить рівно один `<script async` і один inline `<script>` з `data-contact`; з порожнім `site.counter.script` — нуль `<script>` (перевіряє T10 через фікстуру `site.json` або окремий рендер `layout.njk`).
- [ ] Контакти в footer: по одному `<a data-contact>` на тип із даних, жодного `target=`.
- [ ] Ручна перевірка у dev-сервері: клік по Email відкриває поштовий клієнт із адресою; з заблокованим скриптом перехід працює так само (Flow 4 `alt`).
- [ ] `npm run build`, `npm run lint` зелені (`html-validate` пропускає async-скрипт без SRI, бо без `crossorigin` — карта §Stack).

## Notes

- Ділить `layout.njk` з T4 — одна смуга, T4 першим.
- Hard rule (ADR-0003, `CLAUDE.md` правило 6): жодного іншого клієнтського JS; вага скрипта входить у бюджет 150 КБ (перевіряє `ship` на deploy preview).
- Адреси лічильника потребують акаунта у сервісі — якщо його ще немає, `site.json` лишається з порожніми рядками, тест на «нуль скриптів» усе одно зелений, а увімкнення = один рядок у `site.json`.
