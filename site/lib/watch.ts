// Everything about the watch and the assembly video in one place: swap these values for a real model.

/** Frames in public/frames/assembly/{768,1280,1920}/frame_0001..0181.webp (every 3rd frame of the 18 s, 30 fps source video). */
export const FRAMES = 181;
export const FRAME_DIR = '/frames/assembly';

export const BRAND = 'ORA';
export const MODEL = '60A';

/**
 * Parts in the order the video assembles them.
 * f: frame range (0-based) where the part flies in. Measured on a contact sheet of the video; retime here if the video changes.
 * g: weight in grams (placeholder), w: scroll weight (how long the part stays on screen relative to the others).
 * Texts: i18n keys p{n}n (name), p{n}d (description), m{n} (material).
 */
export const PARTS = [
  { n: 1, g: 16, f: [10, 20] },    // bezel ring
  { n: 2, g: 34, f: [20, 30] },    // case middle
  { n: 3, g: 14, f: [30, 40] },    // caseback + crown
  { n: 4, g: 29, f: [40, 90], w: 1.8 },   // movement, wheels and bridges
  { n: 5, g: 11, f: [90, 108] },   // dial
  { n: 6, g: 1, f: [108, 119] },   // hands
  { n: 7, g: 38, f: [119, 130] },  // bracelet
  { n: 8, g: 3, f: [130, 141] },   // sapphire crystal
] as const;

export const TOTAL_G = PARTS.reduce((s, p) => s + p.g, 0);

/**
 * After the watch is assembled: giant headline + short feature cards alternating start/end
 * (thewatch.60fps.fr big-text-section). ids map to i18n sc{id}k / sc{id}p.
 */
export const SHOWCASE = [
  { id: 1, side: 'start' },
  { id: 2, side: 'end' },
  { id: 3, side: 'start' },
  { id: 4, side: 'end' },
] as const;

/** Fraction of the assembly scrub used for frames; the rest is the post-assembly showcase. */
export const ASSEMBLY_SHARE = 0.62;

/** Design slider stills (frame index + i18n keys ds_s{n}h / ds_s{n}p). */
export const DESIGN_SLIDES = [
  { frame: FRAMES - 1, n: 1 },
  { frame: 100, n: 2 },
  { frame: 70, n: 3 },
  { frame: 125, n: 4 },
] as const;

type Stage = { f: readonly [number, number]; w: number };
/** Scroll stages: 0 = hero (empty frames), 1..8 = parts, 9 = assembled watch. Each stage gets scroll length in proportion to w. */
export const STAGES: Stage[] = [
  { f: [0, 10], w: 1.2 },
  ...PARTS.map((p) => ({ f: p.f, w: 'w' in p ? p.w : 1 })),
  { f: [141, FRAMES - 1], w: 2 },
];
const W = STAGES.reduce((s, x) => s + x.w, 0);

/** Scroll progress 0..1 (assembly share only) -> active stage and (fractional) frame index. */
export function locate(progress: number) {
  let x = Math.max(0, Math.min(1, progress)) * W;
  for (let i = 0; i < STAGES.length; i++) {
    const s = STAGES[i];
    if (x <= s.w || i === STAGES.length - 1) {
      let local = Math.min(1, x / s.w);
      if (i === STAGES.length - 1) local = Math.min(1, local / 0.7);   // the last stage finishes its frames early and then holds the assembled watch
      return { stage: i, local, frame: s.f[0] + local * (s.f[1] - s.f[0]) };
    }
    x -= s.w;
  }
  return { stage: STAGES.length - 1, local: 1, frame: FRAMES - 1 };
}

/** Middle frame of a stage (stills for the static page). */
export const stillOf = (stage: number) => Math.round((STAGES[stage].f[0] + STAGES[stage].f[1]) / 2);
export const framePath = (size: number, i: number) => `${FRAME_DIR}/${size}/frame_${String(i + 1).padStart(4, '0')}.webp`;
export const pad = (n: number) => String(n).padStart(2, '0');
