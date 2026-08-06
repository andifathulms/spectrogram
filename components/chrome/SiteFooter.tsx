import type { Copy } from '@/lib/i18n'

import { MakerSignature } from './MakerSignature'

/**
 * One seam. The attribution and the privacy claim keep the left; the maker's
 * mark takes the right on desktop and stacks under them on a phone. No second
 * divider — a credit line does not need its own rule to be read as separate
 * from what it sits beside.
 */
export function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="shell flex flex-col gap-6 py-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <div className="max-w-readable space-y-2">
          <p className="text-sm leading-relaxed text-inkFaint">{copy.footerCredit}</p>
          <p className="flex items-center gap-2 text-sm text-inkFaint">
            <span className="block h-1.5 w-1.5 rounded-full bg-instrument" aria-hidden />
            {copy.privacyBadge}
          </p>
        </div>

        <MakerSignature />
      </div>
    </footer>
  )
}
