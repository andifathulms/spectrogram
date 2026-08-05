import type { Metadata, Viewport } from 'next'
import { Chivo_Mono, Instrument_Sans, Instrument_Serif } from 'next/font/google'

import './globals.css'

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

export const metadata: Metadata = {
  title: 'Urai — spectrogram dan FFT',
  description:
    'Suara diurai menjadi frekuensinya, dengan Cooley-Tukey FFT yang ditulis dari nol. Audio tidak pernah meninggalkan perangkat.',
}

export const viewport: Viewport = {
  themeColor: '#14171A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-plate antialiased">{children}</body>
    </html>
  )
}
