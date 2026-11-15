import { track } from '@vercel/analytics';
import { gaEvent } from './ga';

// "Thanks for viewing — contact us" notice shown on demo builds.
// Turn it off for a client's production build with NEXT_PUBLIC_DEMO_NOTICE=0 (Vercel → Environment Variables).
export const DEMO = {
  enabled: process.env.NEXT_PUBLIC_DEMO_NOTICE !== '0',
  /** WhatsApp number (used only in the wa.me link, not shown on the page) */
  phone: '+972505308305',
  /** open on its own after this long, unless the footer or exit intent opened it first */
  delayMs: 40_000,
};

/**
 * Funnel events in Vercel Web Analytics (Analytics → Events):
 *   demo_notice_shown { trigger: footer | timer | exit | reload }
 *   demo_notice_closed { via: close | esc | swipe }
 *   demo_notice_reopened {}            — clicked the collapsed WhatsApp button
 *   demo_whatsapp_click { opened_by, lang } — the conversion
 * In development they are only logged to the console.
 * The same events go to GA4 under the same names, except the conversion, which GA4 gets as
 * whatsapp_click + the recommended generate_lead { method: whatsapp } (mark it as a key event in GA4 → Admin → Events).
 */
export const trackDemo = (name: string, data?: Record<string, string>) => {
  try { track(name, data); } catch { /* analytics blocked or unavailable */ }
  if (name === 'demo_whatsapp_click') {
    gaEvent('whatsapp_click', data);
    gaEvent('generate_lead', { method: 'whatsapp', ...data });
  } else {
    gaEvent(name, data);
  }
};

export const waLink =(text: string) =>
  `https://wa.me/${DEMO.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
