---
status: draft
feature_size: "S"
tool: "code"
updated_at: "2026-09-05"
---

# Screens — resume-page

> The canonical **screen manifest** — every screen in every state — produced by `screens` (between
> `api` and `tasks`) and read by `tasks` (each `ui` task cites SCR ids + states), `implement`
> (builds the screen to the declared states) and `review` (the built screen must match this).
> Downstream stages reference **only this manifest** — never the raw Figma / `.pen` file.

## Source

- **Tool:** code — `docs/design-system.md` **відсутній**, тож канону дизайну (інструмент, постура, інвентар) немає; стадія працює в режимі `code` за дефолтом, а не через недоступний MCP. Рекомендація: `/sdd:design-system` перед наступною UI-фічею (крок 5 роадмапу — друк) — тоді цей маніфест можна перемалювати в обраному інструменті без зміни таблиць станів.
- **File:** inline wireframes below (ASCII, один на кожен стан з окремою розкладкою).
- **Інвентар компонентів (замінник канону):** карта архітектури §Frontend / UI foundation «Shared primitives» + `sad.md` §5 (`src/styles/base.css`): `section` (блок із заголовком `h2`), `tag` (чип навички), `card` (картка проєкту), `timeline-item` (запис досвіду), `button` (кнопка або посилання-кнопка). Усі назви компонентів нижче — з цього списку або з §New components.

**Noted gaps (за протоколом стадії, нічого не вигадано мовчки):**

- `ux-flows.md` для фічі відсутній (`sad.md` §6 це вже фіксує). Інвентар SCR виведено зі spec §4 (US-01…US-07), `sad.md` §5 (один партіал на section) і §6 Flow 3–4 (одна сторінка без переходів). Правило нумерації: **одна прокручувана сторінка = SCR-01 (каркас) + одна SCR на кожну section**, бо кожна section — окремий партіал і окрема `ui`-задача у `tasks`; між SCR немає навігації, це регіони однієї сторінки.
- `contracts/` відсутній (`api` пропущено: зовнішнього інтерфейсу немає) → станів з контрактних помилок немає. Усі стани нижче виведені лише зі spec §5 (AC-01…AC-11) і `sad.md` §6 (гілки `alt`/`else`/`opt` Flow 1–4).
- Помилка публікації (AC-03b, AC-05, AC-07, AC-09) — **не екран цієї поверхні**: publish gate зупиняє збірку до рендеру, пояснення виводиться у stderr збірки / перевірці PR у форматі `sad.md` §8 (`resume.yaml › <шлях до поля>: <правило словами>`). У таблицях це рядок `error — N/A` з посиланням на джерело, а не вигаданий екранний стан.

**Рішення без запиту (`interview_depth: easy`, сесія автономна) — ledger:**

1. Контакти показані двічі: у hero (AC-01 — до прокрутки) і в окремій section внизу (`sad.md` §5 `contacts.njk`); обидва місця — той самий компонент `button` (варіант посилання) з `data-contact`. Чи це один партіал, підключений двічі, вирішує `implement`.
2. Факти на hero — `NEW: fact-list` (обґрунтування в §New components), а не `tag`: факт до 60 знаків у чипі не читається на 360 px.
3. Розкладка на 768/1280: одна колонка тексту з обмеженою шириною; лише групи навичок і картки проєктів стають сіткою у 2 колонки від 768 px. Фінальна візуальна концепція — fog роадмапу; тут лише базові токени.
4. Позначка «Confidential project» на картці — службовий підпис шаблону (spec §3 дозволяє), рендериться компонентом `tag`.
5. Мова підписів інтерфейсу — англійська (`sad.md` §8 «Дати»: `Present`); spec AC-03 каже «дотепер» українською як опис поведінки, не як текст на сторінці.

## Screens

### SCR-01 — Page shell (layout.njk: каркас, порядок section, адаптив)

