import { notFound } from 'next/navigation'

import { LOCALES, copyFor, isLocale } from '@/lib/i18n'
import { SiteHeader } from '@/components/chrome/SiteHeader'
import { SiteFooter } from '@/components/chrome/SiteFooter'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const dynamicParams = false

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
