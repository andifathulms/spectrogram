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

/**
 * Sticky, because the plate is tall and the way back out of it should never be
 * a scroll away. The nav is a scrollable row rather than a hamburger: four
 * destinations do not earn a menu, and a menu hides the fact that there is
 * anywhere to go.
 */
export function SiteHeader({ locale, copy }: Props) {
  const pathname = usePathname() ?? ''

  const links = [
    { href: path(locale, 'listen'), label: copy.navListen },
    { href: path(locale, 'build'), label: copy.navBuild },
    { href: path(locale, 'proof'), label: copy.navProof },
  ]

  const other = (LOCALES.find((l) => l !== locale) ?? 'en') as Locale
  const swapped = swapLocale(pathname, locale, other)

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-plate/85 backdrop-blur">
      <div className="shell flex h-14 items-center gap-4">
        <Link
          href={path(locale, 'home')}
          className="flex shrink-0 items-center gap-2.5"
          aria-label={copy.title}
        >
          <BrandMark />
          <span className="font-display text-xl leading-none text-ink">{copy.title}</span>
        </Link>

        <nav
          aria-label={copy.title}
          className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {links.map((link) => {
            const active = pathname === link.href || pathname === link.href.replace(/\/$/, '')
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-raised text-ink'
                    : 'text-inkMuted hover:bg-raised/60 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <span
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-xs text-inkMuted sm:flex"
          title={copy.homePrivacyBody}
        >
          <span className="block h-1.5 w-1.5 rounded-full bg-instrument" aria-hidden />
          {copy.privacyBadge}
        </span>

        <Link
          href={swapped}
          hrefLang={other}
          className="shrink-0 rounded-full border border-hairline px-2.5 py-1 text-xs uppercase tracking-wider text-inkMuted hover:border-instrument hover:text-instrument"
        >
          {other}
        </Link>
      </div>
    </header>
  )
}

/**
 * Five bars of a spectrum, in the ramp's own tones. It is the picture the app
 * draws, at 20 pixels — not a logo invented for the corner.
 */
function BrandMark() {
  const bars = [
    { height: 6, className: 'bg-energyLow' },
    { height: 12, className: 'bg-energyMid' },
    { height: 18, className: 'bg-energyHigh' },
    { height: 10, className: 'bg-energyMid' },
    { height: 5, className: 'bg-energyLow' },
  ]

  return (
    <span className="flex h-5 w-5 items-end justify-between" aria-hidden>
      {bars.map((bar, index) => (
        <span
          key={index}
          className={`block w-[2px] rounded-[1px] ${bar.className}`}
          style={{ height: bar.height }}
        />
      ))}
    </span>
  )
}
