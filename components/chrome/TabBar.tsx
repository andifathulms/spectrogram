'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { Copy } from '@/lib/i18n'
import { path, type Route } from '@/lib/routes'

/**
 * The phone's navigation: three destinations at the bottom, under the thumb,
 * instead of a nav row that scrolls sideways in the header. Hidden from md up,
 * where the header has room for all three.
 */
export function TabBar({ locale, copy }: { locale: string; copy: Copy }) {
  const pathname = usePathname() ?? ''

  const tabs: { route: Route; label: string; icon: React.ReactNode }[] = [
    { route: 'listen', label: copy.tabListen, icon: <PlateIcon /> },
    { route: 'build', label: copy.tabBuild, icon: <TonesIcon /> },
    { route: 'proof', label: copy.tabProof, icon: <CheckIcon /> },
  ]

  return (
    <nav
      aria-label={copy.navLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-void/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="m-0 grid list-none grid-cols-3 p-0">
        {tabs.map((tab) => {
          const href = path(locale, tab.route)
          const active = pathname === href || pathname === href.replace(/\/$/, '')
          return (
            <li key={tab.route}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 pb-2 pt-2.5 text-[0.6875rem] font-medium transition-colors ${
                  active ? 'text-ink' : 'text-inkFaint hover:text-inkMuted'
                }`}
              >
                <span
                  className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? 'bg-raised' : ''}`}
                  aria-hidden
                >
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const ICON = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  focusable: 'false' as const,
}

/** A plate with three bands. */
function PlateIcon() {
  return (
    <svg {...ICON}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M6.5 15.5h11M6.5 11.5h8M6.5 8h4.5" />
    </svg>
  )
}

/** Three tones of different strengths. */
function TonesIcon() {
  return (
    <svg {...ICON}>
      <path d="M6 19V9M12 19V5M18 19v-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...ICON}>
      <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
    </svg>
  )
}
