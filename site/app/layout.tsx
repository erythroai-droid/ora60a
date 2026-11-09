import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Heebo, Inter } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';

// Latin + Cyrillic face (Windows has no Helvetica Neue, so the Rosso stack fell back to Arial)
const inter = Inter({ subsets: ['latin', 'cyrillic'], weight: ['300', '400', '500', '600'], variable: '--font-main', display: 'swap' });
// Hebrew: Heebo
const heebo = Heebo({ subsets: ['hebrew', 'latin'], weight: ['300', '400', '500', '600'], variable: '--font-he', display: 'swap' });
// Arabic (+ paired Latin): True Arabic
const trueArabic = localFont({
  src: [
    { path: './fonts/TrueArabic-Light.otf', weight: '300', style: 'normal' },
    { path: './fonts/TrueArabic-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/TrueArabic-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/TrueArabic-Semibold.otf', weight: '600', style: 'normal' },
  ],
  variable: '--font-ar',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'ORA 60A — the timeless automatic chronograph',
  description: 'Watch landing template: the watch assembles itself part by part as you scroll.',
};
export const viewport: Viewport = { themeColor: '#ebebeb', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${heebo.variable} ${trueArabic.variable}`} suppressHydrationWarning>
      <head>
        {/* decide the static (no-animation) layout before first paint, so phones never flash the animated one */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.toggle('static',matchMedia('(max-width: 900px), (prefers-reduced-motion: reduce)').matches)" }} />
      </head>
      <body><I18nProvider>{children}</I18nProvider></body>
    </html>
  );
}
