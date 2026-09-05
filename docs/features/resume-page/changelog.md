# Changelog — resume-page

## resume-page — адаптивна сторінка резюме, зібрана з `resume.yaml` через publish gate

**What:** Сайт тепер показує одну адаптивну сторінку резюме: hero (ім'я, позиціювання, 1–3 факти, кнопки контактів), досвід від найновішого до найстаршого, навички групами, проєкти картками (commercial / pet / confidential) і контакти у футері. Увесь текст береться з одного файлу `src/_data/resume.yaml`; порожні section і групи не рендеряться; небезпечні дані (порожнє обов'язкове поле, понад три факти, запис досвіду без результату, посилання на код у commercial project, `confidential` на pet project) зупиняють збірку з поясненням, яке поле і в якому записі порушене.

**Why:** Старий сайт не читався з телефона, не оновлювався понад рік і кожна правка означала правку верстки ([spec](./spec.md) §1–§2). Ключові рішення: publish gate під час збірки як JSON Schema для форми даних плюс модуль правил для перехресних інваріантів — [ADR-0001](./adr/0001-publish-gate-schema-plus-rules-module.md); шаблони отримують лише санітизований view model, тому назва confidential-клієнта не може потрапити навіть у вихідний код сторінки — [ADR-0002](./adr/0002-templates-render-sanitized-view-model.md); лічильник кліків по контактах — легкий сторонній сервіс без cookie, єдиний дозволений клієнтський скрипт — [ADR-0003](./adr/0003-contact-click-counter-cookieless-script.md).

**How to use:**
- Змінити зміст: правка `src/_data/resume.yaml` (контракт полів — `src/_data/resume.schema.json`), потім `npm run build`. Нове поле спершу додається до схеми.
- Приховати клієнта під NDA: `confidential: true` на проєкті з `kind: commercial` — на сторінці лишаться лише галузь, роль і результат.
- Помилка даних виглядає так і зупиняє збірку (локально і на Netlify):

  ```
  resume data is invalid — the build was stopped:
    src/_data/resume.yaml › projects.0 "Acme Storefront": the code of a commercial project is not published — remove links.code
  ```

**Operational notes:**
- Migration: немає (статичний сайт, без бази даних).
- Feature flag / config: лічильник кліків вимкнений — у `src/_data/site.json` поля `counter.script` і `counter.endpoint` порожні, на сторінці немає жодного `<script>`. Увімкнути після створення акаунта GoatCounter (адреси в коментарі того ж файлу). Вага лічильника входить у бюджет 150 КБ (spec §6).
- Deploy: Netlify збирає `npm run build` і публікує `_site`; невдала збірка залишає попередній деплой живим (spec AC-09), тому зламаний `resume.yaml` ніколи не дає порожньої сторінки.
- Rollback: revert коміту злиття на `main` — Netlify перезбирає попередню версію; жодних міграцій чи стану поза репозиторієм.
- Зміст поки placeholder (один нейтральний факт, контакт `hello@example.com`) — реальне наповнення є кроком 2 роадмапу, не цією фічею.

**Acceptance criteria delivered:** AC-01 (hero above the fold на 360×640), AC-02 (контакти як `mailto:` / `t.me` / LinkedIn-посилання), AC-03 (досвід newest-first, відкритий період як «Present»), AC-03b (запис досвіду без обов'язкового поля блокує публікацію з назвою запису), AC-04 (групи навичок у порядку даних, без рівнів і шкал), AC-05 (код commercial project блокує публікацію з назвою проєкту), AC-06 (confidential project без назви й посилань у всьому HTML), AC-07 (порожнє обов'язкове поле або понад три факти блокують публікацію з назвою поля), AC-08 (порожня section чи група не показується), AC-09 (невдала публікація не змінює попередню сторінку), AC-10 (360/768/1280 без горизонтальної прокрутки; текст 16 px, допоміжний 14 px), AC-11 (правка лише `resume.yaml` з'являється на сторінці дослівно).

Відкладено до deploy preview на Netlify: PageSpeed Insights mobile ≥ 95 і Lighthouse Accessibility ≥ 95 (spec §6) — потребують публічної адреси; локально сторінка з повними тестовими даними важить близько 3 КБ стиснутих байтів проти бюджету 150 КБ.
