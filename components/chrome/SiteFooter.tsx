import type { Copy } from '@/lib/i18n'

export function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="mt-16 border-t border-emulsion">
      <div className="mx-auto max-w-[1400px] px-5 py-6 text-xs leading-relaxed text-[#6f7c88]">
        {copy.footer}
      </div>
    </footer>
  )
}
