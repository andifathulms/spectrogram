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
          title={copy.otherLocaleName}
          aria-label={copy.otherLocaleName}
          className="shrink-0 rounded-full border border-hairline px-2.5 py-1 text-xs uppercase tracking-wider text-inkMuted hover:border-instrument hover:text-instrument"
        >
          {other}
        </Link>
      </div>
    </header>
  )
}

/**
 * "Batang" — the brand mark, at its published geometry.
 *
 * Three bars rising quiet → loud inside a rounded square, taken bar for bar
 * from exports/svg (x 24/44/64, tops 58/44/30, all landing on the same
 * baseline). The kit's own rule is that the bars are fixed at three heights
 * and never animate or resize, so they are written as constants and left
 * alone.
 *
 * The kit's hexes are the app's palette under other names — Loud #D9954B is
 * energyMid, Paper #E8E8E4 is energyHigh, Quiet #3A5A86 is energyLow — so the
 * mark is drawn in tokens rather than in brand hex. One palette, and the
 * convention against raw hex in components survives.
 */
function BrandMark() {
  const bars = [
    { x: 24, y: 58, className: 'fill-energyMid' },
    { x: 44, y: 44, className: 'fill-energyHigh' },
    { x: 64, y: 30, className: 'fill-energyLow' },
  ]

  return (
    <svg viewBox="0 0 100 100" width="24" height="24" aria-hidden focusable="false">
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="22"
        fill="none"
        className="stroke-hairline"
        strokeWidth="4"
      />
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width="12"
          height={80 - bar.y}
          rx="2"
          className={bar.className}
        />
      ))}
    </svg>
  )
}
