import type { Copy } from '@/lib/i18n'

export function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="shell flex flex-col gap-3 py-8 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-readable text-sm leading-relaxed text-inkFaint">{copy.footerCredit}</p>
        <p className="flex shrink-0 items-center gap-2 text-sm text-inkFaint">
          <span className="block h-1.5 w-1.5 rounded-full bg-instrument" aria-hidden />
          {copy.privacyBadge}
        </p>
      </div>
    </footer>
  )
}