Джерела: AC-10, AC-09, AC-11; `sad.md` §4 п. 5, §5 (`layout.njk`, `layout.css` брейкпоінти 360 / 768 / 1280), §6 Flow 3, §8 «Доступність», §10 QG-4.

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default @360 | recruiter відкриває сторінку на 360 px (AC-10, Flow 3 крок 6–7): одна колонка, без горизонтальної прокрутки й масштабування; landmarks `header` (hero) / `main` (section) / `footer` (contacts); `h1` = ім'я, `h2` = заголовки section; порядок section — з view model; основний текст 16 px, допоміжний 14 px | `section` × N (по одній на кожну section із view model) | wireframe A below |
| default @768 | той самий HTML, брейкпоінт 768 (QG-4): контейнер з обмеженою шириною і більшими відступами; секції лишаються однією колонкою, лише SCR-04 і SCR-05 переходять у сітку 2 колонки | `section` | wireframe B below (текстова примітка) |
| default @1280 | брейкпоінт 1280 (QG-4): центрований контейнер, поля з боків; жодного нового змісту — той самий порядок і ті самі section | `section` | wireframe B below |
| default · previous version | остання публікація відхилена (AC-09, Flow 3 `alt` «остання публікація була відхилена»): хостинг віддає попередню повну версію. Візуально **невідрізненна** від `default` — жодних банерів «застаріло»; це не окрема розкладка, рядок є для трасування AC-09 | — (ті самі) | = wireframe A |
| default · updated | публікація успішна (AC-11, Flow 1 `else`): новий текст з resume data дослівно; та сама розкладка | — (ті самі) | = wireframe A |
| loading | N/A: статичний HTML без клієнтського завантаження даних (`sad.md` §4 SSG, нуль JS окрім лічильника); скелетів і спінерів нема | — | — |
| empty | N/A: сторінка не може бути порожньою — ім'я, позиціювання, ≥1 факт, ≥1 контакт обов'язкові за схемою (AC-07), а порожні section прибирає view model (AC-08 → рядки `empty` у SCR-03…SCR-05) | — | — |
| error | N/A на сторінці: будь-яке порушення зупиняє збірку до рендеру (Flow 1/2 `alt`), відвідувач бачить `default · previous version`; пояснення власнику — stderr збірки / перевірка PR, формат `sad.md` §8 «Помилки даних» | — | — |
| validation | N/A: форм на сторінці немає (spec §3: без контактної форми) | — | — |
| print | поза фічею: друковане подання — крок 5 роадмапу (`print.css`); ця розкладка лише не ховає зміст за взаємодією (spec §3) | — | — |

```text
Wireframe A — SCR-01 default @360 (уся сторінка, прокрутка вниз)
+------------------------------------------+  <- 360 px, одна колонка
| <header>                                 |
|   SCR-02 Hero                            |
|   (h1 ім'я, позиціювання, факти,         |
|    контакти — усе до лінії згортки 640)  |
| - - - - - - - - fold @640 - - - - - - -  |
| <main>                                   |
|   SCR-03 <section> h2 Experience         |
|     timeline-item ...                    |
|   SCR-04 <section> h2 Skills             |
|     група -> tag tag tag                 |
|   SCR-05 <section> h2 Projects           |
|     card / card / card                   |
|   (порядок і заголовки — з view model;   |
|    порожня section тут ВІДСУТНЯ в HTML)  |
| <footer>                                 |
|   SCR-06 <section> h2 Contacts           |
|     [Email] [Telegram] [LinkedIn]        |
+------------------------------------------+
Текст 16 px; періоди/підписи 14 px; горизонтальної прокрутки немає.
```

```text
Wireframe B — SCR-01 default @1280 (і @768 — той самий принцип, вужчі поля)
+--------------------------------------------------------------+
|        |  <header> SCR-02 Hero                     |          |
|        |  h1 ім'я · позиціювання · факти · контакти|          |
|  поле  |-------------------------------------------|   поле   |
|        |  <main>                                   |          |
|        |  SCR-03 Experience  (одна колонка)        |          |
|        |  SCR-04 Skills      [група] [група]  <- 2 колонки    |
|        |  SCR-05 Projects    [card ] [card ]  <- 2 колонки    |
|        |  <footer> SCR-06 Contacts                 |          |
+--------------------------------------------------------------+
Контейнер з max-width (токен у tokens.css), центрований; @768 поля вужчі.
```

### SCR-02 — Hero (hero.njk: ім'я, позиціювання, факти, контакти)

