/**
 * Progressive disclosure, as a plain <details>.
 *
 * The advanced controls are not hidden because they are unimportant — they are
 * what the picture is made of — but a first-time visitor who meets window size,
 * overlap, window function and dynamic range at once will read none of them.
 * <details> keeps that decision in the browser: keyboard-operable, findable by
 * in-page search when open, and no JavaScript state to get wrong.
 */
export function Disclosure({
  title,
  help,
  children,
}: {
  title: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <details className="card group overflow-hidden">
      <summary className="flex items-center gap-3 px-5 py-4 hover:bg-raised/40">
        <span
          className="text-inkFaint transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden
        >
          ▸
        </span>
        <span className="text-sm text-ink">{title}</span>
        {help !== undefined && (
          <span className="ml-auto hidden text-sm text-inkFaint sm:block">{help}</span>
        )}
      </summary>
      <div className="border-t border-hairline p-5">{children}</div>
    </details>
  )
}
