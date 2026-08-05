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
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={params.locale} copy={copy} />
      <main className="flex-1">{children}</main>
      <SiteFooter copy={copy} />
    </div>
  )
}
