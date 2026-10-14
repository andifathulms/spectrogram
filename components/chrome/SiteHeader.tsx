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
 * a scroll away.
 *
 * The destinations are grouped by what they are. "See sound" and "Build a
 * sound" are the two instruments, so they sit together as one pill pair.
 * "Check the maths" is evidence, and stands on the right beside the other
 * piece of evidence, the privacy promise. The language switch shows both
 * languages, so the current one is visible rather than implied.
 */
export function SiteHeader({ locale, copy }: Props) {
  const pathname = usePathname() ?? ''

  const isActive = (href: string) => pathname === href || pathname === href.replace(/\/$/, '')

  const instruments = [
    { href: path(locale, 'listen'), label: copy.navListen },
    { href: path(locale, 'build'), label: copy.navBuild },
  ]
  const proof = path(locale, 'proof')

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-void/80 backdrop-blur-md">
      <div className="shell flex h-16 items-center gap-3 sm:gap-5">
        <Link
          href={path(locale, 'home')}
          className="flex shrink-0 items-center gap-2.5"
          aria-label={copy.title}
        >
          <BrandMark />
          <span className="font-display text-[1.375rem] leading-none text-ink">{copy.title}</span>
        </Link>

        <nav aria-label={copy.navLabel} className="hidden min-w-0 flex-1 items-center gap-3 sm:gap-5 md:flex">
          {/* From md up. On a phone the tab bar at the bottom carries the nav. */}
          <div className="hidden min-w-0 gap-0.5 rounded-full border border-hairline bg-void p-[3px] md:flex">
            {instruments.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-raised text-ink shadow-[inset_0_0_0_1px_theme(colors.emulsion)]'
                      : 'text-inkFaint hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <span className="flex-1" />

          <Link
            href={proof}
            aria-current={isActive(proof) ? 'page' : undefined}
            className={`whitespace-nowrap text-sm font-medium transition-colors ${
              isActive(proof) ? 'text-ink underline decoration-emulsion underline-offset-[6px]' : 'text-inkMuted hover:text-ink'
            }`}
          >
            {copy.navProof}
          </Link>
        </nav>

        {/* Below md the nav is gone from here, so this spacer keeps the switch on the right. */}
        <span className="flex-1 md:hidden" />

        <span
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-xs text-inkMuted md:hidden"
          title={copy.homePrivacyBody}
        >
          <span className="block h-1.5 w-1.5 rounded-full bg-instrument" aria-hidden />
          {copy.privacyShort}
        </span>

        <span
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-xs text-inkMuted lg:flex"
          title={copy.homePrivacyBody}
        >
          <span className="block h-1.5 w-1.5 rounded-full bg-instrument" aria-hidden />
          {copy.privacyBadge}
        </span>

        <LocaleSwitch locale={locale} pathname={pathname} copy={copy} />
      </div>
    </header>
  )
}

/** Both languages, the current one marked. Codes are not copy: they are the locales. */
function LocaleSwitch({ locale, pathname, copy }: { locale: string; pathname: string; copy: Copy }) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-full border border-hairline bg-void p-[3px] text-xs font-medium uppercase">
      {LOCALES.map((code) =>
        code === locale ? (
          <span
            key={code}
            aria-current="true"
            className="rounded-full bg-raised px-2 py-1 text-ink shadow-[inset_0_0_0_1px_theme(colors.emulsion)]"
          >
            {code}
          </span>
        ) : (
          <Link
            key={code}
            href={swapLocale(pathname, locale, code as Locale)}
            hrefLang={code}
            lang={code}
            title={copy.otherLocaleName}
            aria-label={copy.otherLocaleName}
            className="rounded-full px-2 py-1 text-inkFaint transition-colors hover:text-ink"
          >
            {code}
          </Link>
        ),
      )}
    </div>
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
