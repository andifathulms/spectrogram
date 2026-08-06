/**
 * The maker's mark.
 *
 * Personal credit, deliberately kept apart from the attribution beside it:
 * one is who built the thing, the other is whose mathematics it implements,
 * and merging them would misrepresent both.
 *
 * These are the only outbound links on the site, and they are the only place
 * an absolute URL is allowed to appear in shipped code. That exception is
 * narrow on purpose: a link is not a request. Nothing here is fetched — no
 * icon is loaded, no font, no favicon — the browser resolves these addresses
 * only if a visitor deliberately clicks one and leaves. Both guards
 * (tests/privacy/no-network.test.ts and scripts/finalize-export.mjs) pin this
 * file and this list by name, so a fifth URL, or one anywhere else, still
 * fails the build.
 *
 * Everything identifying lives in MAKER below; nothing else in the file needs
 * touching to update it.
 */

const MAKER = {
  name: 'Andi Fathul Mukminin',
  portfolio: 'https://andifathulms.github.io/en/',
  links: [
    { label: 'Portfolio', href: 'https://andifathulms.github.io/en/', icon: GlobeIcon },
    { label: 'GitHub', href: 'https://github.com/andifathulms', icon: GitHubIcon },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/andifathulmukminin/', icon: LinkedInIcon },
    { label: 'Instagram', href: 'https://www.instagram.com/andifathulms/', icon: InstagramIcon },
  ],
} as const

export function MakerSignature() {
  // Static export: this is the build date, which is what a static site can
  // honestly claim. It never changes under the visitor mid-session.
  const year = new Date().getFullYear()

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <p className="text-sm leading-relaxed text-inkFaint">
        Designed &amp; built by{' '}
        <a
          href={MAKER.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inkMuted underline decoration-hairline underline-offset-4 transition-colors hover:text-instrument hover:decoration-instrument"
        >
          {MAKER.name}
        </a>{' '}
        · © <span className="tabular">{year}</span>
      </p>

      <ul className="-mx-1.5 flex items-center gap-0.5 sm:-mr-1.5">
        {MAKER.links.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex h-9 w-9 items-center justify-center rounded-full text-inkFaint transition-colors hover:bg-raised hover:text-instrument"
            >
              <Icon />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/*
 * Icons are inline SVG at 18px, in currentColor, for the same reason the
 * sample audio is generated rather than downloaded: an icon font or a sprite
 * from a CDN would be a network request, and there are none of those here.
 */

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden focusable="false">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.005 2.045.138 3.005.405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

/*
 * LinkedIn's own mark is an "in" reversed out of a solid tile, which beside
 * three open marks reads as a filled block rather than as one of a set. Drawn
 * here as the letterforms inside an outlined square instead: the same glyph,
 * at the same visual weight as its neighbours.
 */
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
      <rect
        x="2.6"
        y="2.6"
        width="18.8"
        height="18.8"
        rx="4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="7.6" cy="8" r="1.25" fill="currentColor" />
      <path
        d="M6.5 10.6h2.2v7.3H6.5zM10.9 17.9v-7.3h2.1v1a2.9 2.9 0 0 1 2.4-1.2c1.9 0 2.9 1.2 2.9 3.3v4.2h-2.2v-3.8c0-1.1-.5-1.7-1.4-1.7s-1.6.7-1.6 1.8v3.7z"
        fill="currentColor"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden focusable="false">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.56.217.96.477 1.38.896.42.42.68.82.896 1.38.166.422.362 1.057.415 2.227.058 1.266.07 1.646.07 4.849 0 3.204-.012 3.584-.07 4.85-.053 1.17-.249 1.805-.415 2.227-.217.56-.477.96-.896 1.38-.42.42-.82.68-1.38.896-.422.166-1.057.362-2.227.415-1.266.058-1.646.07-4.85.07-3.204 0-3.584-.012-4.85-.07-1.17-.053-1.805-.249-2.227-.415-.56-.217-.96-.477-1.38-.896-.42-.42-.68-.82-.896-1.38-.166-.422-.362-1.057-.415-2.227-.058-1.266-.07-1.646-.07-4.85 0-3.203.012-3.583.07-4.849.053-1.17.249-1.805.415-2.227.217-.56.477-.96.896-1.38.42-.42.82-.68 1.38-.896.422-.166 1.057-.362 2.227-.415 1.266-.058 1.646-.07 4.85-.07zm0 2.162c-3.15 0-3.522.012-4.764.069-1.15.052-1.774.244-2.19.406-.55.214-.943.47-1.356.882-.413.413-.668.806-.882 1.356-.162.416-.354 1.04-.406 2.19-.057 1.242-.069 1.614-.069 4.764 0 3.15.012 3.522.069 4.764.052 1.15.244 1.774.406 2.19.214.55.47.943.882 1.356.413.413.806.668 1.356.882.416.162 1.04.354 2.19.406 1.242.057 1.614.069 4.764.069 3.15 0 3.522-.012 4.764-.069 1.15-.052 1.774-.244 2.19-.406.55-.214.943-.47 1.356-.882.413-.413.668-.806.882-1.356.162-.416.354-1.04.406-2.19.057-1.242.069-1.614.069-4.764 0-3.15-.012-3.522-.069-4.764-.052-1.15-.244-1.774-.406-2.19-.214-.55-.47-.943-.882-1.356-.413-.413-.806-.668-1.356-.882-.416-.162-1.04-.354-2.19-.406-1.242-.057-1.614-.069-4.764-.069zm0 3.508a6.167 6.167 0 1 1 0 12.334 6.167 6.167 0 0 1 0-12.334zm0 2.163a4.004 4.004 0 1 0 0 8.008 4.004 4.004 0 0 0 0-8.008zm6.406-3.846a1.441 1.441 0 1 1 0 2.883 1.441 1.441 0 0 1 0-2.883z" />
    </svg>
  )
}
