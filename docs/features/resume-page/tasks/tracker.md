# Tracker — resume-page

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Publish gate: rules.js + code-хости + схема фактів | domain | Yuriy Sobakar | M | — | todo |
| T2 | View model: сортування, стрип confidential, прибирання порожнього | domain | Yuriy Sobakar | M | — | todo |
| T3 | Зшити конвеєр у load.js | wiring | Yuriy Sobakar | S | T1, T2 | todo |
| T4 | SCR-01 каркас: landmarks, порядок section, адаптив | ui | Yuriy Sobakar | S | T3 | todo |
| T5 | SCR-02 hero з fact-list | ui | Yuriy Sobakar | S | T3 | todo |
| T6 | SCR-03 experience з Present | ui | Yuriy Sobakar | S | T3 | todo |
| T7 | SCR-04 skills: групи чипами, сітка 2 колонки | ui | Yuriy Sobakar | S | T3, T4 | todo |
| T8 | SCR-05 projects: commercial / pet / confidential | ui | Yuriy Sobakar | M | T3 | todo |
| T9 | SCR-06 contacts + лічильник кліків | ui | Yuriy Sobakar | S | T4 | todo |
| T10 | Тест збірки на фікстурах | tests | Yuriy Sobakar | M | T4, T5, T6, T7, T8, T9 | todo |
| T11 | Оновити CLAUDE.md і карту архітектури | docs | Yuriy Sobakar | S | T10 | todo |

**Total:** 11 tasks, ~3–4 person-days (S ≈ 2–3 год, M ≈ пів дня).