Джерела: AC-01, AC-02, AC-07; `sad.md` §5 (`hero.njk`), §6 Flow 3 крок 5, §8 «Доступність», §11 відкриті питання (телефон, фото).

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | resume data містить ім'я, позиціювання, 1–3 факти, ≥1 контакт (AC-01 Given). На 360×640 CSS-px **до будь-якої прокрутки** видно все: `h1` ім'я, позиціювання (≤120 знаків, одне речення), усі факти (1–3, кожен ≤60 знаків), контактні посилання. Кількість фактів 1/2/3 і набір контактів (лише наявні типи) змінюють висоту, а не розкладку | `section` (варіант hero без `h2`), `NEW: fact-list`, `button` (варіант посилання, по одній на контакт, з атрибутом data-contact типу контакту і текстовим підписом або aria-label) | wireframe C below |
| default · tap contact | recruiter торкається контакту в hero — поведінка ідентична SCR-06 `tap` (AC-02, Flow 4); тут не дублюється | `button` | → SCR-06 |
| loading | N/A: статичний HTML | — | — |
| empty | N/A: ім'я, позиціювання, ≥1 факт, ≥1 контакт — обов'язкові поля схеми (AC-07); hero без них не рендериться, бо збірка зупинена | — | — |
| error | N/A на сторінці: >3 фактів або 0 фактів, порожнє ім'я/позиціювання, 0 контактів → publish gate (AC-07, Flow 2 `alt`), пояснення у stderr / PR | — | — |
| validation | N/A: форм немає | — | — |
| photo | не стан, а відкрите питання `sad.md` §11 (дефолт — без фото, до `sdd:tasks`); у схемі v1 поля немає — wireframe C фото не має | — | — |

```text
Wireframe C — SCR-02 Hero default @360x640 (перший екран, без прокрутки)
+------------------------------------------+  y=0
| <header class="section section--hero">   |
|                                          |
|  # Yuriy Sobakar                 (h1)    |  ім'я
|  Full-Stack WordPress Developer |        |  позиціювання, ≤120 знаків
|  Tech SEO Specialist                     |
|                                          |
|  fact-list:                              |
|   • <факт 1, ≤60 знаків>                 |  1–3 пункти
|   • <факт 2>                             |
|   • <факт 3>                             |
|                                          |
|  [ Email ] [ Telegram ] [ LinkedIn ]     |  button(link) × наявні типи,
|                                          |  data-contact="email|telegram|linkedin"
+------------------------------------------+  y≈640 — усе вище fold (AC-01)
| <main> ...                               |
Телефон і фото відсутні (дефолти відкритих питань sad §11).
```

### SCR-03 — Experience (experience.njk: записи досвіду)

Джерела: AC-03, AC-03b, AC-08; `sad.md` §5 (`experience.njk`), §6 Flow 2 `else` (сортування, `Present`) і Flow 3 нотатка, §8 «Дати».

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | ≥1 запис досвіду (AC-03): `h2` із resume data; записи **від найновішого до найстаршого за датою початку** (сортує view model, шаблон лише виводить); кожен запис — роль, компанія, період `YYYY-MM – YYYY-MM`, ≥1 результат списком | `section`, `timeline-item` × N | wireframe D below |
| default · current role | запис без `end` (AC-03 «дотепер», `sad.md` §8): період підписано `<start> – Present`; підпис — службовий текст шаблону, не resume data. Та сама розкладка, лише текст періоду | `timeline-item` | wireframe D, перший запис |
| empty | у resume data немає жодного запису досвіду (AC-08): section **відсутня в HTML взагалі** — ні `h2`, ні контейнера; не `display:none`, а відсутність у view model. Решта section без змін | — (нічого не рендериться) | wireframe E below |
| error | N/A на сторінці: запис без ролі / компанії / дати початку / результату → publish gate (AC-03b, Flow 2 `alt` «запис досвіду повний»), пояснення з назвою запису у stderr / PR | — | — |
| loading | N/A: статичний HTML | — | — |
| validation | N/A: форм немає | — | — |

```text
Wireframe D — SCR-03 Experience default @360 (з поточною роллю зверху)
+------------------------------------------+
| <section>                                |
|  ## Experience                    (h2, з resume data)
|                                          |
|  timeline-item                           |
|   Role title                    (16 px)  |
|   Company                                |
|   2025-03 – Present             (14 px)  |  <- default · current role
|   • result 1                             |
|   • result 2                             |
|                                          |
|  timeline-item                           |
|   Role title                             |
|   Company                                |
|   2023-01 – 2025-02             (14 px)  |
|   • result 1                             |
|                                          |
|  (далі — старші записи, start спадно)    |
+------------------------------------------+
```

```text
Wireframe E — SCR-03/04/05 empty (спільний для всіх section)
HTML до:                          HTML після (empty):
<main>                            <main>
  <section id="experience">…        <section id="skills">…
  <section id="skills">…            <section id="projects">…
  <section id="projects">…        </main>
</main>
Порожня section відсутня у розмітці (view model), заголовок теж; сусіди без змін.
```

### SCR-04 — Skills (skills.njk: групи навичок)

