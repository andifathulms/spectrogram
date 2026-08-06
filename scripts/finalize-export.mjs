/**
 * Post-build step for the static export.
 *
 * Two jobs:
 *  1. Write .nojekyll, without which GitHub Pages refuses to serve _next/.
 *  2. Verify the built output cannot request anything from another host.
 *
 * The check is deliberately about *references the browser will resolve* —
 * markup attributes, CSS url() and @import — rather than about the string
 * "https://" appearing anywhere. Framework error messages, licence headers and
 * core-js test fixtures all contain URLs that are never fetched, and failing
 * on those would train everyone to ignore this script. A known-tracker
 * denylist runs alongside it, because those would be fetched if present.
 *
 * The source-level counterpart lives in tests/privacy/no-network.test.ts.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const out = new URL('../out/', import.meta.url).pathname

/** Namespaces, not endpoints: nothing resolves these over the network. */
const INERT_PREFIXES = ['http://www.w3.org/', 'https://www.w3.org/']

/**
 * The maker's mark in the footer links to four addresses. An `href` on an
 * anchor is the one external reference a browser does *not* resolve on its
 * own — it waits for a click, and then the visitor has left the site. So it
 * is allowed, and only there: `<link href>`, `src`, `srcset`, `poster`,
 * `action`, `url()` and `@import` are all still resolved automatically and all
 * still fail this script, on every host including these.
 *
 * Pinned individually, so a fifth address has to be added here on purpose.
 */
const OUTBOUND_LINKS = [
  'https://andifathulms.github.io/en/',
  'https://github.com/andifathulms',
  'https://www.linkedin.com/in/andifathulmukminin/',
  'https://www.instagram.com/andifathulms/',
]

/** Hosts that would be fetched, and must not appear at all. */
const DENIED = [
  'fonts.gstatic.com',
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'sentry.io',
  'vitals.vercel-insights.com',
  'vercel-analytics.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
]

/**
 * Known-inert occurrences, pinned individually so a *new* one still fails.
 *
 * Next's main chunk carries a lookup table of external font providers, used to
 * inject preconnect hints when your own markup links to one. Ours does not —
 * the reference scan below confirms no HTML or CSS in the export resolves an
 * external host — so the table is never consulted and nothing is fetched.
 */
const ALLOWED_MENTIONS = [
  { file: /^_next\/static\/chunks\/main-[a-z0-9]+\.js$/, host: 'fonts.gstatic.com' },
]

function isAllowedMention(name, host) {
  return ALLOWED_MENTIONS.some((entry) => entry.host === host && entry.file.test(name))
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) walk(path, files)
    else files.push(path)
  }
  return files
}

const files = walk(out)
const offenders = []

/** CSS references. Always resolved by the browser, no exceptions. */
const CSS_PATTERNS = [
  /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
  /@import\s+(?:url\()?\s*["']([^"']+)["']/gi,
]

/** Every markup tag, so an attribute can be judged by the element carrying it. */
const TAG = /<([a-zA-Z][\w:-]*)\b([^>]*?)\/?>/g
const ATTRIBUTE = /(src|href|srcset|poster|action)\s*=\s*["']([^"']+)["']/gi

function isExternal(value) {
  return /^(?:https?:)?\/\//.test(value)
}

/** An anchor's href, and one of the four pinned addresses. Nothing else. */
function isOutboundLink(tag, attribute, value) {
  return tag === 'a' && attribute === 'href' && OUTBOUND_LINKS.includes(value)
}

let outbound = 0

for (const file of files) {
  const extension = extname(file)
  const scanReferences = ['.html', '.css'].includes(extension)
  const scanDenylist = ['.html', '.css', '.js', '.txt', '.json'].includes(extension)
  if (!scanReferences && !scanDenylist) continue

  const source = readFileSync(file, 'utf8')
  const name = relative(out, file)

  if (scanReferences) {
    for (const pattern of CSS_PATTERNS) {
      for (const match of source.matchAll(pattern)) {
        const value = match[1].trim()
        if (!isExternal(value)) continue
        if (INERT_PREFIXES.some((prefix) => value.startsWith(prefix))) continue
        offenders.push(`${name}: resolves ${value}`)
      }
    }

    for (const tag of source.matchAll(TAG)) {
      const element = tag[1].toLowerCase()
      for (const match of tag[2].matchAll(ATTRIBUTE)) {
        const attribute = match[1].toLowerCase()
        const value = match[2].trim()
        if (!isExternal(value)) continue
        if (INERT_PREFIXES.some((prefix) => value.startsWith(prefix))) continue
        if (isOutboundLink(element, attribute, value)) {
          outbound++
          continue
        }
        offenders.push(`${name}: <${element} ${attribute}> resolves ${value}`)
      }
    }
  }

  if (scanDenylist) {
    for (const host of DENIED) {
      if (source.includes(host) && !isAllowedMention(name, host)) {
        offenders.push(`${name}: mentions ${host}`)
      }
    }
  }
}

if (offenders.length > 0) {
  console.error('The export can reach another host — invariant 9 requires it cannot:')
  for (const offender of offenders.slice(0, 40)) console.error(`  ${offender}`)
  if (offenders.length > 40) console.error(`  … and ${offenders.length - 40} more`)
  process.exit(1)
}

writeFileSync(join(out, '.nojekyll'), '')
console.log(
  `export verified: .nojekyll written; ${files.length} files carry no external reference ` +
    `and no known tracker. ${outbound} outbound footer links, all pinned, none fetched.`,
)
