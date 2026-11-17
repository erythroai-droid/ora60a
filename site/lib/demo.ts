import { useEffect, useState } from 'react';
import { track } from '@vercel/analytics';
import { gaEvent } from './ga';

// "Thanks for viewing — contact us" notice shown on demo builds.
// Turn it off for a client's production build with NEXT_PUBLIC_DEMO_NOTICE=0 (Vercel → Environment Variables).
export const DEMO = {
  enabled: process.env.NEXT_PUBLIC_DEMO_NOTICE !== '0',
  /** WhatsApp number (used only in the wa.me link, not shown on the page) */
  phone: '+972505308305',
  /** the WhatsApp button shows from the start; the card unfolds on its own after this long… */
  delayMs: 3_500,   // most mobile ad visitors leave within 5–10 s (GA4, 16.11.2026: ~1 s average engagement)
  /** …or once the visitor scrolls this many screens down (or reaches the footer / exit intent), whichever comes first */
  openAfterScreens: 1,
};

/**
 * Funnel events in Vercel Web Analytics (Analytics → Events):
 *   demo_notice_shown { trigger: timer | scroll | footer | exit | reload }
 *   demo_notice_closed { via: close | esc | swipe }
 *   demo_notice_reopened {}            — clicked the collapsed WhatsApp button
 *   demo_whatsapp_click { opened_by, lang, source? } — WhatsApp opened (not a lead); source = adSource() when the visit came from an ad
 * In development they are only logged to the console.
 * The same events go to GA4 under the same names, except demo_whatsapp_click, which GA4 gets as
 * whatsapp_click. generate_lead is sent only by the contact form (components/Header.tsx).
 */
export const trackDemo = (name: string, data?: Record<string, string>) => {
  try { track(name, data); } catch { /* analytics blocked or unavailable */ }
  // Opening WhatsApp isn't a lead (people open it out of curiosity and never send), so the click
  // goes to GA4 only as whatsapp_click; generate_lead fires solely on a successful form submit.
  gaEvent(name === 'demo_whatsapp_click' ? 'whatsapp_click' : name, data);
};

const SRC_KEY = 'demo-src';

/**
 * Where the visitor came from, read from the landing URL: "utm_source / utm_campaign / utm_term"
 * (utm_term carries the Meta placement), or "facebook" / "google" from a bare fbclid / gclid.
 * Kept for the visit in sessionStorage so it survives a reload or a URL without the tags. '' for direct visits.
 */
export const adSource = (): string => {
  try {
    const q = new URLSearchParams(window.location.search);
    const utm = ['utm_source', 'utm_campaign', 'utm_term'].map((k) => q.get(k)?.trim()).filter(Boolean).join(' / ');
    const src = (utm || (q.has('fbclid') ? 'facebook' : q.has('gclid') ? 'google' : '')).slice(0, 120);
    if (src) { sessionStorage.setItem(SRC_KEY, src); return src; }
    return sessionStorage.getItem(SRC_KEY) ?? '';
  } catch { return ''; }
};

/** wa.me link with the pre-filled message; the ad source, when known, goes on its own line at the end. */
export const waLink = (text: string, src = '') =>
  `https://wa.me/${DEMO.phone.replace(/\D/g, '')}?text=${encodeURIComponent(src ? `${text}\n\n[${src}]` : text)}`;

/** Phones and small tablets (≤900px, the same breakpoint as the CSS): StudioBar there, the DemoNotice card on wider screens. */
export const PHONE_MQ = '(max-width: 900px)';
export const usePhone = (): boolean | null => {
  const [phone, setPhone] = useState<boolean | null>(null);   // null until mounted: render neither variant on the server
  useEffect(() => {
    const mq = window.matchMedia(PHONE_MQ);
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
};
