'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { Copy, Locale } from '@/lib/i18n'
import { LOCALES } from '@/lib/i18n'
import { path, swapLocale } from '@/lib/routes'

interface Props {
  locale: string
  copy: Copy
}

export function SiteHeader({ locale, copy }: Props) {
  const pathname = usePathname() ?? ''

  const links = [
    { href: path(locale, 'home'), label: copy.navHome },
    { href: path(locale, 'listen'), label: copy.navPlate },
    { href: path(locale, 'build'), label: copy.navSynthesis },
    { href: path(locale, 'proof'), label: copy.navComparison },
  ]

  const other = (LOCALES.find((l) => l !== locale) ?? 'en') as Locale
  const swapped = swapLocale(pathname, locale, other)

  return (
    <header className="border-b border-emulsion">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-baseline gap-x-8 gap-y-3 px-5 py-4">
        <Link href={`/${locale}/`} className="font-display text-2xl leading-none text-energyHigh">
          {copy.title}
        </Link>

        <nav className="flex gap-5 text-sm">
          {links.map((link) => {
            const active = pathname === link.href || pathname === link.href.replace(/\/$/, '')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? 'text-instrument underline underline-offset-4'
                    : 'text-inkMuted hover:text-energyHigh'
                }
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="tabular rounded-sm border border-emulsion px-2 py-1 text-inkMuted">
            {copy.privacyBadge}
          </span>
          <Link href={swapped} className="text-inkMuted hover:text-energyHigh">
            {copy.otherLocaleName}
          </Link>
        </div>
      </div>
    </header>
  )
}