Джерела: AC-04, AC-08; `sad.md` §5 (`skills.njk`), §6 Flow 2 `else` (порядок груп) і Flow 3 нотатка («навички групами без шкал»), §8 «Порожні section і групи».

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default @360 | ≥1 група з ≥1 навичкою (AC-04): `h2` із resume data; групи **у порядку resume data**, кожна — підзаголовок `h3` + навички як чипи; **без рівнів, відсотків, шкал**. Група = `h3` + список `tag`, окремого примітива не потребує | `section`, `tag` × N | wireframe F below |
| default @768+ | той самий HTML: групи стають сіткою у 2 колонки (ledger п. 3); порядок читання зліва-направо, зверху-вниз зберігає порядок resume data | `section`, `tag` | wireframe B (SCR-01) |
| empty · group | група без жодної навички (AC-08): група **відсутня** (ні `h3`, ні списку); решта груп без змін | — | wireframe F, примітка |
| empty · section | жодної групи, або всі групи порожні (AC-08): section відсутня в HTML взагалі | — | wireframe E (SCR-03) |
| error | N/A на сторінці: порожні групи — не порушення, а прибирання (AC-08); схема не має обов'язкових полів навичок, які б зупинили збірку | — | — |
| loading | N/A: статичний HTML | — | — |
| validation | N/A: форм немає | — | — |

```text
Wireframe F — SCR-04 Skills default @360
+------------------------------------------+
| <section>                                |
|  ## Skills                        (h2)   |
|                                          |
|  ### Backend                      (h3)   |  група 1 (порядок з YAML)
|  [PHP] [WordPress] [MySQL] [REST API]    |  tag × N, без шкал
|                                          |
|  ### Frontend                     (h3)   |  група 2
|  [HTML] [CSS] [JavaScript]               |
|                                          |
|  ### Tech SEO                     (h3)   |  група 3
|  [Core Web Vitals] [Schema.org]          |
+------------------------------------------+
empty · group: група з 0 навичок між ними просто відсутня — сусіди щільно поруч.
@768+: [група 1] [група 2] у два стовпці, [група 3] нижче ліворуч.
```

### SCR-05 — Projects (projects.njk: картки проєктів)

Джерела: AC-05, AC-06, AC-07 (галузь commercial project), AC-08; `sad.md` §5 (`projects.njk`, `view-model.js`), §6 Flow 2 `else` (стрип confidential) і Flow 3 `opt` (view-source), §8 «Confidential project», «Заборона коду commercial project», «Посилання».

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default · commercial | commercial project без позначки confidential (CONTEXT.md): картка з назвою, галуззю, живим посиланням, стеком (чипи), роллю, результатом; **посилання на код відсутнє за правилом** — його не може бути у view model (AC-05 блокує збірку). Зовнішнє посилання: `target="_blank" rel="noopener noreferrer"`; підпис кнопки «Live» — службовий текст шаблону | `card`, `tag` × N (стек), `button` (варіант посилання «Live») | wireframe G, картка 1 |
| default · pet | pet project (CONTEXT.md): картка з назвою, живим посиланням **і посиланням на код** (дві кнопки «Live» / «Code»); решта полів (стек, роль, результат) — як у commercial, якщо є в resume data | `card`, `tag`, `button` × 2 | wireframe G, картка 2 |
| default · confidential | commercial project з позначкою confidential (AC-06): картка показує **лише галузь, роль, результат**; назви клієнта, будь-яких посилань і стеку немає — і на екрані, і у вихідному HTML (Flow 3 `opt`), бо їх зрізав view model. Заголовок картки = галузь; чип «Confidential» — службовий підпис шаблону (ledger п. 4) | `card`, `tag` × 1 («Confidential») | wireframe G, картка 3 |
| default @768+ | картки у сітці 2 колонки (ledger п. 3); порядок — resume data | `card` | wireframe B (SCR-01) |
| empty | жодного проєкту (AC-08): section відсутня в HTML взагалі | — | wireframe E (SCR-03) |
| error | N/A на сторінці: commercial project без галузі (AC-07) або з посиланням на code-хост (AC-05) → publish gate (Flow 2 `alt`), пояснення з назвою проєкту у stderr / PR; список code-хостів — `sad.md` §8 | — | — |
| loading | N/A: статичний HTML | — | — |
| validation | N/A: форм немає | — | — |

