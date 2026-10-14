import { splitUnit } from '@/lib/ui/format'

/**
 * A formatted quantity, number first and unit after it, quieter.
 *
 * Invariants 10 and 11: the unit is always rendered and the figures are
 * tabular. The split is display only — `value` arrives already formatted by
 * lib/ui/format, and this component decides weights, not digits.
 */
export function Quantity({ value, className = '' }: { value: string; className?: string }) {
  const parts = splitUnit(value)

  return (
    <span className={`tabular ${className}`}>
      <span className="font-medium">{parts.value}</span>
      {parts.unit !== '' && (
        <span className="ml-[0.3em] text-[0.85em] font-normal text-inkFaint">{parts.unit}</span>
      )}
    </span>
  )
}
