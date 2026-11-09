# ORA Watch: светлый фон, динамическая типографика, ИИ-консультант

Шаблон `C:\dev\Watch\site` (Next.js 15 + GSAP), референс композиции — [thewatch.60fps.fr](https://thewatch.60fps.fr/). Стек модулей — `C:\dev\Ferrari\rosso-garage` и контракт консультанта из `C:\dev\erythro-ai`.

## Фон и типографика

- Палитра страницы: `#ebebeb` / `#e0dde3` с фиксированными radial/linear градиентами (атмосфера студии 60fps).
- Сцена сборки (`--stage: #3f3c40`) остаётся под цвета видеокадров; края смягчены светлым vignette в `.asm-shade`.
- `components/BgType.tsx`: гигантские `ORA` / `60A` + gauge-кольцо за часами. Скролл → CSS `--p` на `.asm-stage`; лёгкий mouse parallax → `--mx` / `--my`.
- После сборки (`ASSEMBLY_SHARE` → showcase): `Showcase.tsx` — крупный stacked-заголовок за/вокруг часов + карточки поочерёдно start/end (как `big-text-section` на 60fps). Canvas переходит на contain + светлый fill.
- Блок дизайна: горизонтальный слайдер ракурсов (`DESIGN_SLIDES`), drag/swipe на телефоне, стрелки и точки.

## ИИ-консультант (демо)

- UI: `components/AiChat.tsx` — порт `rosso-garage/components/AiChat.tsx` (FAB + панель, quick replies, typing).
- Ответы пока canned (i18n `ai_*`); без Gemini/Turnstile.
- Следующий шаг к живому стеку erythro: `POST /api/consult` + `ConsultantWidget` / `streamText` (Gemini), KB модели часов, Turnstile.

## Файлы

- `site/app/globals.css` — светлая тема, `.bg-type`, `.ai-*`
- `site/components/BgType.tsx`, `AiChat.tsx`
- `site/i18n/{ru,en,he,ar}.txt` → `npm run i18n`