```text
Wireframe G — SCR-05 Projects: три варіанти картки @360 (стек вертикально)
+------------------------------------------+
| <section>                                |
|  ## Projects                      (h2)   |
|                                          |
|  card — default · commercial             |
|  +------------------------------------+  |
|  | Project name                       |  |  назва
|  | Industry: Healthcare       (14 px) |  |  галузь (обов'язкова)
|  | [WordPress] [PHP] [Tailwind]       |  |  стек — tag
|  | Role: Full-stack developer         |  |  роль
|  | Result: <one-line outcome>         |  |  результат
|  | [ Live ↗ ]                         |  |  button(link), _blank; «Code» НЕМАЄ
|  +------------------------------------+  |
|                                          |
|  card — default · pet                    |
|  +------------------------------------+  |
|  | Project name                       |  |
|  | [Node] [Eleventy]                  |  |
|  | Result: <one-line outcome>         |  |
|  | [ Live ↗ ]  [ Code ↗ ]             |  |  дві button(link)
|  +------------------------------------+  |
|                                          |
|  card — default · confidential           |
|  +------------------------------------+  |
|  | Healthcare        [Confidential]   |  |  заголовок = галузь; tag-підпис
|  | Role: WordPress developer          |  |  роль
|  | Result: <one-line outcome>         |  |  результат
|  |  (без назви, посилань, стеку —     |  |
|  |   їх немає і у view-source)        |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### SCR-06 — Contacts (contacts.njk: контакти з лічильником кліків)

Джерела: AC-02, AC-07; `sad.md` §5 (`contacts.njk`, `layout.njk` обробник), §6 Flow 4 (happy + `alt` «лічильник недоступний»), §8 «Посилання», «Лічильник кліків», «Доступність»; `adr/0003`.

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | ≥1 контакт у resume data (AC-07 гарантує): `h2` із resume data; по одному посиланню-кнопці на **наявний** тип: `mailto:<email>`, `https://t.me/<user>`, повний URL LinkedIn; **без нової вкладки** (`sad.md` §8); кожне має текстовий підпис або `aria-label` і `data-contact=<type>`. Телефон за дефолтом не рендериться (spec §8, `sad.md` §11); схема допускає тип `phone`, рендер від рішення не залежить | `section`, `button` (варіант посилання) × наявні типи | wireframe H below |
| tap → external app | recruiter торкається контакту (AC-02, Flow 4 крок 1–4): у тій самій вкладці відкривається застосунок або сторінка з адресою власника вже підставленою; сторінка **не змінює вигляду** (жодних тостів «скопійовано» — копіювати нічого не треба); асинхронно летить подія `contact:<type>` у лічильник | `button` | wireframe H, примітка |
| tap · counter unavailable | лічильник недоступний або скрипт заблоковано (Flow 4 `alt`): подія втрачена, перехід за контактом працює як у `tap`. **Видимого стану немає** — N/A як окремий екран; рядок трасує гілку `alt` | `button` | — |
| loading | N/A: статичний HTML; тег лічильника асинхронний і рендер не блокує (`adr/0003`) | — | — |
| empty | N/A: «жоден контакт не заповнено» → publish gate (AC-07); section з 0 контактів неможлива | — | — |
| error | N/A на сторінці: помилки лічильника мовчазні (Flow 4 `alt`), помилки даних — publish gate | — | — |
| validation | N/A: форм немає | — | — |

```text
Wireframe H — SCR-06 Contacts default @360 (footer)
+------------------------------------------+
| <footer>                                 |
|  <section>                               |
|  ## Contacts                      (h2)   |
|                                          |
|  [ ✉ Email    ]  <- <a href="mailto:…" data-contact="email">
|  [ ✈ Telegram ]  <- <a href="https://t.me/…" data-contact="telegram">
|  [ in LinkedIn ] <- <a href="https://linkedin.com/in/…" data-contact="linkedin">
|                                          |
|  (той самий button(link), що й у hero;   |
|   іконка — з текстовим підписом;         |
|   без target=_blank; телефону немає)     |
+------------------------------------------+
tap: перехід у застосунок у тій самій вкладці + async подія contact:<type>;
     сторінка візуально не змінюється; лічильник недоступний → лише перехід.
```

## New components

| Component | Why no existing primitive fits | Registered in design-system |
|---|---|---|
| `fact-list` | 1–3 факти до 60 знаків на hero (AC-01, CONTEXT.md «факт»). `tag` призначений для коротких лейблів навичок — 60-знаковий факт у чипі ламається на 360 px і плутається з навичками; `card` надто важка для одного речення і зʼїдає висоту до fold; `timeline-item` несе семантику періоду. Потрібен легкий вертикальний список тверджень із токенами типографіки 16 px | pending — `docs/design-system.md` відсутній; `implement` реєструє після `/sdd:design-system` |
