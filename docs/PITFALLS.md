# Watch — pitfalls

## Content blocks look transparent on Vercel (missing `/video/*.mp4`)

**Symptom:** Movement / Design / Parts sections are washed out / see-through after deploy; locally they look fine.

**Cause:** `.gitignore` had `Video/`, which on Windows also matched `site/public/video/` (case-insensitive). Background mp4s never shipped. Sections used `.has-vbg { background: transparent }` and relied on a semi-opaque veil over the video — with a 404 video, the veil composites over the assembly stage behind.

**Fix:** Ignore only `/Video/` at repo root. Keep opaque `background: var(--panel)` under `.has-vbg` so a missing video cannot punch a hole. Commit the three loop mp4s in `site/public/video/` (not `watch-assembly.mov`).

## Vercel build: `next/font` TypeError on Inter/Heebo

**Symptom:** `next build` fails with `An error occurred in next/font` → `TypeError: Cannot read properties of null (reading '1')` in `@next/font/dist/google/loader.js`, often on a cold Vercel build without cache.

**Cause:** Google Fonts sometimes returns extensionless `/l/font?kit=…` URLs. Next 15.x webpack loader assumes a `.woff2` suffix and crashes. Upstream: [vercel/next.js#99114](https://github.com/vercel/next.js/issues/99114); fixed in Next ≥16.4.3, not yet released on 15.5.x.

**Fix:** Do not use `next/font/google` for Inter/Heebo on this stack. Self-host via `@fontsource/inter` + `@fontsource/heebo` CSS imports and set `--font-main` / `--font-he` in `globals.css`. Keep Arabic on `next/font/local`.

## Full-screen pin + magnet: next block covers content too early

**Symptom:** On scroll down a section “skips”, and the next block starts rising immediately, covering the bottom of the current copy (Movement / Design / Parts).

**Causes:**
1. `min-height: calc(var(--vh) + 4px)` made `offsetHeight > innerHeight`, so `usePinnedBlock` used `start: 'bottom bottom'` — the block scrolled up a few pixels before pinning, and the next `.rise` ate the bottom of the content.
2. A short trailing sibling (marquee) before the next `.grp.over` (`margin-block-start: -1vh`) let the next group overlap the still-visible pinned section.
3. `--hold` / `HOLD` at 0.6 screen was too short before the next block entered.

**Fix:**
- Pin at `top top` unless the block is meaningfully taller than the viewport (`> innerHeight + 24`); use `anticipatePin: 1`.
- Give pinned sections a fixed `height: calc(var(--vh) + 4px)` + `overflow: hidden`, and keep `fit` zoom on the inner wrapper.
- Make the post-pin buffer (e.g. `.rise.after` / marquee) at least one screen tall.
- Keep `--hold` / `HOLD` at one full screen so the magnet free-zone includes a real pause before the next block arrives.

## Marquee `.rise.after` widens the page (ORA60A overflow)

**Symptom:** Giant `ORA60A` letters stick past the right edge; horizontal page scroll appears on mobile/static.

**Cause:** `.marq-row { width: max-content }` lived in normal flow. Flex/`min-width: auto` ancestors grew with it even when `overflow: hidden` was set on `.marq`.

**Fix:**
- Keep vertical space with an invisible `.marq-sizer`; put `.marq-row` `position: absolute` so it cannot expand layout.
- `contain: inline-size paint` + `overflow-x: clip` on `.marq`, `.rise.after`, `#smooth-wrapper` / `#smooth-content` / `main`.
- On `html.static`: one centered word only (hide repeat spans), no scrub transform.
