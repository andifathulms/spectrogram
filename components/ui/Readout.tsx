/**
 * A labelled numeric readout.
 *
 * Invariants 10 and 11 in one component: the value always carries its unit,
 * and it is always set in tabular figures so it cannot reflow as its digits
 * change. There is deliberately no way to render a bare number through this.
 */

interface Props {
  label: string
  /** Already formatted, unit included — see lib/ui/format. */
  value: string
  /** Highlights the value in instrument cyan. Annotation layer only. */
  emphasis?: boolean
  className?: string
}

export function Readout({ label, value, emphasis = false, className = '' }: Props) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="control-label truncate">{label}</div>
      <div
        className={`tabular mt-0.5 text-sm ${emphasis ? 'text-instrument' : 'text-energyHigh'}`}
      >
        {value}
      </div>
    </div>
  )
}

export function ReadoutRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">{children}</div>
  )
}
