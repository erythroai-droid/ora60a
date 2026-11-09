# ORA 60A — шаблон сайта часов

Стек и приёмы как в `C:\dev\Ferrari\rosso-garage`: Next.js 15 + React 19 + GSAP (ScrollSmoother / ScrollTrigger), видео → кадры WebP на canvas, i18n en/ru/he/ar с RTL. Референс по композиции: thewatch.60fps.fr.

```bash
npm install
npm run dev     # http://localhost:3200
npm run build && npm start
```

## Что где
- `lib/watch.ts` — **всё о часах**: бренд/модель, 8 деталей (вес, диапазон кадров, длина скролла), этапы сборки. Тайминги сняты по контакт-листу видео; при новом видео меняются тут.
- `components/Assembly.tsx` — закреплённая сцена: кадры сборки по скроллу, герой, список деталей, карточка текущей детали, финал, «удерживайте, чтобы собрать». Для телефонов/reduced motion — статичная версия со стоп-кадрами.
- `components/BgType.tsx` — гигантский бренд/модель + gauge-кольцо за часами (как FS60 на thewatch.60fps.fr): скролл через `--p`, лёгкий mouse parallax.
- `components/Showcase.tsx` — после сборки: крупный stacked-текст + короткие блоки L/R по скроллу; затем наезжает следующий раздел.
- Дизайн (`Sections.Design`) — слайдер ракурсов со свайпом на телефоне.
- `components/AiChat.tsx` — демо ИИ-консультант (паттерн `rosso-garage/AiChat`, контракт как у erythro consultant): заглушки ответов, без API; позже — `/api/consult` + Gemini.
- `components/Cursor.tsx` — кастомный курсор (кольцо; над ссылками — диск со стрелкой; над сценой — «Удерживайте»).
- `components/Preloader.tsx` — круговой прелоадер по загрузке кадров.
- `components/Sections.tsx` — Механизм (закреплён, остальное наезжает), бегущие буквы, Дизайн, таблица деталей, футер.
- `lib/scroll.tsx`, `lib/pin.ts`, `Reveal`, `CountUp`, `Modal`, `Flag`, `ScrollTop` — перенесены из rosso-garage без изменений.
- `public/frames/assembly/{768,1280,1920}/frame_0001..0181.webp` — каждый 3-й кадр 18-секундного 4K-видео из `../Video`.
- Палитра: светлый фон `#ebebeb` с градиентами (референс 60fps); сцена сборки остаётся студийной под кадры видео.

## Тексты и переводы
Источник — `i18n/ru.txt` (`ключ = текст`). en/he/ar получены **только через воркер** `C:\agents\Translater` (стиль `UI/Microcopy`, кусками по 12 строк — целый файл Gemini не успевает за 60 с). После правок: перевести, положить в `i18n/{en,he,ar}.txt`, выполнить `npm run i18n` (генерирует `lib/dict.ts`).

## Кадры заново (если видео поменяется)
```powershell
$ff = "$env:APPDATA\Python\Python39\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
& $ff -i video.mov -filter_complex "[0:v]select='not(mod(n\,3))',setpts=N/TB,split=3[a][b][c];[a]scale=1920:1080:flags=lanczos[A];[b]scale=1280:720:flags=lanczos[B];[c]scale=768:432:flags=lanczos[C]" `
  -map "[A]" -fps_mode passthrough -c:v libwebp -quality 82 public/frames/assembly/1920/frame_%04d.webp `
  -map "[B]" -fps_mode passthrough -c:v libwebp -quality 82 public/frames/assembly/1280/frame_%04d.webp `
  -map "[C]" -fps_mode passthrough -c:v libwebp -quality 80 public/frames/assembly/768/frame_%04d.webp
```
Затем обновить `FRAMES`, диапазоны `f` у деталей и `BG` (цвет углов кадра) в `Assembly.tsx` / `--stage` в `globals.css`.

Тексты, вес деталей, цены и контакты — заглушки.
