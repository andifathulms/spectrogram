import type { Metadata, Viewport } from 'next'
import { Chivo_Mono, Instrument_Sans, Instrument_Serif } from 'next/font/google'

import './globals.css'
import { DEFAULT_LOCALE } from '@/lib/i18n'

/**
 * Fonts are fetched at build time and self-hosted in the export. Invariant 9
 * forbids a font CDN at runtime, not at build time — nothing is fetched from
 * the network once the page is loaded.
 */
const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

const sans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const mono = Chivo_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

/**
 * Both come from next.config.js rather than being written here: `basePath` so
 * a rename of the repository moves every icon with it, and the origin so the
 * one absolute URL this site needs — the card image a crawler resolves, which
 * has to be absolute to work at all — never appears as a literal in shipped
 * source. tests/privacy/no-network.test.ts is the reason, and it stays honest:
 * nothing here is fetched by the page.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN

const title = 'Spectrogram — see what sound looks like'
const description =
  'Watch sound split into the tones it is made of, live, in your browser. The Fourier transform behind it is written from scratch, and your audio never leaves the device.'

export const metadata: Metadata = {
  metadataBase: origin === undefined ? null : new URL(origin),
  title,
  description,
  applicationName: 'Spectrogram',
  manifest: `${basePath}/site.webmanifest`,
  icons: {
    icon: [
      // SVG first: every current browser prefers it, and it stays sharp.
      { url: `${basePath}/favicon.svg`, type: 'image/svg+xml' },
      { url: `${basePath}/icons/icon-32.png`, sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: `${basePath}/icons/apple-touch-icon.png`, sizes: '180x180' }],
  },
  // capable: false on purpose — there is no service worker, so an installed
  // standalone shell would show a network error the moment it opened offline.
  appleWebApp: { title: 'Spectrogram', capable: false },
  openGraph: {
    type: 'website',
    siteName: 'Spectrogram',
    title,
    description,
    images: [
      {
        url: `${basePath}/social/og.png`,
        width: 1200,
        height: 630,
        alt: 'Spectrogram — see what sound looks like',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${basePath}/social/og.png`],
  },
}

export const viewport: Viewport = {
  themeColor: '#14171A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE} className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-plate antialiased">{children}</body>
    </html>
  )
}
