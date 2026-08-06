/**
 * Every path in one place.
 *
 * The slugs are English and locale-independent — a reader who lands on
 * `/id/listen/` gets Indonesian copy at an address they can still read out
 * loud. They are defined here rather than typed at each call site so that a
 * rename is one edit and a broken link is a type error.
 */

export const ROUTES = ['home', 'listen', 'build', 'proof'] as const
export type Route = (typeof ROUTES)[number]

const SLUGS: Record<Route, string> = {
  home: '',
  listen: 'listen/',
  build: 'build/',
  proof: 'proof/',
}

/** Trailing slash throughout — the export is configured with trailingSlash. */
export function path(locale: string, route: Route): string {
  return `/${locale}/${SLUGS[route]}`
}

/** The same path under a different locale, for the language switch. */
export function swapLocale(pathname: string, from: string, to: string): string {
  return pathname.startsWith(`/${from}`) ? `/${to}${pathname.slice(from.length + 1)}` : `/${to}/`
}
