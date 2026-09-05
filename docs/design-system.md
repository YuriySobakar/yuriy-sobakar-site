---
status: living
tool: code
posture: mobile-first
updated_at: "2026-09-05"
---

# Design system — yuriy-sobakar-site

> Канон дизайну (roadmap крок 3, рішення власника 2026-09-05: «як старий сайт 2024 року, але краще»).
> Інструмент — код: єдине джерело токенів `src/styles/tokens.css`, примітиви в `src/styles/base.css`,
> розкладка в `src/styles/layout.css`, друк лише в `src/styles/print.css`. Макетів у Figma/Pencil немає.

## Posture

Mobile-first, одна колонка від 360 px; від 768 px — білий «аркуш» із тінню на сірій сторінці (рамка старого сайту),
дві колонки для навичок і карток проєктів; від 1280 px — лише більші поля. Жоден зміст не прихований за
взаємодією; друк і PDF — те саме подання через `print.css` (ADR 0004).

## Tokens (`tokens.css`)

| Група | Токени | Джерело / правило |
|---|---|---|
| Кольори | `--color-page #e5e5e5`, `--color-bg #fff`, `--color-band #e0ebfe`, `--color-text #1a1919`, `--color-text-muted #474747`, `--color-accent #005fff` (лише крапки таймлайну), `--color-accent-strong #1f4fb3`, `--color-accent-soft #6d9bf5`, кнопки пастельні `--color-button #cfdffa` / `--color-button-hover #b9cff5` з текстом accent-strong | палітра сайту 2024; текст лише кольорами з контрастом ≥ 4.5:1 (`accent-strong` для тексту, `accent-soft` тільки декор) |
| Шрифт | `--font-sans` Montserrat (self-hosted variable, latin, 37 КБ) + системний fallback; ваги 400/500/700 | `src/assets/fonts/montserrat-latin.woff2`, `@font-face` у `base.css`, `font-display: swap` |
| Розміри тексту | `--text-base 16px`, `--text-small 14px`, `--text-lg`, `--text-xl`, `--text-2xl` | spec resume-page §6: основний ≥ 16, допоміжний ≥ 14 |
| Відступи | `--space-1 … --space-12` | єдина шкала; `print.css` перевизначає значення для паперу |
| Форма | `--radius-sm/md/pill`, `--line-width`, `--dot-size`, `--shadow-sheet`, `--transition 0.3s ease` (усі hover/focus) | |
| Розкладка | `--page-max-width 52rem`, `--photo-size`, `--icon-size` | |

## Component inventory (`base.css`)

| Примітив | Клас | Де використовується |
|---|---|---|
| Section + заголовок з акцентною рискою | `.section`, `.section__title` | усі секції |
| Hero-смуга з портретом | `.hero`, `.hero__top`, `.hero__photo`, `.hero__intro`, `.hero__headline`, `.hero__contacts` | `sections/hero.njk` |
| fact-list (1–3 факти) | `.fact-list` | hero (зареєстровано з resume-page T5) |
| Timeline (рейка + крапка) | `.timeline`, `.timeline-item`, `__role`, `__company`, `__meta`, `__results`, `__stack` | досвід, освіта |
| Tag chip | `.tag`, `.tags` | навички, стек |
| Card | `.card`, `__title`, `__meta`, `__role`, `__result`, `__links`, `__stack` | проєкти |
| Button (pastel / ghost) | `.button`, `.button--ghost` | контакти, Live/Code, Print |
| Icon | `.icon` + партіали `src/_includes/icons/<type>.njk` | один файл на кожне значення `contact.type` зі схеми + `print` |
| Contact button | `src/_includes/contact-button.njk` | hero і footer |

## Rules

1. Нові кольори/розміри — лише як токен у `tokens.css`; текст тільки кольорами з перевіреним контрастом.
2. Новий примітив — клас у `base.css` + рядок у таблиці вище; новий тип контакту — іконка в `icons/`.
3. Друковане — лише в `print.css`; кнопки/іконки на папері ховаються (`.no-print`, `.icon`).
4. Без клієнтського JS, окрім `window.print()` і лічильника кліків (ADR 0003).
