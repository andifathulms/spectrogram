import { notFound } from 'next/navigation'

import { LOCALES, copyFor, isLocale } from '@/lib/i18n'
import { SiteHeader } from '@/components/chrome/SiteHeader'
import { SiteFooter } from '@/components/chrome/SiteFooter'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/*
 * No `dynamicParams = false` here. It would be redundant — a static export
 * only serves the paths it generated, so an unknown locale is already a 404 at
 * the file-system level — and under Next 14.2 setting it on a layout makes
 * `next dev` reject every page beneath it as missing generateStaticParams,
 * even though the pages export it and `next build` prerenders them fine.
 */

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const copy = copyFor(params.locale)

  return (
    <div lang={params.locale} className="flex min-h-screen flex-col">
      {/* Keyboard users reach the plate without walking the nav every time. */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-instrument focus:px-4 focus:py-2 focus:text-sm focus:text-plate"
      >
        {copy.skipToContent}
      </a>

      <SiteHeader locale={params.locale} copy={copy} />
      <main id="content" className="flex-1">
        {children}
      </main>
      <SiteFooter copy={copy} />
    </div>
  )
}
